const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk').default;
const { PDFParse } = require('pdf-parse');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted'));
    }
  }
});

app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

app.get('/favicon.ico', (req, res) => res.status(204).end());

const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, 'research_tutor_system_prompt.txt'),
  'utf-8'
);

const LIBRARY_PATH = path.join(__dirname, 'data', 'library.json');

function loadLibrary() {
  if (fs.existsSync(LIBRARY_PATH)) {
    return JSON.parse(fs.readFileSync(LIBRARY_PATH, 'utf-8'));
  }
  return [];
}

function saveLibrary(library) {
  fs.writeFileSync(LIBRARY_PATH, JSON.stringify(library, null, 2));
}

async function extractTextFromUrl(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ResearchTutor/1.0)',
      'Accept': 'text/html,application/xhtml+xml,text/plain'
    },
    signal: AbortSignal.timeout(15000)
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);
  }

  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/pdf')) {
    const buffer = await res.arrayBuffer();
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  $('script, style, nav, footer, header, aside, iframe, noscript').remove();

  const selectors = ['article', 'main', '.post-content', '.entry-content', '.article-body', '#content'];
  let content = '';
  for (const sel of selectors) {
    const el = $(sel);
    if (el.length && el.text().trim().length > 200) {
      content = el.text();
      break;
    }
  }

  if (!content) {
    content = $('body').text();
  }

  return content.replace(/\s+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

async function extractTextFromPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

app.post('/api/analyze/url', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({ error: 'Only HTTP/HTTPS URLs are allowed' });
  }

  try {
    const text = await extractTextFromUrl(url);
    if (text.length < 100) {
      return res.status(400).json({ error: 'Could not extract enough text from URL. Try uploading a PDF instead.' });
    }
    streamAnalysis(res, text, url);
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch URL: ${err.message}` });
  }
});

app.post('/api/analyze/pdf', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'PDF file is required' });
  }

  try {
    const text = await extractTextFromPdf(req.file.path);
    if (text.length < 100) {
      return res.status(400).json({ error: 'Could not extract enough text from PDF. The file may be image-based.' });
    }
    streamAnalysis(res, text, req.file.originalname);
  } catch (err) {
    res.status(500).json({ error: `Failed to parse PDF: ${err.message}` });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});

function streamAnalysis(res, paperText, source) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY environment variable is not set. Get one at console.anthropic.com' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  const truncated = paperText.slice(0, 80000);

  const client = new Anthropic({ apiKey });

  const userMessage = `Please analyze the following research paper/article using your structured framework. Here is the full text:\n\n---\n\n${truncated}\n\n---\n\nProvide your complete analysis following all 7 sections.`;

  (async () => {
    try {
      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          res.write(`data: ${JSON.stringify({ type: 'chunk', text: event.delta.text })}\n\n`);
        }
      }

      const finalMessage = await stream.finalMessage();
      const fullText = finalMessage.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('');

      const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        source,
        date: new Date().toISOString(),
        analysis: fullText
      };

      const library = loadLibrary();
      library.unshift(entry);
      saveLibrary(library);

      res.write(`data: ${JSON.stringify({ type: 'done', id: entry.id })}\n\n`);
      res.end();
    } catch (err) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    }
  })();
}

app.get('/api/library', (req, res) => {
  const library = loadLibrary();
  const summaries = library.map(({ id, source, date }) => ({ id, source, date }));
  res.json(summaries);
});

app.get('/api/library/:id', (req, res) => {
  const library = loadLibrary();
  const entry = library.find(e => e.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'Not found' });
  res.json(entry);
});

app.delete('/api/library/:id', (req, res) => {
  let library = loadLibrary();
  const before = library.length;
  library = library.filter(e => e.id !== req.params.id);
  if (library.length === before) return res.status(404).json({ error: 'Not found' });
  saveLibrary(library);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Research Tutor running at http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('WARNING: ANTHROPIC_API_KEY is not set. Analysis will fail until you set it.');
    console.warn('  export ANTHROPIC_API_KEY=sk-ant-...');
  }
});

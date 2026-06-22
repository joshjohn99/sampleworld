(function () {
  'use strict';

  const SECTION_MAP = {
    '1': { key: 'summary', label: 'Summary' },
    '2': { key: 'concepts', label: 'Core Concepts' },
    '3': { key: 'atlas', label: 'ATLAS Mapping' },
    '4': { key: 'offense_defense', label: 'Offense / Defense' },
    '5': { key: 'threats', label: 'Threat Landscape' },
    '6': { key: 'quiz', label: 'Quiz' },
    '7': { key: 'next', label: 'Next Steps' }
  };

  let fullResponse = '';
  let currentSource = '';

  // --- DOM refs ---
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const analyzeBtn = $('#analyze-btn');
  const urlInput = $('#url-input');
  const pdfInput = $('#pdf-input');
  const fileDrop = $('#file-drop');
  const fileName = $('#file-name');
  const progressPanel = $('#progress-panel');
  const streamPanel = $('#stream-panel');
  const streamContent = $('#stream-content');
  const resultsPanel = $('#results-panel');
  const resultsTabs = $('#results-tabs');
  const resultsContent = $('#results-content');
  const exportBtn = $('#export-btn');
  const newAnalysisBtn = $('#new-analysis-btn');

  // --- View switching ---
  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $$('.view').forEach(v => v.classList.add('hidden'));
      $(`#view-${btn.dataset.view}`).classList.remove('hidden');

      if (btn.dataset.view === 'library') loadLibrary();
    });
  });

  // --- Input tabs ---
  $$('.input-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.input-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      $$('.input-content').forEach(c => c.classList.add('hidden'));
      $(`#input-${tab.dataset.input}`).classList.remove('hidden');
    });
  });

  // --- File drop ---
  fileDrop.addEventListener('click', () => pdfInput.click());

  fileDrop.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDrop.classList.add('dragover');
  });

  fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('dragover'));

  fileDrop.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDrop.classList.remove('dragover');
    if (e.dataTransfer.files.length && e.dataTransfer.files[0].type === 'application/pdf') {
      pdfInput.files = e.dataTransfer.files;
      showFileName(e.dataTransfer.files[0].name);
    }
  });

  pdfInput.addEventListener('change', () => {
    if (pdfInput.files.length) showFileName(pdfInput.files[0].name);
  });

  function showFileName(name) {
    $('.file-drop-text').classList.add('hidden');
    fileName.textContent = name;
    fileName.classList.remove('hidden');
  }

  // --- Analyze ---
  analyzeBtn.addEventListener('click', startAnalysis);

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startAnalysis();
  });

  function startAnalysis() {
    const activeTab = $('.input-tab.active').dataset.input;

    if (activeTab === 'url') {
      const url = urlInput.value.trim();
      if (!url) return;
      currentSource = url;
      analyzeUrl(url);
    } else {
      if (!pdfInput.files.length) return;
      currentSource = pdfInput.files[0].name;
      analyzePdf(pdfInput.files[0]);
    }
  }

  function analyzeUrl(url) {
    resetUI();
    const eventSource = fetchSSE('/api/analyze/url', { method: 'POST', body: JSON.stringify({ url }), headers: { 'Content-Type': 'application/json' } });
    handleStream(eventSource);
  }

  function analyzePdf(file) {
    resetUI();
    const form = new FormData();
    form.append('pdf', file);
    const eventSource = fetchSSE('/api/analyze/pdf', { method: 'POST', body: form });
    handleStream(eventSource);
  }

  function resetUI() {
    fullResponse = '';
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';
    progressPanel.classList.remove('hidden');
    streamPanel.classList.remove('hidden');
    resultsPanel.classList.add('hidden');
    streamContent.textContent = '';
    $$('.step-indicator').forEach(s => {
      s.classList.remove('active', 'done');
    });
    removeErrors();
  }

  function removeErrors() {
    document.querySelectorAll('.error-msg').forEach(e => e.remove());
  }

  function showError(msg) {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze Paper';
    const div = document.createElement('div');
    div.className = 'error-msg';
    div.textContent = msg;
    $('.input-panel').appendChild(div);
  }

  // --- SSE via fetch (supports POST) ---
  function fetchSSE(url, opts) {
    const controller = { onmessage: null, onerror: null, ondone: null };

    fetch(url, opts).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        if (controller.onerror) controller.onerror(err.error || 'Request failed');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (controller.onmessage) controller.onmessage(data);
            } catch {}
          }
        }
      }
    }).catch((err) => {
      if (controller.onerror) controller.onerror(err.message);
    });

    return controller;
  }

  function handleStream(sse) {
    sse.onmessage = (data) => {
      if (data.type === 'chunk') {
        fullResponse += data.text;
        streamContent.textContent = fullResponse;
        streamPanel.scrollTop = streamPanel.scrollHeight;
        updateProgress(fullResponse);
      } else if (data.type === 'done') {
        onAnalysisComplete();
      } else if (data.type === 'error') {
        showError(data.message);
      }
    };

    sse.onerror = (msg) => showError(msg);
  }

  function updateProgress(text) {
    for (const num of Object.keys(SECTION_MAP)) {
      const pattern = new RegExp(`## ${num}\\.\\s`);
      const nextNum = String(Number(num) + 1);
      const nextPattern = new RegExp(`## ${nextNum}\\.\\s`);

      const indicator = $(`.step-indicator[data-step="${num}"]`);
      if (!indicator) continue;

      if (pattern.test(text)) {
        if (nextPattern.test(text)) {
          indicator.classList.remove('active');
          indicator.classList.add('done');
        } else {
          indicator.classList.add('active');
        }
      }
    }

    if (/## 7\.\s/.test(text) && text.length > text.indexOf('## 7.') + 100) {
      $(`.step-indicator[data-step="7"]`).classList.add('active');
    }
  }

  // --- Analysis complete ---
  function onAnalysisComplete() {
    $$('.step-indicator').forEach(s => {
      s.classList.remove('active');
      s.classList.add('done');
    });

    streamPanel.classList.add('hidden');
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze Paper';
    buildTabs(fullResponse);
    resultsPanel.classList.remove('hidden');
  }

  // --- Parse sections ---
  function parseSections(text) {
    const sections = {};
    const pattern = /## (\d)\.\s+[A-Z /]+\n/g;
    const matches = [...text.matchAll(pattern)];

    for (let i = 0; i < matches.length; i++) {
      const num = matches[i][1];
      const start = matches[i].index + matches[i][0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
      const content = text.slice(start, end).trim();
      if (SECTION_MAP[num]) {
        sections[SECTION_MAP[num].key] = content;
      }
    }

    return sections;
  }

  // --- Markdown rendering ---
  function renderMarkdown(md) {
    let html = md;

    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
    });

    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

    html = html.replace(/^\|(.+)\|$/gm, (match) => match);
    html = renderTables(html);

    html = html.replace(/<details>\s*/g, '<details>');
    html = html.replace(/<summary>(.+?)<\/summary>/g, '<summary>$1</summary>');
    html = html.replace(/\s*<\/details>/g, '</details>');

    html = html.replace(/^---$/gm, '<hr>');

    html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>');

    html = renderLists(html);

    html = html.replace(/(?<!\n)\n(?!\n)/g, ' ');
    html = html.replace(/\n{2,}/g, '</p><p>');
    html = '<p>' + html + '</p>';

    html = html.replace(/<p>\s*(<h[123]>)/g, '$1');
    html = html.replace(/(<\/h[123]>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<table>)/g, '$1');
    html = html.replace(/(<\/table>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<ol>)/g, '$1');
    html = html.replace(/(<\/ol>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<hr>)/g, '$1');
    html = html.replace(/(<hr>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<details>)/g, '$1');
    html = html.replace(/(<\/details>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*<\/p>/g, '');

    return html;
  }

  function renderTables(text) {
    return text.replace(/((?:^\|.+\|$\n?)+)/gm, (block) => {
      const rows = block.trim().split('\n').filter(r => r.startsWith('|'));
      if (rows.length < 2) return block;

      const isSep = (row) => /^\|[\s\-:|]+\|$/.test(row);
      const parseRow = (row) => row.split('|').slice(1, -1).map(c => c.trim());

      let html = '<table>';
      let headerDone = false;

      for (let i = 0; i < rows.length; i++) {
        if (isSep(rows[i])) { headerDone = true; continue; }
        const cells = parseRow(rows[i]);
        const tag = !headerDone ? 'th' : 'td';
        html += '<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>';
        if (!headerDone && i + 1 < rows.length && isSep(rows[i + 1])) {
          headerDone = true;
        }
      }

      return html + '</table>';
    });
  }

  function renderLists(text) {
    text = text.replace(/((?:^[-*] .+$\n?)+)/gm, (block) => {
      const items = block.trim().split('\n').map(l => l.replace(/^[-*] /, ''));
      return '<ul>' + items.map(i => `<li>${i}</li>`).join('') + '</ul>';
    });

    text = text.replace(/((?:^\d+\. .+$\n?)+)/gm, (block) => {
      const items = block.trim().split('\n').map(l => l.replace(/^\d+\. /, ''));
      return '<ol>' + items.map(i => `<li>${i}</li>`).join('') + '</ol>';
    });

    return text;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // --- Build tabs ---
  function buildTabs(text) {
    const sections = parseSections(text);
    resultsTabs.innerHTML = '';

    const allTab = document.createElement('button');
    allTab.className = 'results-tab active';
    allTab.textContent = 'Full Analysis';
    allTab.dataset.section = 'all';
    resultsTabs.appendChild(allTab);

    for (const num of Object.keys(SECTION_MAP)) {
      const info = SECTION_MAP[num];
      if (!sections[info.key]) continue;
      const btn = document.createElement('button');
      btn.className = 'results-tab';
      btn.textContent = info.label;
      btn.dataset.section = info.key;
      resultsTabs.appendChild(btn);
    }

    resultsContent.innerHTML = renderMarkdown(text);

    resultsTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.results-tab');
      if (!tab) return;

      resultsTabs.querySelectorAll('.results-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const sectionKey = tab.dataset.section;
      if (sectionKey === 'all') {
        resultsContent.innerHTML = renderMarkdown(text);
      } else if (sections[sectionKey]) {
        resultsContent.innerHTML = renderMarkdown(sections[sectionKey]);
      }
    });
  }

  // --- Export ---
  exportBtn.addEventListener('click', () => {
    const header = `# Research Tutor Analysis\n\n**Source:** ${currentSource}\n**Date:** ${new Date().toISOString().split('T')[0]}\n\n---\n\n`;
    const blob = new Blob([header + fullResponse], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-tutor-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // --- New analysis ---
  newAnalysisBtn.addEventListener('click', () => {
    fullResponse = '';
    currentSource = '';
    urlInput.value = '';
    pdfInput.value = '';
    $('.file-drop-text').classList.remove('hidden');
    fileName.classList.add('hidden');
    progressPanel.classList.add('hidden');
    streamPanel.classList.add('hidden');
    resultsPanel.classList.add('hidden');
    $$('.step-indicator').forEach(s => s.classList.remove('active', 'done'));
    removeErrors();
  });

  // --- Library ---
  async function loadLibrary() {
    const list = $('#library-list');
    try {
      const res = await fetch('/api/library');
      const items = await res.json();

      if (!items.length) {
        list.innerHTML = '<p class="empty-state">No analyses saved yet. Analyze a paper to get started.</p>';
        return;
      }

      list.innerHTML = items.map(item => `
        <div class="library-item" data-id="${item.id}">
          <div class="library-item-info">
            <div class="library-item-source">${escapeHtml(item.source)}</div>
            <div class="library-item-date">${new Date(item.date).toLocaleDateString()}</div>
          </div>
          <button class="library-delete" data-id="${item.id}" title="Delete">&times;</button>
        </div>
      `).join('');

      filterLibrary();
    } catch {
      list.innerHTML = '<p class="empty-state">Failed to load library.</p>';
    }
  }

  function filterLibrary() {
    const query = ($('#library-search').value || '').toLowerCase();
    $$('.library-item').forEach(item => {
      const source = item.querySelector('.library-item-source').textContent.toLowerCase();
      item.classList.toggle('hidden', query && !source.includes(query));
    });
  }

  $('#library-search').addEventListener('input', filterLibrary);

  document.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.library-delete');
    if (deleteBtn) {
      e.stopPropagation();
      await fetch(`/api/library/${deleteBtn.dataset.id}`, { method: 'DELETE' });
      loadLibrary();
      return;
    }

    const item = e.target.closest('.library-item');
    if (item) {
      try {
        const res = await fetch(`/api/library/${item.dataset.id}`);
        const entry = await res.json();
        fullResponse = entry.analysis;
        currentSource = entry.source;

        $$('.nav-btn').forEach(b => b.classList.remove('active'));
        $$('.nav-btn')[0].classList.add('active');
        $$('.view').forEach(v => v.classList.add('hidden'));
        $('#view-analyze').classList.remove('hidden');

        progressPanel.classList.add('hidden');
        streamPanel.classList.add('hidden');
        buildTabs(fullResponse);
        resultsPanel.classList.remove('hidden');
      } catch {}
    }
  });
})();

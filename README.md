# Research Tutor

A web application for learning about LLM and AI security through structured analysis of research papers. Paste a URL or upload a PDF, and the app breaks it down stage-by-stage using MITRE ATLAS mappings and offense/defense perspectives.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set your Anthropic API key (get one at console.anthropic.com)
export ANTHROPIC_API_KEY=sk-ant-...

# 3. Start the server
npm start
```

Open http://localhost:3000 in your browser.

## How It Works

1. Paste a URL or upload a PDF
2. The app extracts the text content
3. Claude analyzes the paper using a structured 7-step framework
4. Results stream in live, showing reasoning as it happens
5. Once complete, the analysis splits into navigable tabs
6. Export everything as a Markdown file

## The 7-Step Analysis Framework

| Step | Tab | Purpose |
|------|-----|---------|
| 1 | Summary | One-sentence summary, audience, problem statement |
| 2 | Core Concepts | 3-5 key ideas explained for security practitioners |
| 3 | ATLAS Mapping | Map to MITRE ATLAS tactics and techniques |
| 4 | Offense / Defense | Red team exploitation + blue team countermeasures |
| 5 | Threat Landscape | Real-world relevance and severity assessment |
| 6 | Quiz | Questions with hidden answers to verify understanding |
| 7 | Next Steps | Follow-up topics and remaining knowledge gaps |

## Project Structure

```
server.js                         # Express backend (API, PDF/URL extraction, Claude streaming)
research_tutor_system_prompt.txt  # System prompt (edit this to change analysis behavior)
public/
  index.html                      # Frontend layout
  style.css                       # Dark theme UI
  app.js                          # Client-side logic (streaming, tabs, markdown rendering)
tutor/
  atlas-reference.md              # MITRE ATLAS quick reference
  analysis-template.md            # Blank template for note-taking
  example-analysis.md             # Worked example: prompt injection
```

## Features

- **Live streaming**: Watch the analysis happen in real-time, not as one final block
- **Progress indicator**: See which analysis stage is currently running
- **Tabbed results**: Navigate between sections after analysis completes
- **Quiz with hidden answers**: Click to reveal answers for self-testing
- **Export to Markdown**: Save the full analysis including reasoning
- **Paper library**: Past analyses are saved and searchable
- **URL + PDF support**: Fetch articles from the web or upload PDFs directly

## Configuration

The system prompt lives in `research_tutor_system_prompt.txt`. Edit this file to change how the LLM analyzes papers — no code changes needed. The section headers (`## 1. SUMMARY`, `## 2. CORE CONCEPTS`, etc.) must stay consistent for tab parsing to work.

## API Key

This app requires an Anthropic API key from [console.anthropic.com](https://console.anthropic.com). This is separate from a Claude Pro subscription and is billed per token. Set it as an environment variable:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## Tech Stack

- **Backend**: Node.js + Express
- **AI**: Anthropic Claude API with streaming
- **PDF parsing**: pdf-parse
- **URL extraction**: cheerio (HTML parsing)
- **Frontend**: Vanilla HTML/CSS/JS (no build step)

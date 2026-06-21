# AI Security Research Tutor

An educational tool for learning about LLM and AI security through structured analysis of research papers. Maps findings to MITRE ATLAS and presents both offensive (red team) and defensive (blue team) perspectives.

## What This Is

A system prompt and reference framework that turns an LLM into a specialized tutor for AI security research. Feed it a paper, and it walks you through the key concepts, threat mappings, and practical implications using a consistent 7-step methodology.

## Structure

```
tutor/
  system-prompt.md      # The core tutor instructions (copy into your LLM)
  atlas-reference.md    # Quick reference for MITRE ATLAS tactics & techniques
  analysis-template.md  # Blank template for analyzing a new paper
  example-analysis.md   # Worked example: prompt injection analysis
```

## How to Use

1. Copy the contents of `tutor/system-prompt.md` as a system prompt in your LLM of choice
2. Paste or describe a security research paper you want to analyze
3. The tutor walks you through 7 structured steps, verifying understanding along the way
4. Use `tutor/atlas-reference.md` as a companion reference for MITRE ATLAS IDs
5. Use `tutor/analysis-template.md` to take your own notes alongside the session

## The 7-Step Analysis Framework

| Step | Purpose |
|------|---------|
| 1. Initial Scan & Summary | One-sentence summary, audience, problem statement |
| 2. Core Concepts Extraction | 3-5 key ideas explained for security practitioners |
| 3. ATLAS Mapping | Map to MITRE ATLAS tactics and techniques |
| 4. Offense/Defense Breakdown | Red team exploitation + blue team countermeasures |
| 5. Threat Landscape Context | Real-world relevance and severity assessment |
| 6. Knowledge Verification | Quiz questions to confirm understanding |
| 7. Next Steps | Follow-up topics and remaining knowledge gaps |

## Prerequisites

- Basic understanding of cybersecurity concepts (CIA triad, threat modeling)
- Familiarity with how LLMs work at a high level (prompts, tokens, inference)
- No deep ML/AI expertise required; the tutor explains prerequisites as they arise

## MITRE ATLAS

[MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems) is a knowledge base of adversary tactics and techniques targeting machine learning systems. This tutor uses ATLAS as its primary framework for categorizing and contextualizing AI threats.

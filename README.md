# Tide Cards

Anki-style flashcard study tool with optional text-to-speech audio, multi-deck support, and CSV import.

## Features

- Multiple decks (built-in Chapter 33 + CSV uploads)
- Question → reveal answer + short explanation
- Again / Hard / Good / Easy scheduling (no daily card limit — use **Study all**)
- Progress saved per deck in `localStorage`
- Audio via Web Speech API (local voices)
- CSV template + LLM prompt for generating decks

## CSV format

```csv
topic,question,answer,explanation
Porifera,What phylum do sponges belong to?,Porifera.,Porifera are the simplest animals and are filter feeders.
```

Download `tide-cards-template.csv` and `tide-cards-llm-prompt.txt` from the app (or `/public`).

## Run

```bash
npm install
npm run dev
```

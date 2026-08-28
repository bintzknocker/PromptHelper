# Prompt Maker

A single-page React app that walks you through describing a task, answering
tailored follow-up questions, and getting back a polished, ready-to-use AI
prompt.

## Stack

- React 19 + Vite
- Tailwind CSS v4
- lucide-react icons
- A small Express backend that proxies requests to the Anthropic API

## Setup

```bash
npm install
cp .env.example .env   # then add your ANTHROPIC_API_KEY
```

## Running

```bash
npm run dev:all   # starts both the Vite dev server and the API backend
```

The frontend runs at http://localhost:5173 and proxies `/api/*` requests to
the backend at http://localhost:4001.

To run them separately:

```bash
npm run dev      # frontend only
npm run server   # backend only
```

## Build

```bash
npm run build
```

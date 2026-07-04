# AIEditor

AI-powered code editor built with **Electron**, **React**, **Monaco Editor**, and an OpenAI-compatible AI API.

## Features (MVP)

- Monaco code editor with syntax highlighting
- File explorer with folder open/save
- AI chat sidebar with open-file context
- Integrated PowerShell/Bash terminal (xterm + node-pty)
- Diff preview with Keep All / Undo All
- Git status in status bar
- Vector DB scaffolding for multi-file reasoning (intermediate phase)

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env and set AI_API_KEY

# Run in development mode
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server + Electron |
| `npm run build` | Build renderer for production |
| `npm start` | Launch Electron (after build) |
| `npm test` | Run unit tests |

## Project Structure

```
AIEditor/
├── electron.js              # Electron entry
├── vite.config.js
├── src/
│   ├── main/                # Electron main process
│   ├── renderer/            # React + Monaco UI
│   ├── services/            # AI, diff, validation
│   ├── runtime/             # Terminal / CLI
│   ├── db/                  # Vector DB (chunking, embeddings)
│   └── utils/
└── tests/
```

## Configuration

Set these in `.env`:

| Variable | Description |
|----------|-------------|
| `AI_API_URL` | OpenAI-compatible chat endpoint |
| `AI_API_KEY` | Your API key |
| `AI_MODEL` | Model name (default: `gpt-4o-mini`) |

Without an API key, the chat runs in **demo mode** with placeholder responses.

## Roadmap

1. **MVP** — Monaco, chat, terminal, open-file context
2. **Intermediate** — Vector DB search, diff apply, dependency install, Git UI
3. **Advanced** — LSP, AI debugging, approval system, extensions

## Requirements

- Node.js 18+
- Windows: PowerShell (built-in)
- macOS/Linux: Bash

## Desktop Installer (Windows)

Build a one-click `.exe` installer:

```bash
npm run dist:win
```

Output: `release/AIEditor-Setup-0.1.0.exe`

Double-click the installer to install AIEditor. It creates:
- Start Menu shortcut
- Desktop shortcut
- Launches automatically after install

On first launch, a config file is created at:
`%APPDATA%/aieditor/.env` — edit this to set your `AI_API_KEY`.

Other packaging commands:

| Command | Description |
|---------|-------------|
| `npm run pack` | Unpacked app folder (for testing) |
| `npm run dist` | Installer for current OS |

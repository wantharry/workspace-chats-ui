# VS Code Chat Archive

A professional dark-theme UI for browsing, reading, and searching all your VS Code Copilot chat history.

## Features

- **Browse** all workspaces and chat sessions in a collapsible sidebar
- **Read** full chat transcripts with user/assistant message bubbles
- **Copy** any message to clipboard
- **Tool calls** displayed in collapsible accordion cards
- **In-chat search** — filter messages within a session
- **Global search** — search across ALL sessions with highlighted match context
- **Regex search** — toggle regex mode for advanced pattern matching
- **Live data** — reads directly from VS Code workspace storage (no manual export needed)

## Architecture

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite 8 |
| Styling | Tailwind CSS v4 + CSS variables |
| Icons | Lucide React |
| Backend API | Express 5 + tsx |
| Data Source | `C:\Users\...\AppData\Roaming\Code\User\workspaceStorage` (via WSL `/mnt/c/`) |

## Running

```bash
npm run dev        # Start both API server (port 3001) and Vite UI (port 5173)
npm run dev:api    # API only
npm run dev:ui     # UI only
```

Then open **http://localhost:5173**

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/workspaces` | All workspaces with session metadata |
| `GET /api/sessions/:id?workspaceId=` | Full session with parsed messages |
| `GET /api/search?q=&regex=false` | Global search across all sessions |

## Storage Path Detection

The server auto-detects VS Code workspace storage at:
1. `/mnt/c/Users/openclaw/AppData/Roaming/Code/User/workspaceStorage` (WSL)
2. `~/.config/Code/User/workspaceStorage` (native Linux)
3. `~/Library/Application Support/Code/User/workspaceStorage` (macOS)

## Notes

- Chat data (`.jsonl` files) is **not committed** — only UI code is in git
- All raw transcript data stays on disk, nothing is copied
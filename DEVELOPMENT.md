# Development Setup

## Quick Start

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Start development servers (choose one):**
   ```bash
   # Option 1: Using concurrently (cross-platform)
   npm run dev
   
   # Option 2: Using batch file (Windows)
   npm run dev:windows
   
   # Option 3: Using PowerShell (Windows)
   npm run dev:ps1
   ```

This will start both the frontend (React) and backend (Node.js) servers simultaneously.

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both servers using concurrently (recommended) |
| `npm run dev:windows` | Start both servers using Windows batch file |
| `npm run dev:ps1` | Start both servers using PowerShell script |
| `npm run client` | Start only the frontend (React) server |
| `npm run server` | Start only the backend (Node.js) server |
| `npm run install-all` | Install dependencies for both frontend and backend |
| `npm run setup` | Run the setup script to install all dependencies |
| `npm start` | Start only the frontend (same as `npm run client`) |

## URLs

- **Frontend (React)**: http://localhost:3000
- **Backend (API)**: http://localhost:5000

## Project Structure

```
walrus-client/
├── src/                    # React frontend source code
├── server/                 # Node.js backend source code
├── package.json           # Root package.json with dev scripts
└── server/package.json    # Backend package.json
```

## Development Workflow

1. Run `npm run dev` to start both servers
2. Make changes to frontend code in `src/`
3. Make changes to backend code in `server/`
4. Both servers will auto-reload on file changes

## Troubleshooting

- If you get port conflicts, make sure ports 3000 and 5000 are available
- If dependencies are missing, run `npm run install-all`
- If the backend fails to start, check if MongoDB is running

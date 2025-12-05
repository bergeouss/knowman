# KnowMan - Personal Knowledge Management System

KnowMan is a local-first, AI-powered knowledge management system that helps you capture, organize, and recall information from across the web and your digital life. Inspired by tools like Recall.ai, KnowMan provides a browser extension for capturing content, a web dashboard for organizing and reviewing knowledge, and a backend service for AI-powered processing.

## Architecture

KnowMan is built as a monorepo with four packages:

1. **`packages/extension`** - Browser extension (Chrome/Firefox) for capturing web content
2. **`packages/dashboard`** - Next.js web dashboard for organizing and reviewing knowledge
3. **`packages/backend`** - Node.js API server with background job processing
4. **`packages/types`** - Shared TypeScript types across all packages

### Tech Stack

- **Monorepo**: Bun workspaces for package management
- **Frontend**: React 19, TypeScript, Vite (extension), Next.js 15 (dashboard), Tailwind CSS
- **Backend**: Node.js, Express, TypeORM, SQLite, BullMQ (Redis)
- **AI Processing**: Local LLM support (Ollama) with fallback to cloud providers
- **Database**: SQLite for local-first data storage
- **Queue System**: BullMQ with Redis for background processing
- **Browser Extension**: Manifest V3 with webextension-polyfill

## Prerequisites

- [Bun](https://bun.sh/) (v1.0.0 or higher) - Package manager and runtime
- [Node.js](https://nodejs.org/) (v20.0.0 or higher) - JavaScript runtime
- [Redis](https://redis.io/) (v7.0 or higher) - For background job queues
- [SQLite](https://sqlite.org/) (v3.35 or higher) - For local database
- [Ollama](https://ollama.ai/) (optional) - For local LLM processing

## Quick Start

1. **Clone the repository** (if applicable)

2. **Install dependencies**:
   ```bash
   cd knowman
   bun install
   ```

3. **Set up environment variables**:
   ```bash
   cp packages/backend/.env.example packages/backend/.env
   # Edit .env with your configuration
   ```

4. **Start Redis** (required for background processing):
   ```bash
   # On macOS with Homebrew
   brew services start redis

   # On Linux
   sudo systemctl start redis

   # Or run in Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

5. **Run database migrations**:
   ```bash
   bun --cwd packages/backend migration:run
   ```

6. **Start all development servers**:
   ```bash
   bun dev
   ```

7. **Load the browser extension**:
   - Build the extension: `bun run build:extension`
   - Load `packages/extension/dist` as an unpacked extension in Chrome/Edge
   - Or use `bun run dev:extension` for development with hot reload

## Detailed Setup

### 1. Environment Configuration

Create a `.env` file in `packages/backend/` with the following variables:

```env
# Server
NODE_ENV=development
PORT=3001
HOST=localhost
VERSION=0.1.0

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Database
DATABASE_URL=sqlite:./data/knowman.db
DATABASE_LOGGING=false

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# Security
JWT_SECRET=change-me-in-production
API_KEY=

# LLM Configuration (local or remote)
LLM_PROVIDER=local  # local, openai, anthropic, groq
LLM_MODEL=llama3.2:3b
LLM_BASE_URL=http://localhost:11434  # Ollama default
LLM_API_KEY=
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2048

# Processing
MAX_CONTENT_LENGTH=100000
PROCESSING_WORKERS=2
PROCESSING_TIMEOUT=30000

# Logging
LOG_LEVEL=info
LOG_PRETTY=true
```

### 2. Database Setup

The application uses SQLite with TypeORM. Database files are stored in `packages/backend/data/`.

**First-time setup:**
```bash
# Create database directory
mkdir -p packages/backend/data

# Run migrations
bun --cwd packages/backend migration:run
```

**Generating new migrations:**
```bash
# After making changes to entities
bun --cwd packages/backend migration:generate -n MigrationName
```

### 3. Redis Setup

KnowMan uses BullMQ for background job processing, which requires Redis:

**Using Docker (recommended):**
```bash
docker run -d --name knowman-redis -p 6379:6379 redis:alpine
```

**Using system installation:**
- **macOS**: `brew install redis && brew services start redis`
- **Ubuntu/Debian**: `sudo apt install redis-server && sudo systemctl start redis`
- **Fedora**: `sudo dnf install redis && sudo systemctl start redis`

### 4. LLM Setup (Optional)

For AI-powered features (summarization, tagging, etc.), you can use:

1. **Local LLM (Ollama - recommended)**:
   ```bash
   # Install Ollama from https://ollama.ai/
   ollama pull llama3.2:3b
   # Start Ollama service
   ollama serve
   ```

2. **Cloud providers** (OpenAI, Anthropic, Groq):
   - Set `LLM_PROVIDER` to your preferred provider
   - Add your API key to `LLM_API_KEY`
   - Adjust `LLM_MODEL` as needed (e.g., `gpt-4-turbo-preview`)

## Development

### Running Services

**All services concurrently:**
```bash
bun dev
```

**Individual services:**
```bash
# Backend API (http://localhost:3001)
bun run dev:backend

# Dashboard (http://localhost:3000)
bun run dev:dashboard

# Browser extension (watch mode)
bun run dev:extension
```

### Browser Extension Development

The extension uses Vite with hot reload for development:

1. **Development build** (auto-reloads on changes):
   ```bash
   bun run dev:extension
   ```

2. **Load unpacked extension**:
   - Open Chrome/Edge browser
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `packages/extension/dist` directory

3. **Production build**:
   ```bash
   bun run build:extension
   # Creates extension.zip in packages/extension/
   ```

### API Endpoints

Backend API runs on `http://localhost:3001`:

- `GET /health` - Health check
- `GET /api/docs` - API documentation (Swagger UI)
- `POST /api/capture` - Capture web content
- `GET /api/items` - List knowledge items
- `POST /api/search` - Search knowledge items
- `GET /api/tags` - List tags
- `GET /api/processing/status` - Processing queue status

## Building for Production

**Build all packages:**
```bash
bun run build
```

**Individual builds:**
```bash
# Backend
bun run build:backend

# Dashboard
bun run build:dashboard

# Extension
bun run build:extension
```

**Start production backend:**
```bash
bun --cwd packages/backend start
```

## Testing

**Run all tests:**
```bash
bun run test
```

**Individual package tests:**
```bash
bun run test:backend
bun run test:dashboard
bun run test:extension
```

## Branch Protection

KnowMan includes branch protection rules for the main branch to ensure code quality and prevent direct pushes. The rules are defined in `.github/branch-protection.json`.

### Protection Rules
- **Required status checks**: CI workflow must pass (`test` job)
- **Required reviews**: At least 1 approving review for pull requests
- **Linear history**: No merge commits allowed
- **No force pushes**: Prevent rewriting history
- **Conversation resolution**: All review comments must be resolved
- **Admin enforcement**: Rules apply to repository admins too

### Applying Rules
```bash
# Using GitHub CLI
gh api repos/bergeouss/knowman/branches/main/protection --input .github/branch-protection.json
```

### Required Status Checks
The `test` job runs:
- Linting (ESLint)
- Type checking (TypeScript)
- Unit tests (Bun test)
- Build verification

## Database Schema

### Core Entities

1. **User** - System users (currently single-user focused)
2. **KnowledgeItem** - Captured content with metadata
3. **Tag** - User-defined tags for categorization
4. **ProcessingJob** - Background job tracking
5. **KnowledgeGraphNode** - Knowledge graph nodes
6. **KnowledgeGraphEdge** - Relationships between nodes

### Migration Commands

```bash
# Generate new migration
bun --cwd packages/backend migration:generate -n MigrationName

# Run migrations
bun --cwd packages/backend migration:run

# Revert last migration
bun --cwd packages/backend migration:revert
```

## Background Processing

KnowMan uses BullMQ with Redis for background processing jobs:

- **summarization** - Generate AI summaries of captured content
- **tagging** - Automatically tag content with relevant categories
- **embedding** - Create vector embeddings for semantic search
- **extraction** - Extract clean content from web pages

**Queue monitoring:**
- Visit `http://localhost:3001/api/processing/status` for queue stats
- Use Redis CLI: `redis-cli monitor` to see job activity

## Troubleshooting

### Common Issues

1. **Redis connection failed**:
   - Ensure Redis is running: `redis-cli ping` should return `PONG`
   - Check `REDIS_URL` in environment variables

2. **Database errors**:
   - Run migrations: `bun --cwd packages/backend migration:run`
   - Check file permissions for `packages/backend/data/`

3. **CORS errors**:
   - Ensure `CORS_ORIGINS` includes your frontend URLs
   - Default: `http://localhost:3000,http://localhost:5173`

4. **LLM processing fails**:
   - For local LLM: ensure Ollama is running (`ollama serve`)
   - Check `LLM_PROVIDER` and `LLM_BASE_URL` settings
   - For cloud providers: verify API key is set

### Logs

**Backend logs** are written to stdout with structured JSON format. Set `LOG_LEVEL=debug` for verbose logging.

**Browser extension logs** are available in the browser's developer console:
- Content script: Inspect the web page console
- Background script: Go to `chrome://extensions/` → "Service Worker"
- Popup: Right-click extension icon → "Inspect popup"

## Project Structure

```
knowman/
├── packages/
│   ├── extension/           # Browser extension
│   │   ├── src/
│   │   │   ├── popup/       # Extension popup UI
│   │   │   ├── background/  # Background script
│   │   │   ├── content/     # Content script for web pages
│   │   │   └── lib/         # Shared utilities
│   │   ├── manifest.json    # Extension manifest
│   │   └── vite.config.ts   # Build configuration
│   │
│   ├── dashboard/           # Next.js web dashboard
│   │   ├── src/
│   │   │   ├── app/         # Next.js app router pages
│   │   │   ├── components/  # React components
│   │   │   └── lib/         # Utilities and API clients
│   │   └── next.config.js   # Next.js configuration
│   │
│   ├── backend/            # Node.js API server
│   │   ├── src/
│   │   │   ├── api/        # Express route handlers
│   │   │   ├── database/   # TypeORM entities and migrations
│   │   │   ├── queues/     # BullMQ queue definitions
│   │   │   ├── workers/    # Background job processors
│   │   │   └── lib/        # Shared utilities
│   │   └── data/           # SQLite database files
│   │
│   └── types/              # Shared TypeScript types
│       └── src/
│           └── index.ts    # Type definitions
│
├── package.json            # Root package.json with workspaces
└── README.md              # This file
```

## Development Scripts

**Root package.json scripts:**
```bash
# Development
bun dev                    # Start all dev servers
bun run dev:extension      # Extension dev server
bun run dev:dashboard      # Dashboard dev server
bun run dev:backend        # Backend dev server

# Building
bun run build              # Build all packages
bun run build:extension    # Build extension
bun run build:dashboard    # Build dashboard
bun run build:backend      # Build backend

# Testing
bun run test               # Run all tests
bun run lint               # Lint all packages
bun run type-check         # Type check all packages

# Formatting
bun run format             # Format code with Prettier
```

## Contributing

1. Ensure all tests pass: `bun run test`
2. Run linter: `bun run lint`
3. Run type checker: `bun run type-check`
4. Format code: `bun run format`

## License

[MIT License](LICENSE)

## Acknowledgments

- Inspired by [Recall.ai](https://www.getrecall.ai/) and similar knowledge management tools
- Uses [Readability.js](https://github.com/mozilla/readability) for content extraction
- Built with [Bun](https://bun.sh/) for fast JavaScript tooling
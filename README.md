# BlackRoad Agents API

[![CI](https://github.com/BlackRoad-OS/agents-api/actions/workflows/ci.yml/badge.svg)](https://github.com/BlackRoad-OS/agents-api/actions/workflows/ci.yml)
[![Deploy](https://github.com/BlackRoad-OS/agents-api/actions/workflows/deploy.yml/badge.svg)](https://github.com/BlackRoad-OS/agents-api/actions/workflows/deploy.yml)
[![Security](https://github.com/BlackRoad-OS/agents-api/actions/workflows/security.yml/badge.svg)](https://github.com/BlackRoad-OS/agents-api/actions/workflows/security.yml)

REST API for 1,000 AI agents — powered by Cloudflare Workers + D1.

**Proprietary BlackRoad OS, Inc. — All Rights Reserved.**

## Architecture

- **Runtime**: Cloudflare Workers (edge-deployed, globally distributed)
- **Database**: Cloudflare D1 (SQLite at the edge)
- **CI/CD**: GitHub Actions (pinned to commit hashes)
- **Security**: Dependabot, CodeQL, npm audit, auto-merge for patches

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check and service info |
| `GET` | `/health` | Health check (alias) |
| `GET` | `/agents` | List all active agents (paginated) |
| `GET` | `/agents/:id` | Get a specific agent by ID |
| `GET` | `/agents/type/:type` | Get agents filtered by type |
| `GET` | `/agents/random` | Get a random active agent |
| `GET` | `/agents/search?q=` | Search agents by name, type, or capabilities |
| `GET` | `/agents/stats` | Get agent statistics |

### Query Parameters

| Parameter | Endpoint | Default | Max | Description |
|-----------|----------|---------|-----|-------------|
| `limit` | `/agents` | 50 | 100 | Results per page |
| `offset` | `/agents` | 0 | 10000 | Pagination offset |
| `q` | `/agents/search` | — | 100 chars | Search query |

## Usage Examples

### Health Check

```bash
curl https://blackroad-agents-api.<your-subdomain>.workers.dev/
```

```json
{
  "service": "BlackRoad Agents API",
  "version": "1.0.0",
  "status": "online",
  "agents_count": 1000,
  "endpoints": ["/agents", "/agents/:id", "/agents/type/:type", "/agents/random", "/agents/search?q=", "/agents/stats"]
}
```

### List Agents

```bash
curl https://blackroad-agents-api.<your-subdomain>.workers.dev/agents?limit=2
```

```json
{
  "agents": [
    { "id": "agent-0001", "name": "Alpha", "type": "assistant", "status": "active" },
    { "id": "agent-0002", "name": "Beta", "type": "researcher", "status": "active" }
  ],
  "count": 2,
  "limit": 2,
  "offset": 0
}
```

### Get Agent by ID

```bash
curl https://blackroad-agents-api.<your-subdomain>.workers.dev/agents/agent-0001
```

### Search Agents

```bash
curl https://blackroad-agents-api.<your-subdomain>.workers.dev/agents/search?q=assistant
```

### Agent Statistics

```bash
curl https://blackroad-agents-api.<your-subdomain>.workers.dev/agents/stats
```

```json
{
  "total": 1000,
  "by_type": [
    { "type": "assistant", "count": 250 },
    { "type": "researcher", "count": 200 }
  ]
}
```

## Development

### Prerequisites

- Node.js >= 20.0.0
- npm
- Cloudflare account with Workers and D1 enabled

### Setup

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run tests
npm test

# Lint
npm run lint

# Type check
npm run typecheck
```

### Deploy

```bash
# Deploy to production
npm run deploy

# Deploy to staging
npx wrangler deploy --env staging
```

## Security

- All GitHub Actions pinned to specific commit hashes (no tag-based resolution)
- Dependabot enabled for npm packages and GitHub Actions
- CodeQL static analysis runs on every push and PR
- Weekly security audits via scheduled workflows
- Auto-merge enabled for patch and minor dependency updates
- Input sanitization on all query parameters
- Security headers on all responses (nosniff, DENY framing, strict referrer)
- GET-only API surface (no mutation endpoints exposed)

## Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **CI** | Push/PR to main | Lint, test, typecheck |
| **Deploy** | Push to main / manual | Deploy to Cloudflare Workers |
| **Security** | Push/PR/weekly | Dependency audit + CodeQL |
| **Auto-merge** | Dependabot PRs | Auto-approve and merge patches |

## Configuration

### Required Secrets (GitHub)

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers write access |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account identifier |

### Environments

| Environment | Worker Name | Description |
|-------------|-------------|-------------|
| Default (dev) | `blackroad-agents-api` | Development with workers.dev |
| Staging | `blackroad-agents-api-staging` | Staging with workers.dev |
| Production | `blackroad-agents-api` | Production deployment |

## License

**PROPRIETARY** — BlackRoad OS, Inc. All Rights Reserved.

Copyright (c) 2024-2026 BlackRoad OS, Inc.
Founder, CEO & Sole Stockholder: Alexa Louise Amundson

This software is proprietary, confidential, and trade secret. See [LICENSE](LICENSE) for full terms.

This is NOT open source software. Unauthorized use, copying, modification, or distribution is strictly prohibited and subject to legal action.

# Infra Manager

A centralized infrastructure management and monitoring dashboard.

## Overview

Infra Manager provides a unified "Command Center" for shared infrastructure services (Postgres, Redis, MinIO, Qdrant, MongoDB). It solves the problem of redundant service instances across multiple applications, simplifying port management and reducing system resource consumption.

### Key Features

- **Centralized Dashboard**: A premium React interface for real-time monitoring.
- **Service Monitoring**: Displays health and status of Docker containers using the Docker API.
- **Detailed Insights**: View live metrics like Redis keys, Postgres databases/tables, MinIO buckets, Qdrant collections, and MongoDB databases/collections.
- **Connection Info**: Quick-copy connection strings for each service.
- **Quick Access**: Direct links to service consoles (e.g., MinIO Console, Qdrant Dashboard).
- **Resource Efficient**: Consolidates multiple service instances into a single shared stack.

## Service Ports

| Service   | Host      | Port(s)      | Purpose           |
|-----------|-----------|--------------|-------------------|
| Postgres  | localhost | 54321        | SQL Database      |
| Redis     | localhost | 63791        | Cache/Store       |
| MinIO     | localhost | 9000, 9001   | Object Storage    |
| Qdrant    | localhost | 6333, 6334   | Vector Database   |
| MongoDB   | localhost | 27018        | Document Database |
| Backend   | localhost | 8000         | API Server        |
| Frontend  | localhost | 5173         | Dashboard UI      |

## Architecture

The project consists of three main components:

1.  **Shared Infrastructure**: Defined in `docker-compose.yml`, managing Postgres, Redis, MinIO, Qdrant, and MongoDB containers.
2.  **Backend (FastAPI)**: A Python service that interacts with the Docker SDK to fetch container statuses and queries individual services for metrics.
3.  **Frontend (React + Vite)**: A modern, responsive dashboard built with Shadcn UI and Lucide icons.

```mermaid
graph TD
    User[User Browser] --> Frontend[Frontend React/Vite]
    Frontend --> Backend[Backend FastAPI]
    Backend --> Docker[Docker Engine API]
    Backend --> Postgres[PostgreSQL Metrics]
    Backend --> Redis[Redis Metrics]
    Backend --> MinIO[MinIO Metrics]
    Backend --> Qdrant[Qdrant Metrics]
    Backend --> MongoDB[MongoDB Metrics]
    
    subgraph "Infrastructure Stack"
        Postgres
        Redis
        MinIO
        Qdrant
        MongoDB
    end
```

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [uv](https://github.com/astral-sh/uv) (for Python package management)
- [pnpm](https://pnpm.io/) (for frontend package management)

### Quick Start

The project includes a `Makefile` to streamline development:

1.  **Launch all services** (Docker, Backend, and Frontend):
    ```bash
    make up
    ```
    This will start services in the background. Logs will be saved to the `logs/` directory at the root.

2.  **View Logs**:
    - Backend: `tail -f logs/backend.log` (or `make tail-backend`)
    - Frontend: `tail -f logs/frontend.log` (or `make tail-frontend`)

3.  **Stop Apps only**:
    ```bash
    make kill
    ```

4.  **Stop everything** (including Docker):
    ```bash
    make down
    ```

### Manual Installation

#### Backend
```bash
cd backend
uv sync
uv run main:app
```

#### Frontend
```bash
cd frontend
pnpm install
pnpm dev
```

## Project Structure

```text
.
├── backend/                # FastAPI application
│   ├── main.py            # API implementation and Docker integration
│   └── pyproject.toml     # Python dependencies (uv)
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # UI components (Shadcn UI)
│   │   ├── hooks/         # Custom React hooks (useServices)
│   │   └── App.tsx        # Main dashboard layout
│   └── pnpm-lock.yaml     # Frontend dependencies
├── docker-compose.yml      # Infrastructure service definitions
├── Makefile                # Development shortcuts
└── INFRA_MANAGER.md        # Original problem statement and vision
```

## Development

The frontend is configured with `verbatimModuleSyntax: true` in TypeScript, meaning interfaces must be imported using `import type`.

Example:
```typescript
import type { Service } from "@/hooks/use-services";
```

## License

MIT

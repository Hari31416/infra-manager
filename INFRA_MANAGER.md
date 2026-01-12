# Infrastructure Consolidation & Monitoring Service

## The Problem
Currently, multiple applications within this workspace (`codeagent`, `datara`, etc.) maintain their own independent infrastructure stacks. Each application's `docker-compose.yml` typically includes its own instances of:
- **PostgreSQL**
- **Redis**
- **MinIO**
- **Qdrant** (in some cases)

This leads to several issues:
1.  **Redundancy**: Multiple containers running the same service type consume unnecessary system resources (RAM, CPU, Disk).
2.  **Port Management Complexity**: Each instance must be mapped to a different host port to avoid conflicts, making it harder to track which service is on which port.
3.  **Maintenance Overhead**: Updating or monitoring these services requires checking multiple separate projects.
4.  **No Centralized View**: There is no single place to see the health and status of all shared infrastructure components.

## The Solution: Unified `infra` Service
We are creating a centralized infrastructure app located at `/home/ubuntu/apps/infra/`.

### Key Components:
1.  **Centralized `docker-compose.yml`**: A single location defining the shared instances of Postgres, Redis, Minio, and Qdrant.
2.  **Service Dashboard**: A premium, FastAPI-powered web interface that:
    - Lists all running infrastructure services.
    - Displays real-time health and status (using the Docker API).
    - Provides quick links to service consoles (e.g., MinIO Console).
3.  **Nginx Integration**: The dashboard will be accessible via `https://apps.hari31416.in/infra/`.

### Implementation Strategy:
- **Phase 1 (Creation)**: Build the `infra` directory, define the services, and implement the monitoring dashboard.
- **Phase 2 (Migration)**: Gradually update existing apps (`codeagent`, `datara`) to use the centralized services instead of their local ones, eventually removing the redundant service definitions from their respective `docker-compose.yml` files.

## Benefits
- **Resource Efficiency**: Significant reduction in memory and CPU footprint.
- **Simplified Networking**: Predictable port mappings for shared services.
- **Improved Visibility**: A single "Command Center" for all developer infrastructure.

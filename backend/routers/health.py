"""Health and Docker service listing endpoints."""

import logging

import docker
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])

# Docker client
try:
    docker_client = docker.from_env()
except Exception as e:
    logger.error(f"Failed to initialize Docker client: {e}")
    docker_client = None


@router.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@router.get("/services")
async def list_services():
    """Lists all shared infrastructure services and their status."""
    if not docker_client:
        return {"error": "Docker client not available"}

    services = []
    try:
        containers = docker_client.containers.list(all=True)
        for container in containers:
            # We only care about containers with 'infra-' prefix or specific names
            if container.name.startswith("infra-"):
                services.append(
                    {
                        "id": container.short_id,
                        "name": container.name,
                        "image": (
                            container.image.tags[0]
                            if container.image.tags
                            else "unknown"
                        ),
                        "status": container.status,
                        "health": container.attrs.get("State", {})
                        .get("Health", {})
                        .get("Status", "unknown"),
                    }
                )
    except Exception as e:
        logger.error(f"Error listing Docker containers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    return services

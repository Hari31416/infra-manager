import logging
from typing import Any, Dict, List

import boto3
import docker
import psycopg2
import redis
from botocore.config import Config
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from qdrant_client import QdrantClient

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Infra Manager API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Docker client
try:
    docker_client = docker.from_env()
except Exception as e:
    logger.error(f"Failed to initialize Docker client: {e}")
    docker_client = None


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/services")
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


@app.get("/services/redis")
async def redis_info():
    """Get detailed info from Redis."""
    try:
        r = redis.Redis(host="localhost", port=6379, decode_responses=True)
        info = r.info()
        return {
            "status": "connected",
            "version": info.get("redis_version"),
            "uptime_days": info.get("uptime_in_days"),
            "used_memory_human": info.get("used_memory_human"),
            "connected_clients": info.get("connected_clients"),
            "keys": r.dbsize(),
        }
    except Exception as e:
        logger.error(f"Redis connection error: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/services/postgres")
async def postgres_info():
    """Get detailed info from PostgreSQL."""
    try:
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            user="admin",
            password="password",
            dbname="main_db",
        )
        cur = conn.cursor()
        cur.execute("SELECT datname FROM pg_database WHERE datistemplate = false;")
        databases = [row[0] for row in cur.fetchall()]

        cur.execute("SELECT count(*) FROM pg_stat_activity;")
        connections = cur.fetchone()[0]

        cur.close()
        conn.close()

        return {
            "status": "connected",
            "databases": databases,
            "connections": connections,
        }
    except Exception as e:
        logger.error(f"Postgres connection error: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/services/minio")
async def minio_info():
    """Check MinIO health."""
    try:
        s3 = boto3.client(
            "s3",
            endpoint_url="http://localhost:9000",
            aws_access_key_id="admin",
            aws_secret_access_key="password123",
            config=Config(signature_version="s3v4"),
        )
        buckets = s3.list_buckets()
        return {"status": "connected", "buckets": len(buckets.get("Buckets", []))}
    except Exception as e:
        logger.error(f"MinIO connection error: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/services/qdrant")
async def qdrant_info():
    """Check Qdrant health."""
    try:
        client = QdrantClient(host="localhost", port=6333)
        collections = client.get_collections()
        return {"status": "connected", "collections": len(collections.collections)}
    except Exception as e:
        logger.error(f"Qdrant connection error: {e}")
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

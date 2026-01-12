import logging
from typing import Any, Dict, List

import boto3
import docker
import psycopg2
import redis
from botocore.config import Config
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
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
        r = redis.Redis(host="127.0.0.1", port=63791, decode_responses=True)
        info = r.info()
        return {
            "status": "connected",
            "host": "127.0.0.1",
            "port": 63791,
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
            host="127.0.0.1",
            port=54321,
            user="admin",
            password="password",
            dbname="main_db",
        )
        cur = conn.cursor()

        # Get all databases
        cur.execute("SELECT datname FROM pg_database WHERE datistemplate = false;")
        databases = [row[0] for row in cur.fetchall()]

        # Get connection count
        cur.execute("SELECT count(*) FROM pg_stat_activity;")
        connections = cur.fetchone()[0]

        # Get tables in current database (main_db)
        cur.execute(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """
        )
        tables = [row[0] for row in cur.fetchall()]

        # Get database sizes
        cur.execute(
            """
            SELECT datname, pg_size_pretty(pg_database_size(datname)) as size
            FROM pg_database
            WHERE datistemplate = false;
        """
        )
        db_sizes = {row[0]: row[1] for row in cur.fetchall()}

        cur.close()
        conn.close()

        # Get tables for each database
        databases_info = []
        for db_name in databases:
            db_conn = None
            try:
                db_conn = psycopg2.connect(
                    host="127.0.0.1",
                    port=54321,
                    user="admin",
                    password="password",
                    dbname=db_name,
                )
                db_cur = db_conn.cursor()
                db_cur.execute(
                    """
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    ORDER BY table_name;
                """
                )
                db_tables = [row[0] for row in db_cur.fetchall()]
                db_cur.close()
                databases_info.append(
                    {
                        "name": db_name,
                        "size": db_sizes.get(db_name),
                        "tables": db_tables,
                        "table_count": len(db_tables),
                    }
                )
            except Exception as e:
                logger.error(f"Error fetching tables for DB {db_name}: {e}")
                databases_info.append(
                    {
                        "name": db_name,
                        "size": db_sizes.get(db_name),
                        "tables": [],
                        "table_count": 0,
                    }
                )
            finally:
                if db_conn:
                    db_conn.close()

        return {
            "status": "connected",
            "host": "127.0.0.1",
            "port": 54321,
            "databases": databases_info,
            "database_count": len(databases_info),
            "connections": connections,
        }
    except Exception as e:
        logger.error(f"Postgres connection error: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/services/minio")
async def minio_info():
    """Get detailed info from MinIO."""
    try:
        s3 = boto3.client(
            "s3",
            endpoint_url="http://127.0.0.1:9000",
            aws_access_key_id="admin",
            aws_secret_access_key="password123",
            config=Config(signature_version="s3v4"),
        )
        buckets_response = s3.list_buckets()
        bucket_names = [b["Name"] for b in buckets_response.get("Buckets", [])]

        return {
            "status": "connected",
            "endpoint": "http://127.0.0.1:9000",
            "console_url": "http://127.0.0.1:9001",
            "buckets": bucket_names,
            "bucket_count": len(bucket_names),
        }
    except Exception as e:
        logger.error(f"MinIO connection error: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/services/qdrant")
async def qdrant_info():
    """Get detailed info from Qdrant."""
    try:
        client = QdrantClient(host="127.0.0.1", port=6333)
        collections_response = client.get_collections()

        collections_info = []
        for collection in collections_response.collections:
            try:
                col_info = client.get_collection(collection.name)
                collections_info.append(
                    {
                        "name": collection.name,
                        "vectors_count": col_info.vectors_count,
                        "points_count": col_info.points_count,
                    }
                )
            except Exception:
                collections_info.append(
                    {
                        "name": collection.name,
                        "vectors_count": 0,
                        "points_count": 0,
                    }
                )

        return {
            "status": "connected",
            "host": "127.0.0.1",
            "rest_port": 6333,
            "grpc_port": 6334,
            "dashboard_url": "http://127.0.0.1:6333/dashboard",
            "collections": collections_info,
            "collection_count": len(collections_info),
        }
    except Exception as e:
        logger.error(f"Qdrant connection error: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/services/mongodb")
async def mongodb_info():
    """Get detailed info from MongoDB."""
    try:
        client = MongoClient(
            "127.0.0.1",
            27018,
            username="admin",
            password="password",
            authSource="admin",
            serverSelectionTimeoutMS=5000,
        )
        # Test connection
        client.admin.command("ping")

        # Get list of databases (excluding system databases)
        db_names = [
            db
            for db in client.list_database_names()
            if db not in ["admin", "config", "local"]
        ]

        # Get collections for each database
        databases_info = []
        for db_name in db_names:
            db = client[db_name]
            collections = db.list_collection_names()
            databases_info.append(
                {
                    "name": db_name,
                    "collections": collections,
                    "collection_count": len(collections),
                }
            )

        client.close()

        return {
            "status": "connected",
            "host": "127.0.0.1",
            "port": 27018,
            "databases": databases_info,
            "database_count": len(databases_info),
        }
    except ConnectionFailure as e:
        logger.error(f"MongoDB connection error: {e}")
        return {"status": "error", "message": str(e)}
    except Exception as e:
        logger.error(f"MongoDB error: {e}")
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

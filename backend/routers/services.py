"""Service-specific endpoints including operations."""

from fastapi import APIRouter
from services.minio_service import MinioService
from services.mongodb_service import MongoDBService
from services.postgres_service import PostgresService
from services.qdrant_service import QdrantService
from services.redis_service import RedisService

router = APIRouter(prefix="/services", tags=["services"])


@router.get("/redis")
async def redis_info():
    """Get detailed info from Redis."""
    return RedisService.get_info()


@router.get("/postgres")
async def postgres_info():
    """Get detailed info from PostgreSQL."""
    return PostgresService.get_info()


@router.get("/minio")
async def minio_info():
    """Get detailed info from MinIO."""
    return MinioService.get_info()


@router.get("/qdrant")
async def qdrant_info():
    """Get detailed info from Qdrant."""
    return QdrantService.get_info()


@router.get("/mongodb")
async def mongodb_info():
    """Get detailed info from MongoDB."""
    return MongoDBService.get_info()


@router.delete("/postgres/databases/{db_name}")
async def drop_postgres_database(db_name: str):
    """Drop a PostgreSQL database."""
    return PostgresService.drop_database(db_name)


@router.delete("/minio/buckets/{bucket_name}")
async def drop_minio_bucket(bucket_name: str):
    """Drop a MinIO bucket."""
    return MinioService.drop_bucket(bucket_name)


@router.delete("/mongodb/databases/{db_name}")
async def drop_mongodb_database(db_name: str):
    """Drop a MongoDB database."""
    return MongoDBService.drop_database(db_name)

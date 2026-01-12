"""Centralized configuration for all infrastructure services."""

import os

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def get_env_int(key: str, default: int) -> int:
    """Helper to get an environment variable as an integer."""
    val = os.getenv(key)
    if val is None:
        return default
    try:
        return int(val)
    except ValueError:
        return default


# PostgreSQL Configuration
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "127.0.0.1")
POSTGRES_PORT = get_env_int("POSTGRES_PORT", 54321)
POSTGRES_USER = os.getenv("POSTGRES_USER", "admin")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password")
POSTGRES_DEFAULT_DB = os.getenv("POSTGRES_DEFAULT_DB", "main_db")
POSTGRES_PROTECTED_DBS = {"postgres", "template0", "template1"}

# Redis Configuration
REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
REDIS_PORT = get_env_int("REDIS_PORT", 63791)
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "password")

# MinIO Configuration
MINIO_ENDPOINT = os.getenv(
    "MINIO_ENDPOINT", f"http://127.0.0.1:{os.getenv('MINIO_PORT', '9000')}"
)
MINIO_CONSOLE_URL = os.getenv(
    "MINIO_CONSOLE_URL", f"http://127.0.0.1:{os.getenv('MINIO_CONSOLE_PORT', '9001')}"
)
MINIO_ACCESS_KEY = os.getenv("MINIO_ROOT_USER", "admin")
MINIO_SECRET_KEY = os.getenv("MINIO_ROOT_PASSWORD", "password123")

# Qdrant Configuration
QDRANT_HOST = os.getenv("QDRANT_HOST", "127.0.0.1")
QDRANT_REST_PORT = get_env_int("QDRANT_REST_PORT", 6333)
QDRANT_GRPC_PORT = get_env_int("QDRANT_GRPC_PORT", 6334)
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "password")
QDRANT_DASHBOARD_URL = os.getenv(
    "QDRANT_DASHBOARD_URL", f"http://127.0.0.1:{QDRANT_REST_PORT}/dashboard"
)

# MongoDB Configuration
MONGODB_HOST = os.getenv("MONGODB_HOST", "127.0.0.1")
MONGODB_PORT = get_env_int("MONGODB_PORT", 27018)
MONGODB_USER = os.getenv("MONGO_INITDB_ROOT_USERNAME", "admin")
MONGODB_PASSWORD = os.getenv("MONGO_INITDB_ROOT_PASSWORD", "password")
MONGODB_AUTH_SOURCE = os.getenv("MONGODB_AUTH_SOURCE", "admin")
MONGODB_PROTECTED_DBS = {"admin", "config", "local"}

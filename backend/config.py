"""Centralized configuration for all infrastructure services."""

# PostgreSQL Configuration
POSTGRES_HOST = "127.0.0.1"
POSTGRES_PORT = 54321
POSTGRES_USER = "admin"
POSTGRES_PASSWORD = "password"
POSTGRES_DEFAULT_DB = "main_db"
POSTGRES_PROTECTED_DBS = {"postgres", "template0", "template1"}

# Redis Configuration
REDIS_HOST = "127.0.0.1"
REDIS_PORT = 63791

# MinIO Configuration
MINIO_ENDPOINT = "http://127.0.0.1:9000"
MINIO_CONSOLE_URL = "http://127.0.0.1:9001"
MINIO_ACCESS_KEY = "admin"
MINIO_SECRET_KEY = "password123"

# Qdrant Configuration
QDRANT_HOST = "127.0.0.1"
QDRANT_REST_PORT = 6333
QDRANT_GRPC_PORT = 6334
QDRANT_DASHBOARD_URL = "http://127.0.0.1:6333/dashboard"

# MongoDB Configuration
MONGODB_HOST = "127.0.0.1"
MONGODB_PORT = 27018
MONGODB_USER = "admin"
MONGODB_PASSWORD = "password"
MONGODB_AUTH_SOURCE = "admin"
MONGODB_PROTECTED_DBS = {"admin", "config", "local"}

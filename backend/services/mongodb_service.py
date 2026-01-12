"""MongoDB service module."""

import logging
from typing import Any, Dict, List

from config import (
    MONGODB_AUTH_SOURCE,
    MONGODB_HOST,
    MONGODB_PASSWORD,
    MONGODB_PORT,
    MONGODB_PROTECTED_DBS,
    MONGODB_USER,
)
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

logger = logging.getLogger(__name__)


class MongoDBService:
    """Service class for MongoDB operations."""

    @staticmethod
    def _get_client() -> MongoClient:
        """Get MongoDB client."""
        return MongoClient(
            MONGODB_HOST,
            MONGODB_PORT,
            username=MONGODB_USER,
            password=MONGODB_PASSWORD,
            authSource=MONGODB_AUTH_SOURCE,
            serverSelectionTimeoutMS=5000,
        )

    @staticmethod
    def get_info() -> Dict[str, Any]:
        """Get detailed info from MongoDB."""
        try:
            client = MongoDBService._get_client()
            # Test connection
            client.admin.command("ping")

            # Get list of databases (excluding system databases)
            db_names = [
                db
                for db in client.list_database_names()
                if db not in MONGODB_PROTECTED_DBS
            ]

            # Get collections for each database
            databases_info: List[Dict[str, Any]] = []
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
                "host": MONGODB_HOST,
                "port": MONGODB_PORT,
                "databases": databases_info,
                "database_count": len(databases_info),
            }
        except ConnectionFailure as e:
            logger.error(f"MongoDB connection error: {e}")
            return {"status": "error", "message": str(e)}
        except Exception as e:
            logger.error(f"MongoDB error: {e}")
            return {"status": "error", "message": str(e)}

    @staticmethod
    def drop_database(db_name: str) -> Dict[str, Any]:
        """Drop a MongoDB database."""
        # Check if database is protected
        if db_name in MONGODB_PROTECTED_DBS:
            return {
                "status": "error",
                "message": f"Cannot drop protected database: {db_name}",
            }

        try:
            client = MongoDBService._get_client()

            # Check if database exists
            if db_name not in client.list_database_names():
                client.close()
                return {"status": "error", "message": f"Database {db_name} not found"}

            # Drop the database
            client.drop_database(db_name)
            client.close()

            logger.info(f"Successfully dropped database: {db_name}")
            return {
                "status": "success",
                "message": f"Database {db_name} dropped successfully",
            }
        except Exception as e:
            logger.error(f"Error dropping database {db_name}: {e}")
            return {"status": "error", "message": str(e)}

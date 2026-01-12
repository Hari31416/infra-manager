"""Qdrant service module."""

import logging
from typing import Any, Dict

from config import QDRANT_DASHBOARD_URL, QDRANT_GRPC_PORT, QDRANT_HOST, QDRANT_REST_PORT
from qdrant_client import QdrantClient

logger = logging.getLogger(__name__)


class QdrantService:
    """Service class for Qdrant operations."""

    @staticmethod
    def get_info() -> Dict[str, Any]:
        """Get detailed info from Qdrant."""
        try:
            client = QdrantClient(host=QDRANT_HOST, port=QDRANT_REST_PORT)
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
                "host": QDRANT_HOST,
                "rest_port": QDRANT_REST_PORT,
                "grpc_port": QDRANT_GRPC_PORT,
                "dashboard_url": QDRANT_DASHBOARD_URL,
                "collections": collections_info,
                "collection_count": len(collections_info),
            }
        except Exception as e:
            logger.error(f"Qdrant connection error: {e}")
            return {"status": "error", "message": str(e)}

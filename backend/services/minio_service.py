"""MinIO service module."""

import logging
from typing import Any, Dict, List

import boto3
from botocore.config import Config
from config import MINIO_ACCESS_KEY, MINIO_CONSOLE_URL, MINIO_ENDPOINT, MINIO_SECRET_KEY

logger = logging.getLogger(__name__)


class MinioService:
    """Service class for MinIO operations."""

    @staticmethod
    def _get_client():
        """Get MinIO S3 client."""
        return boto3.client(
            "s3",
            endpoint_url=MINIO_ENDPOINT,
            aws_access_key_id=MINIO_ACCESS_KEY,
            aws_secret_access_key=MINIO_SECRET_KEY,
            config=Config(signature_version="s3v4"),
        )

    @staticmethod
    def get_info() -> Dict[str, Any]:
        """Get detailed info from MinIO."""
        try:
            s3 = MinioService._get_client()
            buckets_response = s3.list_buckets()
            bucket_names: List[str] = [
                b["Name"] for b in buckets_response.get("Buckets", [])
            ]

            return {
                "status": "connected",
                "endpoint": MINIO_ENDPOINT,
                "console_url": MINIO_CONSOLE_URL,
                "buckets": bucket_names,
                "bucket_count": len(bucket_names),
            }
        except Exception as e:
            logger.error(f"MinIO connection error: {e}")
            return {"status": "error", "message": str(e)}

    @staticmethod
    def drop_bucket(bucket_name: str) -> Dict[str, Any]:
        """Drop a MinIO bucket."""
        try:
            s3 = MinioService._get_client()

            # Check if bucket exists
            try:
                s3.head_bucket(Bucket=bucket_name)
            except Exception:
                return {
                    "status": "error",
                    "message": f"Bucket {bucket_name} not found",
                }

            # List and delete all objects in the bucket first
            try:
                response = s3.list_objects_v2(Bucket=bucket_name)
                if "Contents" in response:
                    objects = [{"Key": obj["Key"]} for obj in response["Contents"]]
                    s3.delete_objects(Bucket=bucket_name, Delete={"Objects": objects})
            except Exception as e:
                logger.warning(f"Error deleting objects from bucket {bucket_name}: {e}")

            # Delete the bucket
            s3.delete_bucket(Bucket=bucket_name)

            logger.info(f"Successfully dropped bucket: {bucket_name}")
            return {
                "status": "success",
                "message": f"Bucket {bucket_name} dropped successfully",
            }
        except Exception as e:
            logger.error(f"Error dropping bucket {bucket_name}: {e}")
            return {"status": "error", "message": str(e)}

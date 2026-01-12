"""PostgreSQL service module."""

import logging
from typing import Any, Dict, List

import psycopg2
from config import (
    POSTGRES_DEFAULT_DB,
    POSTGRES_HOST,
    POSTGRES_PASSWORD,
    POSTGRES_PORT,
    POSTGRES_PROTECTED_DBS,
    POSTGRES_USER,
)

logger = logging.getLogger(__name__)


class PostgresService:
    """Service class for PostgreSQL operations."""

    @staticmethod
    def get_info() -> Dict[str, Any]:
        """Get detailed info from PostgreSQL."""
        try:
            conn = psycopg2.connect(
                host=POSTGRES_HOST,
                port=POSTGRES_PORT,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
                dbname=POSTGRES_DEFAULT_DB,
            )
            cur = conn.cursor()

            # Get all databases
            cur.execute("SELECT datname FROM pg_database WHERE datistemplate = false;")
            databases = [row[0] for row in cur.fetchall()]

            # Get connection count
            cur.execute("SELECT count(*) FROM pg_stat_activity;")
            connections = cur.fetchone()[0]

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
            databases_info: List[Dict[str, Any]] = []
            for db_name in databases:
                db_conn = None
                try:
                    db_conn = psycopg2.connect(
                        host=POSTGRES_HOST,
                        port=POSTGRES_PORT,
                        user=POSTGRES_USER,
                        password=POSTGRES_PASSWORD,
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
                "host": POSTGRES_HOST,
                "port": POSTGRES_PORT,
                "databases": databases_info,
                "database_count": len(databases_info),
                "connections": connections,
            }
        except Exception as e:
            logger.error(f"Postgres connection error: {e}")
            return {"status": "error", "message": str(e)}

    @staticmethod
    def drop_database(db_name: str) -> Dict[str, Any]:
        """Drop a PostgreSQL database."""
        # Check if database is protected
        if db_name in POSTGRES_PROTECTED_DBS:
            return {
                "status": "error",
                "message": f"Cannot drop protected database: {db_name}",
            }

        try:
            # Connect to default database to drop the target database
            conn = psycopg2.connect(
                host=POSTGRES_HOST,
                port=POSTGRES_PORT,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
                dbname=POSTGRES_DEFAULT_DB,
            )
            conn.autocommit = True
            cur = conn.cursor()

            # Check if database exists
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s;", (db_name,))
            if not cur.fetchone():
                cur.close()
                conn.close()
                return {"status": "error", "message": f"Database {db_name} not found"}

            # Terminate all connections to the database
            cur.execute(
                """
                SELECT pg_terminate_backend(pg_stat_activity.pid)
                FROM pg_stat_activity
                WHERE pg_stat_activity.datname = %s
                AND pid <> pg_backend_pid();
            """,
                (db_name,),
            )

            # Drop the database
            cur.execute(f'DROP DATABASE "{db_name}";')

            cur.close()
            conn.close()

            logger.info(f"Successfully dropped database: {db_name}")
            return {
                "status": "success",
                "message": f"Database {db_name} dropped successfully",
            }
        except Exception as e:
            logger.error(f"Error dropping database {db_name}: {e}")
            return {"status": "error", "message": str(e)}

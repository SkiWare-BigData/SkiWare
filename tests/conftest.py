import os
import pathlib

import pytest

from backend.db.connection import close_connection, get_db, init_connection


@pytest.fixture(scope="session", autouse=True)
def db_connection():
    """Initialize a real DB connection for the test session.

    Uses local Docker postgres by default. Override with env vars for Cloud SQL:
      CLOUD_SQL_INSTANCE, DB_NAME, DB_USER
    """
    os.environ.setdefault("DB_HOST", "localhost")
    os.environ.setdefault("DB_PORT", "5432")
    os.environ.setdefault("DB_NAME", "skiware")
    os.environ.setdefault("DB_USER", "skiware")
    os.environ.setdefault("DB_PASSWORD", "skiware")

    init_connection()

    # Apply migration so tables exist
    conn = get_db()
    cursor = conn.cursor()
    migration = pathlib.Path(__file__).parent.parent / "migrations" / "001_init.sql"
    sql = migration.read_text()
    for stmt in sql.split(";"):
        stmt = stmt.strip()
        if stmt:
            cursor.execute(stmt)
    conn.commit()
    cursor.close()

    yield

    close_connection()

import os
import logging

import pg8000
from google.cloud.sql.connector import Connector

logger = logging.getLogger(__name__)


def get_connection() -> pg8000.Connection:
    instance = os.environ["CLOUD_SQL_INSTANCE"]
    db_name = os.environ["DB_NAME"]
    db_user = os.environ["DB_USER"]
    password = os.environ.get("DB_PASSWORD")

    connector = Connector()

    kwargs: dict = {"db": db_name, "user": db_user}
    if password:
        kwargs["password"] = password
    else:
        kwargs["enable_iam_auth"] = True

    logger.info(f"Connecting to Cloud SQL instance {instance} as {db_user}")
    conn = connector.connect(instance, "pg8000", **kwargs)
    return conn

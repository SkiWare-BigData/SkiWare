import os

# Must be set in production. A random 32-byte hex string works well:
#   python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY: str = os.environ.get("SECRET_KEY", "change-me-in-production")
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS: int = 7

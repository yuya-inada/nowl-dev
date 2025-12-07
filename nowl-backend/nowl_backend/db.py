# nowl_backend/db.py

import os
from databases import Database
from dotenv import load_dotenv

load_dotenv("/Users/inadayuuya/nowl-dev/.env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

database = Database(DATABASE_URL)
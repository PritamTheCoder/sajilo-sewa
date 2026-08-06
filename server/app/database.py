from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv
import os

load_dotenv()

# Normalize legacy postgres:// URLs (Render, Heroku-style) — SQLAlchemy 2.0 requires postgresql://.
_database_url = os.getenv('DATABASE_URL')
if _database_url and _database_url.startswith('postgres://'):
    _database_url = _database_url.replace('postgres://', 'postgresql://', 1)

engine = create_engine(_database_url, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency: yields a DB session and ensures it is closed after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

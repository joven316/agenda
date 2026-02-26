from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "/app/data/agenda.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_URL}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite specific
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for FastAPI routes"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def migrate_add_is_note():
    """Add is_note column to existing databases. Safe to run repeatedly."""
    with engine.connect() as conn:
        try:
            conn.execute(text(
                "ALTER TABLE tasks ADD COLUMN is_note BOOLEAN NOT NULL DEFAULT 0"
            ))
            conn.commit()
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                pass  # Column already exists — expected on re-run or fresh DB
            else:
                raise


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    migrate_add_is_note()

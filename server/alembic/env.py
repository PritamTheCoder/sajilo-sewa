from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

import os
from dotenv import load_dotenv

load_dotenv()

from alembic import context

config = context.config
# Not setting sqlalchemy.url here because % in passwords breaks configparser interpolation

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

from app.database import Base
from app.models import *  # noqa: F403 - import all models so Alembic's autogenerate sees them
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations without a DBAPI connection (emits SQL only)."""
    url = os.getenv("DATABASE_URL")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against a live DB connection."""
    from sqlalchemy import create_engine
    connectable = create_engine(os.getenv("DATABASE_URL"), poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

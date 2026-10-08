"""Environment configuration loader.

Reads .env file and provides typed configuration for the application.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv


@dataclass(frozen=True)
class Settings:
    """Application settings loaded from environment variables."""

    APP_PASSWORD: str = field(repr=False)
    SECRET_KEY: str = field(repr=False)
    MAX_FILE_SIZE_MB: int = 50
    PROCESSING_DIR: Path = Path("processing")


def load_settings() -> Settings:
    """Load and validate settings from .env file and environment."""
    load_dotenv()

    app_password = os.getenv("APP_PASSWORD", "")
    secret_key = os.getenv("SECRET_KEY", "")
    max_file_size_mb = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
    processing_dir = Path(os.getenv("PROCESSING_DIR", "processing"))

    if not app_password:
        raise RuntimeError("APP_PASSWORD must be set in .env file")
    if not secret_key:
        raise RuntimeError("SECRET_KEY must be set in .env file")

    return Settings(
        APP_PASSWORD=app_password,
        SECRET_KEY=secret_key,
        MAX_FILE_SIZE_MB=max_file_size_mb,
        PROCESSING_DIR=processing_dir.resolve(),
    )


settings = load_settings()

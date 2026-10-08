"""Cleanup script — delete files in processing/ older than 1 hour."""

from __future__ import annotations

import time
from pathlib import Path

PROCESSING_DIR = Path("processing")
MAX_AGE_SECONDS = 3600  # 1 hour


def _clean_directory(directory: Path) -> tuple[int, int]:
    """Delete files older than MAX_AGE_SECONDS in the given directory.

    Returns:
        (deleted_count, remaining_count)
    """
    now = time.time()
    deleted = 0
    remaining = 0
    if not directory.exists():
        return 0, 0
    for f in directory.iterdir():
        if f.is_file():
            age = now - f.stat().st_mtime
            if age > MAX_AGE_SECONDS:
                f.unlink()
                deleted += 1
            else:
                remaining += 1
    return deleted, remaining


def main() -> None:
    """Run cleanup on uploads and results directories."""
    uploads = PROCESSING_DIR / "uploads"
    results = PROCESSING_DIR / "results"

    del_up, rem_up = _clean_directory(uploads)
    del_res, rem_res = _clean_directory(results)

    total_deleted = del_up + del_res
    total_remaining = rem_up + rem_res
    print(f"Cleanup: deleted {total_deleted} file(s), {total_remaining} remaining")


if __name__ == "__main__":
    main()

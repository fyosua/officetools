"""PDF Editor — add text annotations and watermarks to PDF pages."""

from __future__ import annotations

from pathlib import Path

import fitz  # PyMuPDF


def add_text_annotation(file_path: Path, text: str, page: int = 1, x: float = 100, y: float = 100) -> Path:
    """Add a text annotation to a specific page of a PDF.

    Args:
        file_path: Path to the input PDF.
        text: Text to add.
        page: Page number (1-indexed).
        x: X position in points.
        y: Y position in points.

    Returns:
        Path to the edited PDF.

    Raises:
        ValueError: If coordinates are negative.
        IndexError: If page number is out of range.
    """
    if x < 0 or y < 0:
        raise ValueError("Coordinates must be non-negative")

    doc = fitz.open(str(file_path))
    if page < 1 or page > len(doc):
        raise IndexError(f"Page {page} is out of range (1-{len(doc)})")

    p = doc[page - 1]
    rect = fitz.Rect(x, y, x + 200, y + 30)
    p.insert_textbox(rect, text, fontsize=12, color=(0, 0, 0))

    output = file_path.parent.parent / "results" / f"edited_{file_path.stem}.pdf"
    doc.save(str(output))
    doc.close()
    return output

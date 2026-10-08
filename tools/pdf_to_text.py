"""PDF to Text — extract plain text from PDFs."""

from __future__ import annotations

from pathlib import Path

from pypdf import PdfReader


def pdf_to_text(file_path: Path) -> str:
    """Extract plain text from a PDF file.

    Args:
        file_path: Path to the input PDF.

    Returns:
        Extracted text content.
    """
    reader = PdfReader(file_path)
    text_parts: list[str] = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            text_parts.append(text)
    return "\n\n".join(text_parts)

"""PDF Merge — combine multiple PDFs into one."""

from __future__ import annotations

from pathlib import Path

from pypdf import PdfWriter


def merge_pdfs(file_paths: list[Path]) -> Path:
    """Merge multiple PDFs into a single PDF.

    Args:
        file_paths: List of paths to PDF files to merge, in order.

    Returns:
        Path to the merged PDF file.

    Raises:
        ValueError: If the file list is empty.
    """
    if not file_paths:
        raise ValueError("At least one PDF file is required")

    writer = PdfWriter()
    for path in file_paths:
        reader = Path(path)
        writer.append(reader)

    output = file_paths[0].parent.parent / "results" / f"merged_{Path(path).stem}.pdf"
    with open(output, "wb") as f:
        writer.write(f)

    return output

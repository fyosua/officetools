"""PDF Rotate — rotate PDF pages."""

from __future__ import annotations

from pathlib import Path

from pypdf import PdfReader, PdfWriter


def rotate_pdf(file_path: Path, pages: str = "all", angle: int = 90) -> Path:
    """Rotate pages in a PDF.

    Args:
        file_path: Path to the input PDF.
        pages: 'all' or comma-separated page numbers (1-indexed).
        angle: Rotation angle in degrees (90, 180, 270).

    Returns:
        Path to the rotated PDF.

    Raises:
        ValueError: If angle is not 90, 180, or 270.
    """
    if angle not in (90, 180, 270):
        raise ValueError(f"Invalid angle: {angle}. Use 90, 180, or 270.")

    reader = PdfReader(file_path)
    writer = PdfWriter()

    if pages == "all":
        target_pages = list(range(len(reader.pages)))
    else:
        target_pages = [int(p.strip()) - 1 for p in pages.split(",")]

    for i, page in enumerate(reader.pages):
        if i in target_pages:
            page.rotate(angle)
        writer.add_page(page)

    output = file_path.parent.parent / "results" / f"rotated_{file_path.stem}.pdf"
    with open(output, "wb") as f:
        writer.write(f)
    return output
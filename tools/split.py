"""PDF Split — split a PDF by page range."""

from __future__ import annotations

from pathlib import Path

from pypdf import PdfReader, PdfWriter


def _parse_ranges(ranges: str, total_pages: int) -> list[range]:
    """Parse a page range string like '1-3,5,7-9' or 'every 2'.

    Args:
        ranges: Page range specification.
        total_pages: Total number of pages in the PDF.

    Returns:
        List of page ranges (0-indexed).

    Raises:
        ValueError: If the range string is invalid.
    """
    if ranges.startswith("every "):
        try:
            n = int(ranges.split(" ")[1])
        except (IndexError, ValueError):
            raise ValueError(f"Invalid 'every N' syntax: {ranges}")
        return [range(i, min(i + n, total_pages)) for i in range(0, total_pages, n)]

    parts = ranges.split(",")
    result: list[range] = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            try:
                start, end = part.split("-")
                start_idx = int(start.strip()) - 1
                end_idx = int(end.strip())
            except ValueError:
                raise ValueError(f"Invalid range: {part}")
            if start_idx < 0 or end_idx > total_pages:
                raise IndexError(f"Range {part} is out of bounds (1-{total_pages})")
            result.append(range(start_idx, end_idx))
        else:
            idx = int(part) - 1
            if idx < 0 or idx >= total_pages:
                raise IndexError(f"Page {part} is out of bounds (1-{total_pages})")
            result.append(range(idx, idx + 1))
    return result


def split_pdf(file_path: Path, ranges: str = "all") -> list[Path]:
    """Split a PDF by page range.

    Args:
        file_path: Path to the input PDF.
        ranges: Page range string ('1-3,5', 'every 2', or 'all').

    Returns:
        List of paths to the split PDF files.

    Raises:
        ValueError: If the file is empty or ranges are invalid.
    """
    reader = PdfReader(file_path)
    total_pages = len(reader.pages)
    if total_pages == 0:
        raise ValueError("PDF has no pages")

    if ranges == "all":
        page_ranges = [range(i, i + 1) for i in range(total_pages)]
    else:
        page_ranges = _parse_ranges(ranges, total_pages)

    output_dir = file_path.parent.parent / "results"
    output_paths: list[Path] = []

    for i, prange in enumerate(page_ranges, 1):
        writer = PdfWriter()
        for page_num in prange:
            writer.add_page(reader.pages[page_num])
        output = output_dir / f"split_{i}_{file_path.stem}.pdf"
        with open(output, "wb") as f:
            writer.write(f)
        output_paths.append(output)

    return output_paths

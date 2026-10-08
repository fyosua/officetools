"""PDF to JPG — convert PDF pages to JPEG images."""

from __future__ import annotations

import shutil
import zipfile
from pathlib import Path

from pdf2image import convert_from_path


def pdf_to_jpg(file_path: Path, dpi: int = 150) -> Path:
    """Convert each page of a PDF to a JPEG image and package as ZIP.

    Args:
        file_path: Path to the input PDF.
        dpi: Resolution in DPI (default 150).

    Returns:
        Path to the ZIP file containing JPEG images.
    """
    images = convert_from_path(str(file_path), dpi=dpi)
    output_dir = file_path.parent.parent / "results"
    zip_path = output_dir / f"{file_path.stem}_images.zip"

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for i, img in enumerate(images, 1):
            img_path = output_dir / f"page_{i}.jpg"
            img.save(img_path, "JPEG", quality=85)
            zf.write(img_path, f"page_{i}.jpg")
            img_path.unlink()

    return zip_path

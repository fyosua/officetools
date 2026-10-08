"""JPG to PDF — convert images to a PDF document."""

from __future__ import annotations

from pathlib import Path

import img2pdf


def images_to_pdf(image_paths: list[Path]) -> Path:
    """Convert one or more images into a single PDF.

    Args:
        image_paths: List of paths to image files (JPEG, PNG, etc.).

    Returns:
        Path to the generated PDF.

    Raises:
        ValueError: If no images are provided.
    """
    if not image_paths:
        raise ValueError("At least one image is required")

    output = image_paths[0].parent.parent / "results" / "converted.pdf"
    with open(output, "wb") as f:
        f.write(img2pdf.convert([str(p) for p in image_paths]))

    return output

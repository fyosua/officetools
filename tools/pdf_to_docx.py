"""PDF to DOCX — convert PDF to Word document via LibreOffice."""

from __future__ import annotations

import subprocess
from pathlib import Path


def pdf_to_docx(file_path: Path) -> Path:
    """Convert a PDF file to .docx using LibreOffice headless.

    Args:
        file_path: Path to the input PDF.

    Returns:
        Path to the generated .docx file.
    """
    output_dir = file_path.parent.parent / "results"
    cmd = [
        "libreoffice",
        "--headless",
        "--convert-to",
        "docx",
        "--outdir",
        str(output_dir),
        str(file_path),
    ]
    subprocess.run(cmd, check=True, capture_output=True, timeout=30)
    docx_path = output_dir / f"{file_path.stem}.docx"
    if not docx_path.exists():
        raise RuntimeError("LibreOffice conversion failed — no output file produced")
    return docx_path
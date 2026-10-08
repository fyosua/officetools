"""DOCX to PDF — convert Word documents to PDF via LibreOffice."""

from __future__ import annotations

import subprocess
from pathlib import Path


def docx_to_pdf(file_path: Path) -> Path:
    """Convert a .docx file to PDF using LibreOffice headless.

    Args:
        file_path: Path to the input .docx file.

    Returns:
        Path to the generated PDF.
    """
    output_dir = file_path.parent.parent / "results"
    cmd = [
        "libreoffice",
        "--headless",
        "--convert-to",
        "pdf",
        "--outdir",
        str(output_dir),
        str(file_path),
    ]
    subprocess.run(cmd, check=True, capture_output=True, timeout=30)
    pdf_path = output_dir / f"{file_path.stem}.pdf"
    if not pdf_path.exists():
        raise RuntimeError("LibreOffice conversion failed — no output file produced")
    return pdf_path
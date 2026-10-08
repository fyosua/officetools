"""PDF Compress — reduce PDF file size."""

from __future__ import annotations

import subprocess
from pathlib import Path

import pikepdf


def compress_pdf(file_path: Path, mode: str = "lossy") -> Path:
    """Compress a PDF file.

    Args:
        file_path: Path to the input PDF.
        mode: 'lossy' (Ghostscript) or 'lossless' (pikepdf).

    Returns:
        Path to the compressed PDF.

    Raises:
        ValueError: If mode is invalid.
    """
    output = file_path.parent.parent / "results" / f"compressed_{file_path.stem}.pdf"

    if mode == "lossy":
        # Ghostscript-based compression
        cmd = [
            "gs",
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            "-dPDFSETTINGS=/ebook",
            "-dNOPAUSE",
            "-dQUIET",
            "-dBATCH",
            f"-sOutputFile={output}",
            str(file_path),
        ]
        subprocess.run(cmd, check=True, capture_output=True, timeout=120)
    elif mode == "lossless":
        # pikepdf-based lossless compression
        with pikepdf.open(file_path) as pdf:
            pdf.save(output, compress_streams=True)
    else:
        raise ValueError(f"Invalid mode: {mode}. Use 'lossy' or 'lossless'.")

    return output

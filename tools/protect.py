"""PDF Protect — add password protection to PDFs."""

from __future__ import annotations

from pathlib import Path

import pikepdf


def protect_pdf(file_path: Path, password: str) -> Path:
    """Add password protection to a PDF.

    Args:
        file_path: Path to the input PDF.
        password: Password to encrypt the PDF with.

    Returns:
        Path to the password-protected PDF.

    Raises:
        ValueError: If password is empty.
    """
    if not password:
        raise ValueError("Password cannot be empty")

    output = file_path.parent.parent / "results" / f"protected_{file_path.stem}.pdf"
    with pikepdf.open(file_path) as pdf:
        pdf.save(output, encryption=pikepdf.Encryption(user=password, owner=password))
    return output
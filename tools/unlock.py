"""PDF Unlock — remove password protection from PDFs."""

from __future__ import annotations

from pathlib import Path

import pikepdf


def unlock_pdf(file_path: Path, password: str) -> Path:
    """Remove password protection from a PDF.

    Args:
        file_path: Path to the password-protected PDF.
        password: The owner/user password.

    Returns:
        Path to the unlocked PDF.

    Raises:
        ValueError: If the password is wrong or the PDF is not encrypted.
    """
    output = file_path.parent.parent / "results" / f"unlocked_{file_path.stem}.pdf"
    try:
        with pikepdf.open(file_path, password=password) as pdf:
            pdf.save(output)
    except pikepdf.PasswordError:
        raise ValueError("Incorrect password")
    return output
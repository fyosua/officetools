"""OfficeTools — FastAPI application entry point.

A production-ready online office tools suite with PDF editing, conversion,
merging, splitting, and compression capabilities.
"""

from __future__ import annotations

import json
import shutil
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

import auth
from config import settings

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="OfficeTools API",
    version="0.1.0",
    description="PDF processing tools suite — merge, split, compress, convert, and more.",
)

# ---------------------------------------------------------------------------
# Static files (SPA frontend) — mounted at the root, BUT only after all
# API routes are defined below.  FastAPI matches API routes first, so
# the catch-all static mount at the end of the file serves frontend files.
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Middleware: file size limit
# ---------------------------------------------------------------------------


@app.middleware("http")
async def limit_upload_size(request: Request, call_next):
    """Reject requests with Content-Length exceeding the configured limit."""
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        return JSONResponse(
            status_code=413,
            content={"detail": f"File too large. Maximum is {settings.MAX_FILE_SIZE_MB}MB."},
        )
    return await call_next(request)


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------


def require_auth(request: Request) -> None:
    """Raise 401 if the request has no valid session."""
    if not auth.verify_session(request):
        raise HTTPException(status_code=401, detail="Not authenticated")


# ---------------------------------------------------------------------------
# File helpers
# ---------------------------------------------------------------------------


def _ensure_processing_dirs() -> None:
    """Create upload and results directories if they don't exist."""
    settings.PROCESSING_DIR.mkdir(parents=True, exist_ok=True)
    (settings.PROCESSING_DIR / "uploads").mkdir(exist_ok=True)
    (settings.PROCESSING_DIR / "results").mkdir(exist_ok=True)


def _save_upload(file: UploadFile) -> Path:
    """Save an uploaded file to the processing directory and return its path."""
    _ensure_processing_dirs()
    ext = Path(file.filename or "file").suffix if file.filename else ".bin"
    safe_name = f"{uuid.uuid4().hex}{ext}"
    dest = settings.PROCESSING_DIR / "uploads" / safe_name
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return dest


def _result_path(extension: str = ".pdf") -> Path:
    """Return a unique path for a result file."""
    _ensure_processing_dirs()
    return settings.PROCESSING_DIR / "results" / f"{uuid.uuid4().hex}{extension}"


def _validate_pdf(path: Path) -> None:
    """Validate that a file exists and has a .pdf extension."""
    if not path.exists():
        raise HTTPException(status_code=400, detail="File not found")
    if path.suffix.lower() != ".pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------


@app.post("/api/login")
async def login(request: Request):
    """Authenticate with the configured password."""
    body = await request.json()
    if body.get("password") == settings.APP_PASSWORD:
        resp = JSONResponse({"success": True, "message": "Authenticated"})
        auth.create_session(resp)
        return resp
    raise HTTPException(status_code=401, detail="Invalid password")


@app.get("/api/check-auth")
async def check_auth(request: Request):
    """Check if the current session is authenticated."""
    return {"authenticated": auth.verify_session(request)}


@app.post("/api/logout")
async def logout():
    """Clear the session cookie."""
    resp = JSONResponse({"success": True})
    auth.clear_session(resp)
    return resp


# ---------------------------------------------------------------------------
# Tool endpoints (stubs — implemented in Phase 3)
# ---------------------------------------------------------------------------


@app.post("/api/merge")
async def merge_pdfs(request: Request, files: list[UploadFile]):
    require_auth(request)
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.post("/api/split")
async def split_pdf(request: Request, file: UploadFile, ranges: str = ""):
    require_auth(request)
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.post("/api/compress")
async def compress_pdf(request: Request, file: UploadFile, mode: str = "lossy"):
    require_auth(request)
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.post("/api/pdf-to-jpg")
async def pdf_to_jpg(request: Request, file: UploadFile, dpi: int = 150):
    require_auth(request)
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.post("/api/jpg-to-pdf")
async def jpg_to_pdf(request: Request, files: list[UploadFile]):
    require_auth(request)
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.post("/api/docx-to-pdf")
async def docx_to_pdf(request: Request, file: UploadFile):
    require_auth(request)
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.post("/api/pdf-to-docx")
async def pdf_to_docx(request: Request, file: UploadFile):
    require_auth(request)
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.post("/api/rotate")
async def rotate_pdf(request: Request, file: UploadFile, pages: str = "all", angle: int = 90):
    require_auth(request)
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.post("/api/unlock")
async def unlock_pdf(request: Request, file: UploadFile, password: str = ""):
    require_auth(request)
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.post("/api/protect")
async def protect_pdf(request: Request, file: UploadFile, password: str = ""):
    require_auth(request)
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.post("/api/pdf-to-text")
async def pdf_to_text(request: Request, file: UploadFile):
    require_auth(request)
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.post("/api/pdf-editor")
async def pdf_editor(
    request: Request,
    file: UploadFile,
    text: str = "",
    page: int = 1,
    x: float = 100,
    y: float = 100,
):
    require_auth(request)
    raise HTTPException(status_code=501, detail="Not implemented yet")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/api/health")
async def health():
    """Simple health check endpoint."""
    return {"status": "ok", "version": "0.1.0"}


# ---------------------------------------------------------------------------
# Static files — must be last so API routes take precedence
# ---------------------------------------------------------------------------

from fastapi.staticfiles import StaticFiles  # noqa: E402

app.mount("/", StaticFiles(directory="public", html=True), name="public")

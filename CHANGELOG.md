# Changelog

## [0.2.0] - 2026-10-08

### Added
- Migrated to Bun 1.x + Elysia (backend) + Svelte 5 (frontend)
- 12 PDF tool modules with actual implementations:
  - merge, split, compress, pdf-to-jpg, jpg-to-pdf
  - docx-to-pdf, pdf-to-docx, rotate, unlock, protect
  - pdf-to-text, pdf-editor
- Cyberpunk Svelte 5 UI with login page, dashboard, tool cards
- Systemd service for Bun runtime
- Hourly cleanup timer for temp files
- deploy.sh deployment script
- Cloudflare Tunnel ingress at officetools.yosuaf.com → port 3002

### Removed
- Python FastAPI backend (venv, pip, uvicorn)
- Vanilla HTML/CSS/JS frontend
- pypdf, pikepdf, PyMuPDF, pdf2image, img2pdf

## [0.1.0] - 2026-10-08

### Added
- Initial project scaffold (Python FastAPI)
- Session-based authentication with signed cookies
- 12 PDF processing tool stubs
- Basic cyberpunk login page
- Cloudflare Tunnel ingress configured (officetools.yosuaf.com)
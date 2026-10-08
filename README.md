# OfficeTools Yosuaf

> A production-ready online office tools suite — PDF editing, conversion, merging, splitting, compression, and more. Built with FastAPI and a modern cyberpunk UI.

🔗 **https://officetools.yosuaf.com**

## Features

| Tool | Description |
|------|-------------|
| **PDF Merge** | Combine multiple PDFs into one file |
| **PDF Split** | Split a PDF by page range |
| **PDF Compress** | Reduce PDF file size (Ghostscript + pikepdf) |
| **PDF to JPG** | Convert PDF pages to JPEG images |
| **JPG to PDF** | Convert images into a PDF document |
| **Word to PDF** | Convert .docx files to PDF |
| **PDF to Word** | Convert PDF files to .docx |
| **PDF Rotate** | Rotate PDF pages (90°/180°/270°) |
| **PDF Unlock** | Remove password protection from PDFs |
| **PDF Protect** | Add password protection to PDFs |
| **PDF to Text** | Extract plain text from PDFs |
| **PDF Editor** | Add text annotations and watermarks |

## Quick Start

```bash
# Clone & enter
git clone https://github.com/fyosua/officetools.git
cd officetools

# Set up Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure password
echo 'APP_PASSWORD=your_secure_password' >> .env
echo 'SECRET_KEY=your_secret_key_here' >> .env

# Run
uvicorn main:app --host 127.0.0.1 --port 3001 --reload
```

Open http://localhost:3001 → enter password → use tools.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11 + FastAPI + Uvicorn |
| Frontend | Vanilla HTML5/CSS3/JS (SPA) |
| Auth | Session cookie (signed via itsdangerous) |
| PDF Processing | pypdf, pikepdf, PyMuPDF, pdf2image, img2pdf |
| Office Conversion | LibreOffice headless |
| PDF Compression | Ghostscript |
| Infrastructure | Raspberry Pi, Cloudflare Tunnel, systemd |

## Project Structure

```
officetools/
├── main.py              # FastAPI entry point
├── auth.py              # Session authentication
├── config.py            # Environment config
├── tools/               # PDF processing modules
├── public/              # Frontend (HTML/CSS/JS)
├── processing/          # Temp uploads/results
├── tests/               # Test suite
├── docs/                # Documentation
└── requirements.txt     # Python dependencies
```

## License

MIT

# OfficeTools Yosuaf

> A production-ready online office tools suite — PDF editing, conversion, merging, splitting, compression, and more. Built with **Bun + Elysia + Svelte** and a modern cyberpunk UI.

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
# Prerequisites: Install Bun
curl -fsSL https://bun.sh/install | bash

# Clone & enter
git clone https://github.com/fyosua/officetools.git
cd officetools

# Install dependencies
bun install
cd client && bun install && cd ..

# Configure password
echo 'APP_PASSWORD=your_secure_password' >> .env
echo 'SECRET_KEY=your_secret_key_here' >> .env

# Build Svelte frontend
cd client && bun run build && cd ..

# Run
bun run server/index.ts
```

Open http://localhost:3002 → enter password → use tools.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | **Bun 1.x** (JavaScript/TypeScript) |
| Backend | **Elysia** (Bun-native web framework) |
| Frontend | **Svelte 5** (compiled via Vite) |
| Auth | Signed cookies via `@elysiajs/cookie` + `Bun.CryptoHasher` |
| PDF Processing | pdf-lib, pdfjs-dist, sharp |
| Office Conversion | LibreOffice headless (via subprocess) |
| PDF Compression | Ghostscript (via subprocess) |
| Infrastructure | Raspberry Pi, Cloudflare Tunnel, systemd |

## Project Structure

```
officetools/
├── server/
│   ├── index.ts            # Elysia app entry point
│   ├── config.ts           # Environment config
│   ├── auth.ts             # Session authentication
│   └── tools/              # PDF processing modules
│       ├── merge.ts
│       ├── split.ts
│       └── ...
├── client/                 # Svelte 5 frontend
│   ├── src/
│   │   ├── App.svelte
│   │   ├── pages/          # Login, Dashboard
│   │   ├── components/     # ToolCard, etc.
│   │   └── lib/            # auth.js, api.js
│   └── dist/               # Built output (served by Elysia)
├── processing/             # Temp uploads/results
├── cleanup.ts              # Hourly temp file cleanup
├── deploy.sh               # Deployment script
└── package.json            # Bun dependencies
```

## Deployment

```bash
# Install systemd service
sudo cp officetools.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable officetools
sudo systemctl start officetools

# Check status
sudo systemctl status officetools
```

## License

MIT
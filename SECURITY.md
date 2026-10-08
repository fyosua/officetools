# Security Policy

## Authentication

- Single shared password stored in `APP_PASSWORD` environment variable (`.env`)
- Login via `POST /api/login` validates password, sets signed cookie
- Session cookie (`session`) is **HttpOnly**, **SameSite=Lax**, 24-hour expiry
- Cookie signed with `SECRET_KEY` using HMAC-SHA256 (`Bun.CryptoHasher`)
- All tool endpoints require valid session cookie → return **401 Unauthorized** without it

## Password Policy

- Minimum 8 characters (enforced at server config level)
- Stored in `.env` file on server — never in git
- Owner changes password by editing `.env` and restarting the service:
  ```bash
  sed -i 's/APP_PASSWORD=.*/APP_PASSWORD=new_password/' .env
  sudo systemctl restart officetools
  ```

## File Upload Security

- **Max file size:** 50MB (configurable via `MAX_FILE_SIZE_MB`)
- **Accepted types:** PDF, DOCX, JPG, JPEG, PNG (validated by extension + MIME)
- **Storage:** Files saved in `processing/uploads/` and `processing/results/`
- **Permissions:** `chmod 700` — only the service user can access
- **Auto-cleanup:** Hourly timer deletes files older than 1 hour
- **Filenames sanitized:** Generated via `crypto.randomUUID()` — no user-controlled filenames reach the filesystem

## CORS

- CORS plugin enabled with default configuration (allows same-origin requests)
- Same-origin Svelte frontend served from the same port — no cross-origin needed
- If cross-origin access is added, restrict to specific origins via:
  ```ts
  .use(cors({ origin: "https://trusted-domain.com" }))
  ```

## Infrastructure

| Layer | Security Measure |
|-------|-----------------|
| Cloudflare Tunnel | HTTPS termination, DDoS protection, origin IP hidden |
| Port binding | `127.0.0.1:3002` — not exposed to the internet directly |
| Systemd service | Runs as `clowniiizzz` user, not root |
| `.env` file | `chmod 600`, owned by service user |
| Processing dir | `chmod 700` — no other users can read uploaded files |

## Reporting Vulnerabilities

For security issues, contact the repository owner via GitHub Issues (private). Do not disclose vulnerabilities publicly until they are resolved.
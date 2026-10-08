# PRD — officetools.yosuaf.com · Smallpdf Parity Upgrade
**Status:** For execution by Linux Hermes (Pi agent) · **Target reference:** smallpdf.com (researched & verified, see §9)
**Audit basis:** live inspection of the officetools repo at `/home/clowniiizzz/yosua-portfolio/officetools/` on 2026-10-08 (~16:40Z), contract v2.0.0.

---

## 1. Overview & Goal

`officetools.yosuaf.com` runs as `officetools.service` (Bun + Elysia + Svelte, port 3002). It works but is **not at Smallpdf standard**: the UI is a login-gated cyberpunk SPA with a result page that dumps raw JSON, and several tools produce results that differ from Smallpdf's (most critically, **PDF → JPG exports only the first page**).

**Goal:** make officetools' PDF processing functions **par in results** and its **UI/UX match Smallpdf's clean, professional standard** — so every tool behaves and looks like the Smallpdf equivalent. "Same result" = output file type, page coverage, quality, and multi-file behavior match Smallpdf.

---

## 2. Current State — Verified Audit

**Stack:** Bun 1.x + Elysia (server) + Svelte 5/Vite (client, built to `client/dist`), static served by Elysia. Runtime deps: `pdf-lib`, `pdfjs-dist`, `sharp`. System binaries relied on: `gs` (Ghostscript), `soffice` (LibreOffice), `pdftoppm` (poppler). Password-gated auth (single `APP_PASSWORD`, session cookie).

**Frontend structure** (`client/src/`): `App.svelte` (router-ish 3 states), `pages/Login.svelte` (206 ln), `pages/Dashboard.svelte` (75 ln, 12 tool cards), `pages/ToolView.svelte` (221 ln, generic upload→options→process→result), `app.css` (154 ln, cyberpunk theme).

**Endpoints** (`server/index.ts`): `/api/login|check-auth|logout|health`, `/api/download/:name`, and 12 tool endpoints. Every tool requires auth. Processing is synchronous in-request; results stored under `processing/results/`, served via `/api/download/:name`.

**Tools implemented (12):** merge, split, compress, pdf-to-jpg, jpg-to-pdf, docx-to-pdf, pdf-to-docx, rotate, unlock, protect, pdf-to-text, pdf-editor.

**Per-tool current behavior (verified from source):**
| Tool | Current implementation | Parity issue |
|---|---|---|
| Merge | `pdf-lib`; requires **≥2 PDFs**; no images/Office; no reorder/delete/rotate UI | ❌ can't merge PDF+image/Office; no pre-merge organizer |
| Split | page-range string (`input`) → separate PDFs | ⚠️ no "extract pages", no "each page as separate file" |
| Compress | Ghostscript `gs -dPDFSETTINGS=screen/ebook/printer` | ✅ real compression, but no "strong/batch"; no verified quality parity |
| **PDF→JPG** | **`pdftoppm -f 1 -l 1` — FIRST PAGE ONLY** + sharp | ❌ **parity bug: only page 1, not all pages** |
| JPG→PDF | images→PDF | ⚠️ no margin/orientation/size options |
| DOCX→PDF | LibreOffice `soffice --convert-to pdf` | ⚠️ layout fidelity varies |
| PDF→DOCX | LibreOffice `soffice --convert-to docx` | ⚠️ no "Basic vs Advanced(OCR)" tiers; layout may differ |
| Rotate | pdf-lib rotate all/pages by 90/180/270 | ✅ core ok |
| Unlock | pdf-lib remove password | ✅ core ok |
| Protect | pdf-lib add password | ✅ core ok |
| PDF→Text | pdfjs text extraction | ✅ core ok |
| PDF Editor | `pdf-lib` add **one text string** at fixed (50,50) | ❌ far from Smallpdf editor (text/shapes/images/highlight/freehand, edit existing text) |

**UI/UX gaps (verified):**
- **Login required for everything** — Smallpdf works with no sign-up.
- **Result page = raw `JSON.stringify(result)` in a `<pre>`** + plain "DOWNLOAD" links. Not a real result experience.
- **No file preview / thumbnails** (no page preview, no merge reorder).
- **Cyberpunk dark theme, emoji icons** — far from Smallpdf's clean, minimal, white/light, blue-accent UI.
- No per-tool SEO-style landing pages; single SPA tool view with generic dropzone.
- No mobile-responsive polish (dashboard grid only), no share / save-to-cloud, no batch.

---

## 3. Target Reference — Smallpdf (what "parity" means)

Verified from smallpdf.com research: ~40 tools across Compress / Convert / Organize / Edit / Fill&Sign / Protect / AI / Scan. **Core UX:** clean minimal UI, "Choose files / **or drop files here**" dropzone on every tool, dedicated tool pages, thumbnail preview with reorder (merge/organize), result page with Download + Share + Save-to-cloud + "Continue in another tool", free (2 conversions/day) with Pro upsell. No forced login.

---

## 4. Requirements

### 4.1 UI/UX parity (must look & feel like Smallpdf)
- **R1.1** Replace the cyberpunk theme with a clean, minimal, light theme (white/very-light background, single accent color ~Smallpdf blue, neutral text; generous spacing, rounded cards). Remove neon/emoji styling. English UI.
- **R1.2** Remove the mandatory login wall for using tools. If access control is still wanted, make it optional/behind a setting — tools must be usable without auth (match Smallpdf). Keep the password gate only if product explicitly requires it; default = no login.
- **R1.3** One **dedicated page/route per tool** (`/merge`, `/split`, `/compress`, …) each with: title, short description, the dropzone ("Choose files / or drop files here"), tool-specific options, and a result page.
- **R1.4** Result page must be a proper UI, **not raw JSON**: show processed file(s) with preview where feasible, a prominent **Download** button, and a "Process another" / back action.
- **R1.5** For Merge & Organize: show page **thumbnails with drag-to-reorder, delete, rotate, add** before finishing (Smallpdf parity).
- **R1.6** Responsive: usable on mobile (stacked, touch-friendly) — Mac/Windows/iOS/Android per Smallpdf.
- **R1.7** Cross-tool chaining ("continue in another tool") and share/download affordances where cheap to add.

### 4.2 Function & result parity (same output as Smallpdf)
- **R2.1 Fix PDF→JPG to export ALL pages** (not just page 1) at configurable DPI → one JPG per page (Smallpdf: all pages → JPGs; also offers "extract images").
- **R2.2 Merge:** accept multiple PDFs **and** images (JPG/PNG) (+ Office if feasible), allow reorder/rotate/delete/insert before merge; output one combined PDF.
- **R2.3 Split:** support page-range splits AND "each page as a separate PDF" AND "extract selected pages as one file" (Smallpdf's 3 modes).
- **R2.4 Add missing core tools to reach Smallpdf parity (priority P0/P1):**
  - PDF→PNG (all pages), PDF→Excel (tables→XLSX), PDF→PPT, Excel→PDF, PPT→PDF, OpenOffice (ODT/ODS/ODP)→PDF
  - **PDF OCR** (scanned→searchable/selectable text)
  - PDF→PDF/A (archival, conformance level)
  - **Delete PDF pages**, **Extract pages**, **Organize PDF** (reorder/rotate/duplicate/add/delete)
  - **Crop PDF**, **Watermark PDF** (text; image watermark via editor), **Redact PDF** (true removal, not cover-box), **Number pages**
  - **PDF Form Filler**, **e-Sign PDF** (draw/type/upload signature + initials + date), **Flatten PDF**
  - JPG→PDF with margin/orientation/size options
- **R2.5 Result quality parity:** for each tool, output file type + page coverage + fidelity must match Smallpdf's. Define per-tool acceptance (see §7). Prefer proven engines over naive implementations (e.g., Ghostscript/poppler for rasterization, LibreOffice for Office round-trips, a real OCR engine; keep Bun/Elysia).
- **R2.6** Where Smallpdf returns multiple files (PDF→JPG/PNG, split-per-page), return the same set of files with the same coverage.
- **R2.7** Preserve any existing working behavior (merge/split/compress/rotate/unlock/protect/text core logic is sound — keep, don't regress).

### 4.3 Non-functional
- **R3.1 Security:** keep §7 of the cross-agent contract — no secrets in code/artifacts; `.env` stays `0600`; don't expose the password or processing dirs.
- **R3.2 Perf:** large PDFs must not hang the request — consider async/queue or worker for heavy tools (OCR, Office conversion, compress) matching Smallpdf's "takes a few seconds".
- **R3.3 Cleanup:** fix the broken `officetools-cleanup.service` (the `/etc` unit points at a removed Python venv/`cleanup.py` → `203/EXEC`; repo's `officetools-cleanup.service` uses `bun run cleanup.ts`). Ship temp-file cleanup as part of this work.
- **R3.4 Tests:** keep `bun test`; add result-parity smoke tests (see §7).

---

## 5. Tool Parity Matrix (priority)

| Tool | Status now | Required | Priority |
|---|---|---|---|
| Merge | ✅/❌ pdf-lib ≥2 PDFs | PDF+images+reorder+rotate+delete | **P0** |
| Split | ⚠️ range only | 3 modes (range/extract/per-page) | **P0** |
| Compress | ✅ gs | add strong/batch, verify parity | P1 |
| PDF→JPG | ❌ **page 1 only** | **all pages**, DPI | **P0 (bug)** |
| PDF→PNG | — missing | all pages → PNG | P1 |
| JPG→PDF | ⚠️ | margins/orientation/size | P1 |
| DOCX→PDF | ✅ LO | verify fidelity | P1 |
| PDF→DOCX | ⚠️ LO | Basic + OCR tiers, verify | P1 |
| PDF→Excel | — missing | tables → XLSX | P1 |
| PDF→PPT | — missing | → PPTX | P1 |
| Excel/PPT→PDF | — missing | → PDF | P1 |
| ODT/ODS/ODP→PDF | — missing | → PDF | P2 |
| PDF OCR | — missing | scanned→searchable | **P0** |
| PDF→PDF/A | — missing | archival, conformance | P2 |
| Rotate | ✅ | — | done |
| Unlock / Protect | ✅ | — | done |
| PDF→Text | ✅ | — | done |
| Delete pages | — missing | remove pages | **P0** |
| Extract pages | — missing | pick pages→PDF(s) | **P0** |
| Organize | — missing | reorder/rotate/dup/add/delete | **P0** |
| Crop | — missing | trim margins/page | P1 |
| Watermark | — missing | text watermark | P1 |
| Redact | — missing | true removal | P1 |
| Number pages | — missing | sequential numbers | P2 |
| Form Filler | — missing | fill + e-sign | P1 |
| e-Sign | — missing | draw/type/upload signature | **P0** |
| Flatten | — missing | merge layers | P2 |
| PDF Editor | ❌ text-only@fixed | text/shapes/images/highlight/freehand, edit existing | **P0** |
| Batch | — | multi-file batch | P2 |
| UI/UX overhaul | ❌ cyberpunk+JSON | Smallpdf-style (R1.x) | **P0** |

---

## 6. Acceptance Criteria (verify before claiming done — §5 of contract: hash/readback, not prose)

For each tool, verify the output file exists and is correct (a real process, not a claim). Minimum set:
- **PDF→JPG:** a 3-page PDF yields **3 JPGs** (pages 1–3), reasonable DPI. **(this is the current failure — must pass)**
- **Merge:** PDF + JPG → one PDF with expected page count/order; reorder changes order.
- **Split:** page-range `1-3,5` → correct separate files; "each page" mode → N files.
- **Compress:** output PDF opens, size < input for an image-heavy PDF, at each mode.
- **PDF→DOCX / DOCX→PDF:** round-trips, opens in Word/LO, text preserved.
- **OCR:** scanned PDF → searchable text (copyable) present.
- **UI:** light theme; tool pages at clean URLs; dropzone present; result page shows download (no raw JSON); works without login.
- **Cleanup:** `officetools-cleanup.service` active (no 203/EXEC); timer fires hourly.
- **Regression:** merge/rotate/unlock/protect/text still work; `bun test` passes; app serves at 3002 and `officetools.yosuaf.com`.

Verification method: execute each tool against the shared test fixtures (Windows can supply `test_doc.pdf`, `second.pdf`, `test_pic.jpg/png`, `note.txt`, `data.csv`) and compare page counts/output coverage to expectations. Report per-tool: observed vs required.

---

## 7. Implementation Guidance (for Linux Hermes)

- **Keep the stack** (Bun + Elysia + Svelte) — no rewrite of the platform; focus on tool parity + UI.
- **Use proven engines already present or cheap to add:** Ghostscript (`gs`), poppler (`pdftoppm`/`pdftocairo` for PNG/raster), LibreOffice (`soffice`) for Office conversions, `pdf-lib` for structure ops. For OCR add a real engine (e.g., `tesseract`/`ocrmypdf`) or a robust JS/TS wrapper; do not fake OCR.
- **Fix PDF→JPG first** (drop `-f 1 -l 1`; iterate all pages; offer PNG via `pdftocairo`).
- **Implement the P0 set before expanding** (merge-organizer, split modes, delete/extract/organize pages, e-sign, editor, OCR, UI overhaul).
- **Rearchitect the frontend:** multi-route SPA (Svelte) with one page per tool + a reusable dropzone/result component; light theme; drop the forced login.
- **Result parity, not just presence:** verify output file type + page coverage + fidelity per §6 before marking a tool done.
- Clean up the temp-file service as part of the change.

---

## 8. Out of Scope (this phase) / Open Questions
- AI tools (chat/summarize/translate/quiz), full cloud storage + share links, batch conversion, e-signature *request* workflow (Sign.com-style), mobile apps, PDF Scanner — defer unless explicitly wanted.
- Open: is the login gate required by anyone (owner/team) or removable? PRD assumes **remove** to match Smallpdf (R1.2). Confirm.
- Open: domain→3002 reverse proxy/tunnel was [inferred] earlier; not touched here (unrelated to tool parity).

---

## 9. Provenance & Notes
- Target behaviors are from the verified Smallpdf research report (tool inventory, formats, free/Pro gating, UX patterns) produced earlier this session.
- Audit is from direct read of the officetools repo + running service state on 2026-10-08.
- All claims labeled observed (repo/service read) vs required (spec). No secrets referenced; `.env` untouched.
- **Handoff:** this PRD is shipped to the Linux Hermes via contract §4 (drop to Pi inbox with `.sha256` + ACK) for execution; the Windows side can supply shared test fixtures for acceptance verification.
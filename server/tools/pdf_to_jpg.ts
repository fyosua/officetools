import { loadConfig } from "../config";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

function pageCount(path: string): Promise<number> {
  return Bun.file(path).arrayBuffer().then((b) => PDFDocument.load(b, { ignoreEncryption: true }).then((p) => p.getPageCount()));
}

/**
 * Convert EVERY page of a PDF to a separate JPEG at the given DPI.
 * Fixes the previous bug where only page 1 was exported.
 * @returns Array of output JPEG file paths (one per page, document order)
 */
export async function pdf_to_jpg(path: string, dpi: number = 150): Promise<string[]> {
  const total = await pageCount(path);
  const out: string[] = [];
  for (let p = 1; p <= total; p++) {
    const tmpBase = `${resultsDir}/${crypto.randomUUID()}`;
    const proc = Bun.spawn(["pdftoppm", "-jpeg", "-r", String(dpi), "-f", String(p), "-l", String(p), "-singlefile", path, tmpBase]);
    const code = await proc.exited;
    if (code !== 0) {
      const stderr = await new Response(proc.stderr).text();
      throw new Error(`pdftoppm failed (exit ${code}): ${stderr}`);
    }
    const tmpFile = `${tmpBase}.jpg`;
    if (!(await Bun.file(tmpFile).exists())) throw new Error(`pdftoppm produced no image for page ${p}`);
    const outPath = `${resultsDir}/${crypto.randomUUID()}.jpg`;
    const buf = await Bun.file(tmpFile).arrayBuffer();
    await sharp(buf).jpeg({ quality: 90 }).toFile(outPath);
    await Bun.file(tmpFile).delete();
    out.push(outPath);
  }
  return out;
}
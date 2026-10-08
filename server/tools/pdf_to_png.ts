import { loadConfig } from "../config";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

async function pageCount(path: string): Promise<number> {
  const bytes = await Bun.file(path).arrayBuffer();
  return PDFDocument.load(bytes, { ignoreEncryption: true }).then((p) => p.getPageCount());
}

/**
 * Convert EVERY page of a PDF to a separate PNG at the given DPI.
 * @returns Array of output PNG file paths (one per page, document order)
 */
export async function pdf_to_png(path: string, dpi: number = 150): Promise<string[]> {
  const total = await pageCount(path);
  const out: string[] = [];
  for (let p = 1; p <= total; p++) {
    const tmpBase = `${resultsDir}/${crypto.randomUUID()}`;
    const proc = Bun.spawn(["pdftoppm", "-png", "-r", String(dpi), "-f", String(p), "-l", String(p), "-singlefile", path, tmpBase]);
    const code = await proc.exited;
    if (code !== 0) {
      const stderr = await new Response(proc.stderr).text();
      throw new Error(`pdftoppm(png) failed (exit ${code}): ${stderr}`);
    }
    const tmpFile = `${tmpBase}.png`;
    if (!(await Bun.file(tmpFile).exists())) throw new Error(`pdftoppm produced no PNG for page ${p}`);
    const outPath = `${resultsDir}/${crypto.randomUUID()}.png`;
    const buf = await Bun.file(tmpFile).arrayBuffer();
    await sharp(buf).png().toFile(outPath);
    await Bun.file(tmpFile).delete();
    out.push(outPath);
  }
  return out;
}
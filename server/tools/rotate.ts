import { loadConfig } from "../config";
import { PDFDocument, degrees } from "pdf-lib";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

/**
 * Parse a page string like "1,3,5-7" into an array of 0-indexed page numbers.
 * If "all" is passed, returns null (meaning rotate all pages).
 */
function parsePages(pages: string, totalPages: number): number[] | null {
  if (pages.toLowerCase() === "all") {
    return null;
  }

  const result = new Set<number>();
  const parts = pages.split(",").map((s) => s.trim());

  for (const part of parts) {
    if (part.includes("-")) {
      const rangeParts = part.split("-").map((s) => s.trim());
      if (rangeParts.length !== 2) {
        throw new Error(`Invalid page range: ${part}`);
      }
      const startStr = rangeParts[0] as string;
      const endStr = rangeParts[1] as string;
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
        throw new Error(`Invalid page range: ${part}`);
      }
      for (let i = start; i <= end; i++) {
        result.add(i - 1);
      }
    } else {
      const p = parseInt(part, 10);
      if (isNaN(p) || p < 1 || p > totalPages) {
        throw new Error(`Invalid page number: ${part}`);
      }
      result.add(p - 1);
    }
  }

  return [...result].sort((a, b) => a - b);
}

/**
 * Rotate pages in a PDF.
 * @param path - Absolute path to the PDF
 * @param pages - Page spec: "all" | "1,3,5-7" (applies `angle`) | per-page map "1:90,3:270" (each page its own angle)
 * @param angle - Rotation angle in degrees (0, 90, 180, or 270) used when `pages` is a plain selection
 * @returns Path of the rotated PDF
 */
export async function rotate_pdf(path: string, pages: string, angle: number): Promise<string> {
  const validAngles = [0, 90, 180, 270];
  if (!validAngles.includes(angle)) {
    throw new Error(`Invalid angle ${angle}. Must be one of: ${validAngles.join(", ")}`);
  }

  const fileBytes = await Bun.file(path).arrayBuffer();
  const pdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
  const totalPages = pdf.getPageCount();

  function apply(page: any, deg: number) {
    const rot = (deg + 360) % 360;
    if (!validAngles.includes(rot)) throw new Error(`Invalid angle ${rot}`);
    page.setRotation(degrees((page.getRotation().angle + rot) % 360));
  }

  // per-page map: "1:90,3:270"
  if (pages.includes(":")) {
    for (const part of pages.split(",").map((s) => s.trim())) {
      if (!part) continue;
      const m = part.match(/^(\d+):(\d+)$/);
      if (!m) throw new Error(`Invalid rotation spec: ${part} (expected page:angle)`);
      const p = parseInt(m[1]!, 10);
      const deg = parseInt(m[2]!, 10);
      if (p < 1 || p > totalPages) throw new Error(`Page ${p} out of range`);
      apply(pdf.getPage(p - 1), deg);
    }
    const outPath = `${resultsDir}/${crypto.randomUUID()}.pdf`;
    await Bun.write(outPath, await pdf.save());
    return outPath;
  }

  if (pages.toLowerCase() === "all") {
    for (let i = 0; i < totalPages; i++) apply(pdf.getPage(i), angle);
  } else {
    const pageIndices = parsePages(pages, totalPages) as number[];
    for (const idx of pageIndices) apply(pdf.getPage(idx), angle);
  }
  const outPath = `${resultsDir}/${crypto.randomUUID()}.pdf`;
  await Bun.write(outPath, await pdf.save());
  return outPath;
}

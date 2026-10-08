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
 * @param pages - Page selection e.g. "1,3,5-7" or "all"
 * @param angle - Rotation angle in degrees (must be 0, 90, 180, or 270)
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

  const pageIndices = parsePages(pages, totalPages);

  if (pageIndices === null) {
    // Rotate all pages
    for (let i = 0; i < totalPages; i++) {
      const page = pdf.getPage(i);
      page.setRotation(degrees((page.getRotation().angle + angle) % 360));
    }
  } else {
    for (const idx of pageIndices) {
      const page = pdf.getPage(idx);
      page.setRotation(degrees((page.getRotation().angle + angle) % 360));
    }
  }

  const pdfBytes = await pdf.save();
  const outName = `${crypto.randomUUID()}.pdf`;
  const outPath = `${resultsDir}/${outName}`;
  await Bun.write(outPath, pdfBytes);
  return outPath;
}

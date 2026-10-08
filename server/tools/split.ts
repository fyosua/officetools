import { loadConfig } from "../config";
import { PDFDocument } from "pdf-lib";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

/**
 * Parse a page range string like "1,3,5-7" into an array of 0-indexed page numbers.
 */
function parseRange(ranges: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = ranges.split(",").map((s) => s.trim());

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
        pages.add(i - 1); // convert to 0-indexed
      }
    } else {
      const p = parseInt(part, 10);
      if (isNaN(p) || p < 1 || p > totalPages) {
        throw new Error(`Invalid page number: ${part}`);
      }
      pages.add(p - 1);
    }
  }

  return [...pages].sort((a, b) => a - b);
}

/**
 * Split a PDF into separate files based on page ranges.
 * @param path - Absolute path to the PDF
 * @param ranges - Page range string e.g. "1-3,5,7-9"
 * @returns Array of output file paths
 */
export async function split_pdf(path: string, ranges: string): Promise<string[]> {
  const fileBytes = await Bun.file(path).arrayBuffer();
  const pdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
  const totalPages = pdf.getPageCount();
  const pageIndices = parseRange(ranges, totalPages);

  if (pageIndices.length === 0) {
    throw new Error("No pages matched the specified ranges");
  }

  // Group contiguous pages into chunks
  const chunks: number[][] = [];
  let currentChunk: number[] = [pageIndices[0]!];

  for (let i = 1; i < pageIndices.length; i++) {
    const prev = pageIndices[i - 1]!;
    const curr = pageIndices[i]!;
    if (curr === prev + 1) {
      currentChunk.push(curr);
    } else {
      chunks.push(currentChunk);
      currentChunk = [curr];
    }
  }
  chunks.push(currentChunk);

  const outPaths: string[] = [];

  for (const chunk of chunks) {
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdf, chunk);
    for (const page of copiedPages) {
      newPdf.addPage(page);
    }
    const pdfBytes = await newPdf.save();
    const outName = `${crypto.randomUUID()}.pdf`;
    const outPath = `${resultsDir}/${outName}`;
    await Bun.write(outPath, pdfBytes);
    outPaths.push(outPath);
  }

  return outPaths;
}

import { loadConfig } from "../config";
import { PDFDocument } from "pdf-lib";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

function parseIdx(pages: string, totalPages: number): number[] {
  const set = new Set<number>();
  for (const part of pages.split(",").map((s) => s.trim())) {
    const p = parseInt(part, 10);
    if (isNaN(p) || p < 1 || p > totalPages) throw new Error(`Invalid page number: ${part}`);
    set.add(p - 1);
  }
  return [...set].sort((a, b) => a - b);
}

/**
 * Delete the given pages from a PDF, keeping the rest.
 * @returns path of the resulting PDF
 */
export async function delete_pages(path: string, toDelete: string): Promise<string> {
  const bytes = await Bun.file(path).arrayBuffer();
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const total = pdf.getPageCount();
  const remove = new Set(parseIdx(toDelete, total));
  const keep = pdf.getPageIndices().filter((i) => !remove.has(i));
  if (keep.length === total) throw new Error("Nothing deleted: no pages matched");
  const out = await PDFDocument.create();
  const copied = await out.copyPages(pdf, keep);
  for (const p of copied) out.addPage(p);
  const outPath = `${resultsDir}/${crypto.randomUUID()}.pdf`;
  await Bun.write(outPath, await out.save());
  return outPath;
}
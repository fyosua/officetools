import { loadConfig } from "../config";
import { PDFDocument } from "pdf-lib";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

/**
 * Parse a page range string like "1,3,5-7" into 0-indexed page numbers (sorted).
 */
function parseRange(ranges: string, totalPages: number): number[] {
  const pages = new Set<number>();
  for (const part of ranges.split(",").map((s) => s.trim())) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map((s) => s.trim());
      const start = parseInt(a as string, 10);
      const end = parseInt(b as string, 10);
      if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
        throw new Error(`Invalid page range: ${part}`);
      }
      for (let i = start; i <= end; i++) pages.add(i - 1);
    } else {
      const p = parseInt(part, 10);
      if (isNaN(p) || p < 1 || p > totalPages) throw new Error(`Invalid page number: ${part}`);
      pages.add(p - 1);
    }
  }
  return [...pages].sort((a, b) => a - b);
}

async function writePdf(doc: PDFDocument): Promise<string> {
  const outPath = `${resultsDir}/${crypto.randomUUID()}.pdf`;
  await Bun.write(outPath, await doc.save());
  return outPath;
}

/**
 * Split a PDF into multiple documents.
 * @param path absolute PDF path
 * @param mode "split" (ranges -> separate files), "extract" (selected pages -> ONE file), "perpage" (each page -> own file)
 * @param pages page-range string e.g. "1-3,5,7-9"
 */
export async function split_pdf(path: string, mode: "split" | "extract" | "perpage", pages: string): Promise<string[]> {
  const bytes = await Bun.file(path).arrayBuffer();
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const total = pdf.getPageCount();
  const idx = parseRange(pages, total);
  if (idx.length === 0) throw new Error("No pages matched");

  if (mode === "extract") {
    const out = await PDFDocument.create();
    const copied = await out.copyPages(pdf, idx);
    for (const p of copied) out.addPage(p);
    return [await writePdf(out)];
  }

  if (mode === "perpage") {
    const outs: string[] = [];
    for (const i of idx) {
      const out = await PDFDocument.create();
      const [cp] = await out.copyPages(pdf, [i]);
      out.addPage(cp!);
      outs.push(await writePdf(out));
    }
    return outs;
  }

  // mode "split": group contiguous indices into ranges -> separate files
  const chunks: number[][] = [];
  let cur: number[] = [idx[0]!];
  for (let i = 1; i < idx.length; i++) {
    if (idx[i] === ((idx[i - 1] as number) + 1)) cur.push(idx[i]!);
    else { chunks.push(cur); cur = [idx[i]!]; }
  }
  chunks.push(cur);
  const outs: string[] = [];
  for (const chunk of chunks) {
    const out = await PDFDocument.create();
    const copied = await out.copyPages(pdf, chunk);
    for (const p of copied) out.addPage(p);
    outs.push(await writePdf(out));
  }
  return outs;
}
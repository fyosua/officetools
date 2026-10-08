import { loadConfig } from "../config";
import { PDFDocument, degrees } from "pdf-lib";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

/**
 * Reorganize a PDF via a single spec string of "page:angle" entries in the FINAL order.
 * - Order of entries = final page order.
 * - Omitted pages are deleted.
 * - A page repeated appears twice (duplicate).
 * - angle applies per entry (0/90/180/270), enabling per-page rotation.
 * Example: "1:0,3:90,1:0,2:180" -> keep page1, then page3 rotated 90, then page1 again, then page2 rotated 180.
 */
export async function organize_pdf(path: string, spec: string): Promise<string> {
  if (!spec || !spec.trim()) throw new Error("Provide an organize spec like '1:0,3:90,2:0'");
  const bytes = await Bun.file(path).arrayBuffer();
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const total = pdf.getPageCount();
  const items: { p: number; a: number }[] = [];
  for (const part of spec.split(",").map((s) => s.trim())) {
    if (!part) continue;
    const m = part.match(/^(\d+):(\d+)$/);
    if (!m) throw new Error(`Invalid spec item: ${part} (expected page:angle)`);
    const p = parseInt(m[1]!, 10);
    const a = parseInt(m[2]!, 10);
    if (p < 1 || p > total) throw new Error(`Page ${p} out of range`);
    if (![0, 90, 180, 270].includes(a)) throw new Error(`Angle ${a} invalid`);
    items.push({ p: p - 1, a });
  }
  if (items.length === 0) throw new Error("No pages in organize spec");
  const out = await PDFDocument.create();
  for (const it of items) {
    const [pg] = await out.copyPages(pdf, [it.p]);
    if (it.a && pg) pg.setRotation(degrees(it.a));
    out.addPage(pg!);
  }
  const outPath = `${resultsDir}/${crypto.randomUUID()}.pdf`;
  await Bun.write(outPath, await out.save());
  return outPath;
}
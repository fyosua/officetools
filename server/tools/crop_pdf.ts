import { loadConfig } from "../config";
import { PDFDocument } from "pdf-lib";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

/**
 * Crop margins from every page of a PDF.
 * @param path absolute PDF path
 * @param marginPct percent to remove from each side (0-45). e.g. 10 removes 10% left/right/top/bottom.
 */
export async function crop_pdf(path: string, marginPct: number = 10): Promise<string> {
  if (marginPct < 0 || marginPct > 45) throw new Error("marginPct must be between 0 and 45");
  const bytes = await Bun.file(path).arrayBuffer();
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const m = marginPct / 100;
  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const x = width * m;
    const y = height * m;
    page.setCropBox(x, y, width * (1 - 2 * m), height * (1 - 2 * m));
  }
  const outPath = `${resultsDir}/${crypto.randomUUID()}.pdf`;
  await Bun.write(outPath, await pdf.save());
  return outPath;
}
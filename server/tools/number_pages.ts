import { loadConfig } from "../config";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

/**
 * Add sequential page numbers (e.g. "3 / 5") to the bottom-right of every page.
 */
export async function number_pages(path: string, start: number = 1): Promise<string> {
  const bytes = await Bun.file(path).arrayBuffer();
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const total = pages.length;
  pages.forEach((page, i) => {
    const n = start + i;
    const { width } = page.getSize();
    const label = `${n} / ${total}`;
    const size = 11;
    const tw = font.widthOfTextAtSize(label, size);
    page.drawText(label, { x: width - tw - 40, y: 30, size, font, color: rgb(0.2, 0.2, 0.2) });
  });
  const outPath = `${resultsDir}/${crypto.randomUUID()}.pdf`;
  await Bun.write(outPath, await pdf.save());
  return outPath;
}
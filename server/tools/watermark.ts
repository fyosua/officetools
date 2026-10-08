import { loadConfig } from "../config";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

/**
 * Add a watermark text to every page of a PDF, diagonally.
 */
export async function watermark_pdf(path: string, text: string, opacity: number = 0.35): Promise<string> {
  if (!text) throw new Error("Watermark text is required");
  const o = Math.min(1, Math.max(0.05, opacity || 0.35));
  const bytes = await Bun.file(path).arrayBuffer();
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const size = 48;
  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const tw = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (width - tw) / 2,
      y: height / 2 - size / 2,
      size,
      font,
      color: rgb(0.6, 0.6, 0.6),
      opacity: o,
      rotate: degrees(Math.atan(height / width) * (180 / Math.PI)),
    });
  }
  const outPath = `${resultsDir}/${crypto.randomUUID()}.pdf`;
  await Bun.write(outPath, await pdf.save());
  return outPath;
}
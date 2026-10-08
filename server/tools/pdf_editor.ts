import { loadConfig } from "../config";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

/**
 * Add a text annotation to a specific page of a PDF.
 * @param path - Absolute path to the PDF
 * @param text - The text to add
 * @param page - Page number (1-indexed)
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns Path of the modified PDF
 */
export async function add_text_annotation(
  path: string,
  text: string,
  page: number,
  x: number,
  y: number,
): Promise<string> {
  const fileBytes = await Bun.file(path).arrayBuffer();
  const pdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });

  const totalPages = pdf.getPageCount();
  if (page < 1 || page > totalPages) {
    throw new Error(`Page ${page} is out of range. Document has ${totalPages} pages.`);
  }

  const helveticaFont = await pdf.embedFont(StandardFonts.Helvetica);
  const pdfPage = pdf.getPage(page - 1);
  const { width, height } = pdfPage.getSize();

  pdfPage.drawText(text, {
    x,
    y: height - y, // flip Y so (0,0) is top-left
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  const pdfBytes = await pdf.save();
  const outName = `${crypto.randomUUID()}.pdf`;
  const outPath = `${resultsDir}/${outName}`;
  await Bun.write(outPath, pdfBytes);
  return outPath;
}

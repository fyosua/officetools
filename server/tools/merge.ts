import { loadConfig } from "../config";
import { PDFDocument } from "pdf-lib";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

/**
 * Merge multiple PDF files into one.
 * @param paths - Array of absolute paths to PDF files
 * @returns Path of the merged PDF
 */
export async function merge_pdfs(paths: string[]): Promise<string> {
  if (paths.length < 2) {
    throw new Error("At least two PDF files are required to merge");
  }

  const mergedPdf = await PDFDocument.create();

  for (const filePath of paths) {
    const fileBytes = await Bun.file(filePath).arrayBuffer();
    const pdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const indices = pdf.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(pdf, indices);
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
  }

  const pdfBytes = await mergedPdf.save();
  const outName = `${crypto.randomUUID()}.pdf`;
  const outPath = `${resultsDir}/${outName}`;
  await Bun.write(outPath, pdfBytes);
  return outPath;
}

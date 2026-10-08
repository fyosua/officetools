import { loadConfig } from "../config";
import { PDFDocument } from "pdf-lib";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

const IMG_EXT = /\.(jpe?g|png)$/i;

/**
 * Merge multiple PDFs AND/OR images (JPG/PNG) into one PDF, in order.
 * @returns path of the merged PDF
 */
export async function merge_pdfs(paths: string[]): Promise<string> {
  if (paths.length < 2) throw new Error("At least two files are required to merge");
  const mergedPdf = await PDFDocument.create();

  for (const fp of paths) {
    if (IMG_EXT.test(fp)) {
      const bytes = await Bun.file(fp).arrayBuffer();
      let img;
      try {
        img = fp.endsWith(".png") ? await mergedPdf.embedPng(bytes) : await mergedPdf.embedJpg(bytes);
      } catch (e) {
        throw new Error(`Could not embed image ${fp}: ${(e as Error).message}`);
      }
      const page = mergedPdf.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    } else {
      const bytes = await Bun.file(fp).arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const copied = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      for (const p of copied) mergedPdf.addPage(p);
    }
  }

  const outPath = `${resultsDir}/${crypto.randomUUID()}.pdf`;
  await Bun.write(outPath, await mergedPdf.save());
  return outPath;
}
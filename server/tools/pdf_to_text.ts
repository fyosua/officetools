import { loadConfig } from "../config";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

/**
 * Extract text from a PDF using pdfjs-dist.
 * @param path - Absolute path to the PDF
 * @returns Extracted text content
 */
export async function pdf_to_text(path: string): Promise<string> {
  const fileBytes = await Bun.file(path).arrayBuffer();

  // pdfjs-dist requires a Uint8Array
  const uint8Array = new Uint8Array(fileBytes);

  // Dynamic import for pdfjs-dist (ESM module)
  const pdfjsLib = await import("pdfjs-dist");

  // Set the worker source to use the built-in node version
  const doc = await pdfjsLib.getDocument({ data: uint8Array }).promise;

  const textParts: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    textParts.push(pageText);
  }

  return textParts.join("\n\n").trim();
}

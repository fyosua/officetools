import { loadConfig } from "../config";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

/**
 * Compress a PDF using Ghostscript.
 * @param path - Absolute path to the PDF
 * @param mode - Compression mode: "screen" (low), "ebook" (medium), "printer" (high)
 * @returns Path of the compressed PDF
 */
export async function compress_pdf(path: string, mode: string): Promise<string> {
  const validModes = ["screen", "ebook", "printer"];
  if (!validModes.includes(mode)) {
    throw new Error(`Invalid compression mode "${mode}". Must be one of: ${validModes.join(", ")}`);
  }

  const outName = `${crypto.randomUUID()}.pdf`;
  const outPath = `${resultsDir}/${outName}`;

  // Map mode to Ghostscript's PDFSETTINGS
  const gsModeMap: Record<string, string> = {
    screen: "/screen",
    ebook: "/ebook",
    printer: "/printer",
  };

  const proc = Bun.spawn([
    "gs",
    "-sDEVICE=pdfwrite",
    `-dPDFSETTINGS=${gsModeMap[mode]}`,
    "-dCompatibilityLevel=1.7",
    "-dNOPAUSE",
    "-dQUIET",
    "-dBATCH",
    `-sOutputFile=${outPath}`,
    path,
  ]);

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`Ghostscript compression failed (exit ${exitCode}): ${stderr}`);
  }

  return outPath;
}

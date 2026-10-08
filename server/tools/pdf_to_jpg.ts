import { loadConfig } from "../config";
import sharp from "sharp";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

/**
 * Convert the first page of a PDF to a JPEG image using pdftoppm then sharp.
 * @param path - Absolute path to the PDF
 * @param dpi - Output DPI (default 150)
 * @returns Path of the resulting JPEG
 */
export async function pdf_to_jpg(path: string, dpi: number = 150): Promise<string> {
  const ppmBase = `${resultsDir}/${crypto.randomUUID()}`;

  const proc = Bun.spawn([
    "pdftoppm",
    "-jpeg",
    "-r",
    String(dpi),
    "-f",
    "1",
    "-l",
    "1",
    path,
    ppmBase,
  ]);

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`pdftoppm failed (exit ${exitCode}): ${stderr}`);
  }

  // pdftoppm with -jpeg produces a file like <ppmBase>-1.jpg
  const ppmFile = `${ppmBase}-1.jpg`;
  const ppmExists = await Bun.file(ppmFile).exists();
  if (!ppmExists) {
    throw new Error("pdftoppm did not produce an output file");
  }

  // Use sharp to ensure a clean JPEG output
  const outName = `${crypto.randomUUID()}.jpg`;
  const outPath = `${resultsDir}/${outName}`;
  const imgBuffer = await Bun.file(ppmFile).arrayBuffer();
  await sharp(imgBuffer).jpeg({ quality: 90 }).toFile(outPath);

  // Clean up intermediate pdftoppm file
  await Bun.file(ppmFile).delete();

  return outPath;
}

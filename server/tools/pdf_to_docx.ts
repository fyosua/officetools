import { loadConfig } from "../config";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

/**
 * Convert a PDF to DOCX using LibreOffice headless.
 * @param path - Absolute path to the PDF
 * @returns Path of the resulting DOCX
 */
export async function pdf_to_docx(path: string): Promise<string> {
  const outName = `${crypto.randomUUID()}.docx`;
  const outPath = `${resultsDir}/${outName}`;

  const proc = Bun.spawn([
    "/usr/bin/soffice",
    "--headless",
    "--convert-to",
    "docx",
    "--outdir",
    resultsDir,
    path,
  ]);

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`LibreOffice PDF to DOCX conversion failed (exit ${exitCode}): ${stderr}`);
  }

  // LibreOffice writes output with the original filename in the outdir
  const srcName = path.split("/").pop()?.replace(/\.\w+$/, ".docx");
  if (!srcName) {
    throw new Error("Could not determine source filename");
  }
  const srcPath = `${resultsDir}/${srcName}`;

  const exists = await Bun.file(srcPath).exists();
  if (!exists) {
    throw new Error(`LibreOffice did not produce expected output: ${srcPath}`);
  }

  // Rename to UUID filename
  await Bun.write(outPath, Bun.file(srcPath));
  await Bun.file(srcPath).delete();

  return outPath;
}

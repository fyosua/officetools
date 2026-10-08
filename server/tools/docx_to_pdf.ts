import { loadConfig } from "../config";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

/**
 * Convert a DOCX file to PDF using LibreOffice headless.
 * @param path - Absolute path to the DOCX file
 * @returns Path of the resulting PDF
 */
export async function docx_to_pdf(path: string): Promise<string> {
  const outName = `${crypto.randomUUID()}.pdf`;
  const outPath = `${resultsDir}/${outName}`;

  const proc = Bun.spawn([
    "/usr/bin/soffice",
    "--headless",
    "--convert-to",
    "pdf",
    "--outdir",
    resultsDir,
    path,
  ]);

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`LibreOffice conversion failed (exit ${exitCode}): ${stderr}`);
  }

  // LibreOffice writes output with the original filename in the outdir
  // We need to rename it to our UUID-based name
  const srcName = path.split("/").pop()?.replace(/\.\w+$/, ".pdf");
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

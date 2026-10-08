import { loadConfig } from "../config";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

/**
 * Unlock (remove password protection from) a PDF using qpdf or Ghostscript.
 * @param path - Absolute path to the password-protected PDF
 * @param password - The owner/user password to unlock
 * @returns Path of the unlocked PDF
 */
export async function unlock_pdf(path: string, password: string): Promise<string> {
  const outName = `${crypto.randomUUID()}.pdf`;
  const outPath = `${resultsDir}/${outName}`;

  // Try qpdf first (fastest), fall back to Ghostscript
  const qpdfPath = Bun.which("qpdf");
  if (qpdfPath) {
    const proc = Bun.spawn([
      qpdfPath,
      "--decrypt",
      `--password=${password}`,
      path,
      outPath,
    ]);
    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      throw new Error(`qpdf unlock failed (exit ${exitCode}): ${stderr}`);
    }
    return outPath;
  }

  // Fallback: Ghostscript (re-writes the PDF without encryption)
  const gsPath = Bun.which("gs");
  if (!gsPath) {
    throw new Error(
      "Neither qpdf nor Ghostscript is available. Install one to unlock PDFs."
    );
  }

  // Ghostscript can decrypt by processing with the owner password
  // Note: GS may prompt for password interactively, so we use -sPDFPassword
  const proc = Bun.spawn([
    gsPath,
    "-sDEVICE=pdfwrite",
    "-dCompatibilityLevel=1.7",
    "-dNOPAUSE",
    "-dQUIET",
    "-dBATCH",
    `-sPDFPassword=${password}`,
    `-sOutputFile=${outPath}`,
    path,
  ]);
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`Ghostscript unlock failed (exit ${exitCode}): ${stderr}`);
  }

  return outPath;
}
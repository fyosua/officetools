import { loadConfig } from "../config";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

/**
 * Add password protection to a PDF using qpdf or Ghostscript.
 * @param path - Absolute path to the PDF
 * @param password - Password to protect the PDF with
 * @returns Path of the protected PDF
 */
export async function protect_pdf(path: string, password: string): Promise<string> {
  const outName = `${crypto.randomUUID()}.pdf`;
  const outPath = `${resultsDir}/${outName}`;

  // Try qpdf first
  const qpdfPath = Bun.which("qpdf");
  if (qpdfPath) {
    const proc = Bun.spawn([
      qpdfPath,
      "--encrypt",
      password,
      password,
      "128",
      "--",
      path,
      outPath,
    ]);
    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      throw new Error(`qpdf protect failed (exit ${exitCode}): ${stderr}`);
    }
    return outPath;
  }

  // Fallback: Ghostscript with pdfwrite and encryption
  const gsPath = Bun.which("gs");
  if (!gsPath) {
    throw new Error(
      "Neither qpdf nor Ghostscript is available. Install one to protect PDFs."
    );
  }

  // Ghostscript can add encryption via -sOwnerPassword and -sUserPassword
  const proc = Bun.spawn([
    gsPath,
    "-sDEVICE=pdfwrite",
    "-dCompatibilityLevel=1.7",
    "-dNOPAUSE",
    "-dQUIET",
    "-dBATCH",
    `-sOwnerPassword=${password}`,
    `-sUserPassword=${password}`,
    "-dEncryptDocument=true",
    `-sOutputFile=${outPath}`,
    path,
  ]);
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`Ghostscript protect failed (exit ${exitCode}): ${stderr}`);
  }

  return outPath;
}
import { loadConfig } from "../config";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

/**
 * Convert an Office document (docx/xlsx/pptx/odt/ods/odp/csv/rtf/txt) to PDF via LibreOffice headless.
 * @returns path of the resulting PDF
 */
export async function office_to_pdf(path: string): Promise<string> {
  const proc = Bun.spawn(["/usr/bin/soffice", "--headless", "--convert-to", "pdf", "--outdir", resultsDir, path]);
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`LibreOffice conversion failed (exit ${exitCode}): ${stderr}`);
  }
  // LibreOffice writes <basename>.pdf into outdir
  const srcName = path.split("/").pop()?.replace(/\.\w+$/, ".pdf");
  const srcPath = `${resultsDir}/${srcName}`;
  if (!(await Bun.file(srcPath).exists())) throw new Error(`LibreOffice produced no PDF: ${srcPath}`);
  const outPath = `${resultsDir}/${crypto.randomUUID()}.pdf`;
  await Bun.write(outPath, Bun.file(srcPath));
  await Bun.file(srcPath).delete();
  return outPath;
}
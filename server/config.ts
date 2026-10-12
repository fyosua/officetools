export interface AppConfig {
  appPassword: string;
  secretKey: string;
  maxFileSizeMB: number;
  processingDir: string;
  port: number;
  /** Directory holding the full PDFCraft static export (served app-behind-login at /pdfcraft). */
  pdfcraftDir: string;
}

export function loadConfig(): AppConfig {
  return {
    appPassword: Bun.env.APP_PASSWORD || "",
    secretKey: Bun.env.SECRET_KEY || Bun.randomUUIDv7(),
    maxFileSizeMB: parseInt(Bun.env.MAX_FILE_SIZE_MB || "50"),
    processingDir: Bun.env.PROCESSING_DIR || "./processing",
    port: parseInt(Bun.env.PORT || "3002"),
    pdfcraftDir: Bun.env.PDFCRAFT_DIR || "/home/clowniiizzz/officetools-pdfcraft/out",
  };
}
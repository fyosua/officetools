export interface AppConfig {
  appPassword: string;
  secretKey: string;
  maxFileSizeMB: number;
  processingDir: string;
  port: number;
}

export function loadConfig(): AppConfig {
  return {
    appPassword: Bun.env.APP_PASSWORD || "",
    secretKey: Bun.env.SECRET_KEY || Bun.randomUUIDv7(),
    maxFileSizeMB: parseInt(Bun.env.MAX_FILE_SIZE_MB || "50"),
    processingDir: Bun.env.PROCESSING_DIR || "./processing",
    port: parseInt(Bun.env.PORT || "3002"),
  };
}
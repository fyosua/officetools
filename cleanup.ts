import { rmSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

const processingDir = process.env.PROCESSING_DIR || "./processing";
const maxAgeMs = 3600 * 1000; // 1 hour

function clean(dir: string): { deleted: number; remaining: number } {
  if (!existsSync(dir)) return { deleted: 0, remaining: 0 };
  let deleted = 0;
  let remaining = 0;
  const now = Date.now();
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isFile()) {
      if (now - stat.mtimeMs > maxAgeMs) {
        rmSync(full);
        deleted++;
      } else {
        remaining++;
      }
    }
  }
  return { deleted, remaining };
}

const uploads = join(processingDir, "uploads");
const results = join(processingDir, "results");
const up = clean(uploads);
const res = clean(results);
console.log(`Cleanup: deleted ${up.deleted + res.deleted} file(s), ${up.remaining + res.remaining} remaining`);
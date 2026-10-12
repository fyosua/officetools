// PdfCraft workbench engine — integration layer for officetools.
//
// Design (matches cross-agent build directive 2026-10-12 + PdfCraft assessment §6b/8):
//  - Runs pdfcraft-cli as a SEPARATE low-privilege user (system user `pdfsvc`, uid 111)
//    via the root-owned wrapper /usr/local/sbin/pdfcraft_wrap.sh. That wrapper enforces
//    per-job `--root` confinement + resource limits (ulimit -v/-t/-f/-n) before exec.
//  - Each request gets a dedicated per-job temp dir (owned by pdfsvc, mode 700); the
//    only thing that crosses back to the Elysia process is the produced output file.
//  - A concurrency semaphore caps simultaneous PdfCraft jobs (alpha renderer).
//  - The upload path is ONLY ever passed into the wrapper as argv — no shell interpolation.

import { loadConfig } from "../config";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

const CLI = "/usr/local/bin/pdfcraft-cli";
const WRAPPER = "/usr/local/sbin/pdfcraft_wrap.sh";
const SUDO = "/usr/bin/sudo";
const PDFSVC = "pdfsvc";
const JOBS_ROOT = "/tmp/pdfcraft-jobs";
const MAX_CONCURRENCY = 2;

// --- Minimal promise-based semaphore -------------------------------------------
let active = 0;
const waiters: (() => void)[] = [];
async function acquire(): Promise<void> {
  if (active < MAX_CONCURRENCY) { active++; return; }
  await new Promise<void>((resolve) => waiters.push(resolve));
  active++;
}
function release(): void {
  active--;
  const next = waiters.shift();
  if (next) next();
}

function sh(cmd: string[]): { code: number; stdout: string; stderr: string } {
  const p = Bun.spawnSync(cmd, { stdout: "pipe", stderr: "pipe" });
  return {
    code: p.exitCode ?? -1,
    stdout: p.stdout?.toString() ?? "",
    stderr: p.stderr?.toString() ?? "",
  };
}

async function execWrapper(jobRoot: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  // Step 1: hand the job dir to pdfsvc (700 => private to the low-priv worker)
  sh([SUDO, "-n", "chown", "-R", PDFSVC, jobRoot]);
  sh([SUDO, "-n", "chmod", "700", jobRoot]);

  // Step 2: run pdfcraft confined to that dir
  const capOut = `${JOBS_ROOT}/cap_${crypto.randomUUID()}.out`;
  const capErr = `${JOBS_ROOT}/cap_${crypto.randomUUID()}.err`;
  const p = Bun.spawnSync(
    [SUDO, "-n", "-u", PDFSVC, WRAPPER, jobRoot, "--", ...args],
    { stdout: "pipe", stderr: "pipe" }
  );
  const stdout = p.stdout?.toString() ?? "";
  const stderr = p.stderr?.toString() ?? "";

  // Step 3: give the dir back to the Elysia user so it can read the result out
  sh([SUDO, "-n", "chown", "-R", `${process.getuid?.() ?? "clowniiizzz"}`, jobRoot]);
  sh([SUDO, "-n", "chmod", "700", jobRoot]);
  void capOut; void capErr;
  return { code: p.exitCode ?? -1, stdout, stderr };
}

/** Copy uploaded files into a fresh per-job dir, run steps, and return the job root.
 *  `outNames` are the files expected inside the dir after a successful run. */
async function jobRun(
  uploads: string[],
  steps: unknown[],
  expectFiles: string[]
): Promise<{ files: { name: string; abs: string }[]; notes: string; jobRoot: string }> {
  await acquire();
  let jobRoot = "";
  try {
    const id = crypto.randomUUID();
    jobRoot = `${JOBS_ROOT}/${id}`;
    Bun.spawnSync(["mkdir", "-p", jobRoot]);
    for (const u of uploads) {
      Bun.spawnSync(["cp", u, jobRoot]);
    }
    const stepNames = uploads.map((u) => u.split("/").pop()!);
    // If a step references the uploaded file by the orginal (uuid) name, remap to the
    // bare basename we copied in.
    const stepsText = JSON.stringify(steps).replace(/\{UPLOAD:(\d+)\}/g, (_m: string, idx: string) =>
      stepNames[parseInt(idx, 10)] ?? "input.pdf"
    );
    await Bun.write(`${jobRoot}/steps.json`, stepsText);

    const { code, stderr } = await execWrapper(jobRoot, ["--script", "steps.json"]);
    if (code !== 0) {
      throw new Error(`pdfcraft failed (exit ${code}): ${stderr.trim() || "no detail"}`);
    }

    const files = [];
    for (const name of expectFiles) {
      const abs = `${jobRoot}/${name}`;
      if (Bun.file(abs).size > 0) files.push({ name, abs });
    }
    if (expectFiles.length && files.length !== expectFiles.length) {
      throw new Error(`expected outputs missing: want ${expectFiles.join(",")} got ${files.map((f) => f.name).join(",") || "(none)"}`);
    }
    return { files, notes: stderr.trim(), jobRoot };
  } finally {
    void release();
  }
}

/** Copy a produced file into the results dir and return its download URL. */
async function stageResult(abs: string, outName?: string): Promise<string> {
  const name = outName ?? abs.split("/").pop()!;
  const target = `${resultsDir}/${name}`;
  await Bun.write(target, Bun.file(abs));
  return `/api/download/${name}`;
}

export interface PdfcraftOut {
  url?: string;
  urls?: string[];
  text?: string;
  name?: string;
  jobNotes?: string;
}

// --- Workbench operations --------------------------------------------------------

export async function pdfcraft_rotate(path: string, pages: number[], degrees: number): Promise<PdfcraftOut> {
  const { files } = await jobRun(
    [path],
    [
      { tool: "doc_open", args: { path: "{UPLOAD:0}" } },
      { tool: "page_rotate", args: { doc: 1, pages, degrees } },
      { tool: "doc_save", args: { doc: 1, path: "out.pdf", full: true } },
      { tool: "doc_close", args: { doc: 1 } },
    ],
    ["out.pdf"]
  );
  return { url: await stageResult(files[0]!.abs, `rotate_${crypto.randomUUID()}.pdf`) };
}

export async function pdfcraft_combine(paths: string[], outName?: string): Promise<PdfcraftOut> {
  const stepPaths = paths.map((_, i) => `{UPLOAD:${i}}`);
  const { files } = await jobRun(
    paths,
    [
      { tool: "doc_combine", args: { paths: stepPaths, out: "combined.pdf" } },
    ],
    ["combined.pdf"]
  );
  return { url: await stageResult(files[0]!.abs, outName ?? `combine_${crypto.randomUUID()}.pdf`) };
}

export async function pdfcraft_split(path: string, every?: number, before?: number[]): Promise<PdfcraftOut> {
  const args: Record<string, unknown> = { doc: 1, out_dir: "parts" };
  if (every) args.every = every;
  if (before?.length) args.before = before;
  const { jobRoot } = await jobRun(
    [path],
    [
      { tool: "doc_open", args: { path: "{UPLOAD:0}" } },
      { tool: "doc_split", args },
      { tool: "doc_close", args: { doc: 1 } },
    ],
    []
  );
  // doc_split writes its parts into <root>/parts/ — enumerate & stage each
  const partsDir = `${jobRoot}/parts`;
  const strings: { dir: string; names: string[] }[] = [{ dir: partsDir, names: sh(["ls", partsDir]).stdout.split("\n").filter((n) => n.endsWith(".pdf")) }];
  if (!strings[0]!.names.length) {
    // fallback: parts may be dropped directly in the job root
    strings[0] = { dir: jobRoot, names: sh(["ls", jobRoot]).stdout.split("\n").filter((n) => n.endsWith(".pdf") && n !== "out.pdf") };
  }
  const urls: string[] = [];
  for (const { dir, names } of strings)
    for (const n of names) urls.push(await stageResult(`${dir}/${n}`, `split_${crypto.randomUUID()}_${n}`.replace(/[/\\]/g, "_")));
  return { urls };
}

export async function pdfcraft_annotate(path: string, type: string, page: number, find?: string, contents?: string, color?: string): Promise<PdfcraftOut> {
  const args: Record<string, unknown> = { doc: 1, page, type };
  if (find) args.find = find;
  if (contents) args.contents = contents;
  if (color) args.color = color;
  const { files } = await jobRun(
    [path],
    [
      { tool: "doc_open", args: { path: "{UPLOAD:0}" } },
      { tool: "comment_add", args },
      { tool: "doc_save", args: { doc: 1, path: "out.pdf", full: true } },
      { tool: "doc_close", args: { doc: 1 } },
    ],
    ["out.pdf"]
  );
  return { url: await stageResult(files[0]!.abs, `annotate_${crypto.randomUUID()}.pdf`) };
}

export async function pdfcraft_fill_form(path: string, values: Record<string, string>): Promise<PdfcraftOut> {
  const { files } = await jobRun(
    [path],
    [
      { tool: "doc_open", args: { path: "{UPLOAD:0}" } },
      { tool: "form_fill", args: { doc: 1, values } },
      { tool: "doc_save", args: { doc: 1, path: "out.pdf", full: true } },
      { tool: "doc_close", args: { doc: 1 } },
    ],
    ["out.pdf"]
  );
  return { url: await stageResult(files[0]!.abs, `formfill_${crypto.randomUUID()}.pdf`) };
}

export async function pdfcraft_render(path: string, page: number, dpi: number): Promise<PdfcraftOut> {
  const { files } = await jobRun(
    [path],
    [
      { tool: "doc_open", args: { path: "{UPLOAD:0}" } },
      { tool: "page_render", args: { doc: 1, page, dpi }, out: "page.png" },
    ],
    ["page.png"]
  );
  return { url: await stageResult(files[0]!.abs, `render_${crypto.randomUUID()}.png`) };
}

export async function pdfcraft_text(path: string): Promise<PdfcraftOut> {
  const { files } = await jobRun(
    [path],
    [
      { tool: "doc_open", args: { path: "{UPLOAD:0}" } },
      { tool: "doc_export_text", args: { doc: 1, path: "out.txt" } },
    ],
    ["out.txt"]
  );
  const text = await Bun.file(files[0]!.abs).text();
  return { text };
}

export async function pdfcraft_edit_text(path: string, page: number, text: string, line?: number): Promise<PdfcraftOut> {
  const args: Record<string, unknown> = { doc: 1, page, text };
  if (line) args.line = line;
  const { files } = await jobRun(
    [path],
    [
      { tool: "doc_open", args: { path: "{UPLOAD:0}" } },
      { tool: "text_edit", args },
      { tool: "doc_save", args: { doc: 1, path: "out.pdf", full: true } },
      { tool: "doc_close", args: { doc: 1 } },
    ],
    ["out.pdf"]
  );
  return { url: await stageResult(files[0]!.abs, `edit_${crypto.randomUUID()}.pdf`) };
}

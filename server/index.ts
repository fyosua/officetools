import { Elysia, t } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { staticPlugin } from "@elysiajs/static";
import { cors } from "@elysiajs/cors";
import { loadConfig } from "./config";
import { createSessionCookie, verifySession } from "./auth";

// Tool imports
import { merge_pdfs } from "./tools/merge";
import { split_pdf } from "./tools/split";
import { compress_pdf } from "./tools/compress";
import { pdf_to_jpg } from "./tools/pdf_to_jpg";
import { pdf_to_png } from "./tools/pdf_to_png";
import { images_to_pdf } from "./tools/jpg_to_pdf";
import { docx_to_pdf } from "./tools/docx_to_pdf";
import { pdf_to_docx } from "./tools/pdf_to_docx";
import { rotate_pdf } from "./tools/rotate";
import { unlock_pdf } from "./tools/unlock";
import { protect_pdf } from "./tools/protect";
import { pdf_to_text } from "./tools/pdf_to_text";
import { delete_pages } from "./tools/delete_pages";
import { add_text_annotation } from "./tools/pdf_editor";
import { office_to_pdf } from "./tools/office_to_pdf";
import { watermark_pdf } from "./tools/watermark";
import { number_pages } from "./tools/number_pages";
import { crop_pdf } from "./tools/crop_pdf";
import { organize_pdf } from "./tools/organize_pdf";
import { annotate_pdf } from "./tools/annotate_pdf";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

/** Require a valid session cookie, else 401. Call first in every protected handler. */
function requireAuth({ cookie, set }: { cookie: any; set: any }): void {
  const session = cookie?.session;
  if (!session?.value || !verifySession(session.value, config.secretKey)) {
    set.status = 401;
    throw new Error("Unauthorized");
  }
}

async function saveUploadedFile(formData: FormData, field: string = "file"): Promise<string> {
  const file = formData.get(field) as File | null;
  if (!file || file.size === 0) throw new Error(`No file provided`);
  const ext = file.name.split(".").pop() || "bin";
  const p = `${config.processingDir}/uploads/${crypto.randomUUID()}.${ext}`;
  await Bun.write(p, file);
  return p;
}

async function saveUploadedFiles(formData: FormData, field: string = "file"): Promise<string[]> {
  const files = formData.getAll(field) as File[];
  if (!files || files.length === 0) throw new Error(`No files provided`);
  const paths: string[] = [];
  for (const f of files) {
    const ext = f.name.split(".").pop() || "bin";
    const p = `${config.processingDir}/uploads/${crypto.randomUUID()}.${ext}`;
    await Bun.write(p, f);
    paths.push(p);
  }
  return paths;
}

function resultUrl(abspath: string): string {
  const name = abspath.split("/").pop()!;
  return `/api/download/${name}`;
}
function resultUrls(paths: string[]): string[] {
  return paths.map(resultUrl);
}

Bun.spawnSync(["mkdir", "-p", `${config.processingDir}/uploads`, `${config.processingDir}/results`]);

const app = new Elysia()
  .use(cors())
  .use(cookie())
  .onError(({ code, error, set }) => {
    if (!set.status) set.status = code === "VALIDATION" ? 400 : 500;
    const msg = error && typeof error === "object" && "message" in error ? (error as any).message : String(error);
    return { error: msg || "Internal server error" };
  })
  // --- Auth (REQUIRED for private use) ---
  .post("/api/login", ({ body, cookie, set }) => {
    const session = cookie?.session;
    if (!session) { set.status = 500; return { success: false, message: "Cookie error" }; }
    if (body.password !== config.appPassword) {
      set.status = 401;
      return { success: false, message: "Invalid password" };
    }
    const s = createSessionCookie(config.secretKey);
    session.set({ value: s["session"], maxAge: 86400, path: "/", httpOnly: true, sameSite: "lax" });
    return { success: true, message: "Authenticated" };
  }, { body: t.Object({ password: t.String() }) })
  .get("/api/check-auth", ({ cookie }) => {
    const s = cookie?.session;
    return { authenticated: verifySession(typeof s?.value === "string" ? s.value : undefined, config.secretKey) };
  })
  .post("/api/logout", ({ cookie }) => {
    const s = cookie?.session;
    if (s) s.set({ value: "", maxAge: 0, path: "/" });
    return { success: true };
  })
  .get("/api/health", () => ({ status: "ok", version: "1.1.0" }))
  // --- Download endpoint (PROTECTED) ---
  .get("/api/download/:filename", ({ params: { filename }, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const filepath = `${resultsDir}/${filename}`;
    const file = Bun.file(filepath);
    if (!file.size) { set.status = 404; return { error: "File not found" }; }
    return new Response(file, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  })
  // --- Tools (ALL PROTECTED) ---
  .post("/api/merge", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const paths = await saveUploadedFiles(await request.formData(), "file");
    return { url: resultUrl(await merge_pdfs(paths)) };
  })
  .post("/api/split", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const fd = await request.formData();
    const path = await saveUploadedFile(fd, "file");
    const mode = (fd.get("mode") as string) || "split";
    const pages = (fd.get("pages") as string) || (fd.get("input") as string) || "1";
    const parts = (fd.get("parts") as string) || "";
    return { urls: resultUrls(await split_pdf(path, mode as "split" | "extract" | "perpage" | "parts", pages, parts)) };
  })
  .post("/api/compress", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const fd = await request.formData();
    const path = await saveUploadedFile(fd, "file");
    return { url: resultUrl(await compress_pdf(path, (fd.get("mode") as string) || "ebook")) };
  })
  .post("/api/pdf-to-jpg", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const fd = await request.formData();
    const path = await saveUploadedFile(fd, "file");
    const dpi = parseInt((fd.get("dpi") as string) || "150", 10);
    return { urls: resultUrls(await pdf_to_jpg(path, dpi)) };
  })
  .post("/api/pdf-to-png", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const fd = await request.formData();
    const path = await saveUploadedFile(fd, "file");
    const dpi = parseInt((fd.get("dpi") as string) || "150", 10);
    return { urls: resultUrls(await pdf_to_png(path, dpi)) };
  })
  .post("/api/delete-pages", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const fd = await request.formData();
    const path = await saveUploadedFile(fd, "file");
    return { url: resultUrl(await delete_pages(path, (fd.get("pages") as string) || "")) };
  })
  .post("/api/office-to-pdf", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const fd = await request.formData();
    const path = await saveUploadedFile(fd, "file");
    return { url: resultUrl(await office_to_pdf(path)) };
  })
  .post("/api/watermark", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const fd = await request.formData();
    const path = await saveUploadedFile(fd, "file");
    const opacity = parseFloat((fd.get("opacity") as string) || "0.35");
    return { url: resultUrl(await watermark_pdf(path, (fd.get("text") as string) || "CONFIDENTIAL", isNaN(opacity) ? 0.35 : opacity)) };
  })
  .post("/api/number-pages", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const fd = await request.formData();
    const path = await saveUploadedFile(fd, "file");
    const start = parseInt((fd.get("start") as string) || "1", 10);
    const position = (fd.get("position") as string) || "bm";
    return { url: resultUrl(await number_pages(path, isNaN(start) ? 1 : start, position)) };
  })
  .post("/api/crop", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const fd = await request.formData();
    const path = await saveUploadedFile(fd, "file");
    const margin = parseFloat((fd.get("margin") as string) || "10");
    return { url: resultUrl(await crop_pdf(path, isNaN(margin) ? 10 : margin)) };
  })
  .post("/api/organize", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const fd = await request.formData();
    const path = await saveUploadedFile(fd, "file");
    const spec = (fd.get("spec") as string) || "";
    return { url: resultUrl(await organize_pdf(path, spec)) };
  })
  .post("/api/jpg-to-pdf", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const fd = await request.formData();
    const paths = await saveUploadedFiles(fd, "file");
    const margin = parseFloat((fd.get("margin") as string) || "0");
    const orientation = (fd.get("orientation") as string) || "auto";
    const size = (fd.get("size") as string) || "auto";
    return { url: resultUrl(await images_to_pdf(paths, { margin: isNaN(margin) ? 0 : margin, orientation, size })) };
  })
  .post("/api/docx-to-pdf", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    return { url: resultUrl(await docx_to_pdf(await saveUploadedFile(await request.formData(), "file"))) };
  })
  .post("/api/pdf-to-docx", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    return { url: resultUrl(await pdf_to_docx(await saveUploadedFile(await request.formData(), "file"))) };
  })
  .post("/api/rotate", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const fd = await request.formData();
    const path = await saveUploadedFile(fd, "file");
    return { url: resultUrl(await rotate_pdf(path, (fd.get("pages") as string) || "all", parseInt((fd.get("angle") as string) || "90", 10))) };
  })
  .post("/api/unlock", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const fd = await request.formData();
    return { url: resultUrl(await unlock_pdf(await saveUploadedFile(fd, "file"), (fd.get("password") as string) || "")) };
  })
  .post("/api/protect", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const fd = await request.formData();
    return { url: resultUrl(await protect_pdf(await saveUploadedFile(fd, "file"), (fd.get("password") as string) || "")) };
  })
  .post("/api/pdf-to-text", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const text = await pdf_to_text(await saveUploadedFile(await request.formData(), "file"));
    return { text };
  })
  .post("/api/pdf-editor", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const fd = await request.formData();
    const path = await saveUploadedFile(fd, "file");
    const text = (fd.get("text") as string) || "";
    return { url: resultUrl(await add_text_annotation(path, text, 1, 50, 50)) };
  })
  .post("/api/annotate", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const fd = await request.formData();
    const path = await saveUploadedFile(fd, "file");
    const spec = (fd.get("spec") as string) || "[]";
    // collect any image_<i> fields as bytes for image annotations
    const imageFiles: (ArrayBuffer | Uint8Array)[] = [];
    for (const key of fd.keys()) {
      if (key.startsWith("image_")) {
        const f = fd.get(key) as File | null;
        if (f && f.size) imageFiles[parseInt(key.split("_")[1]!, 10)] = await f.arrayBuffer();
      }
    }
    return { url: resultUrl(await annotate_pdf(path, spec, imageFiles)) };
  })
  // --- Static ---
  .use(staticPlugin({ assets: "./client/dist", prefix: "/" }))
  .get("/", () => new Response(Bun.file("./client/dist/index.html"), { headers: { "Content-Type": "text/html" } }))
  .listen(config.port);

console.log(`🛠️  OfficeTools running on http://127.0.0.1:${config.port}`);
export type App = typeof app;
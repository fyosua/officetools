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
import { images_to_pdf } from "./tools/jpg_to_pdf";
import { docx_to_pdf } from "./tools/docx_to_pdf";
import { pdf_to_docx } from "./tools/pdf_to_docx";
import { rotate_pdf } from "./tools/rotate";
import { unlock_pdf } from "./tools/unlock";
import { protect_pdf } from "./tools/protect";
import { pdf_to_text } from "./tools/pdf_to_text";
import { add_text_annotation } from "./tools/pdf_editor";

const config = loadConfig();

if (!config.appPassword) {
  throw new Error("APP_PASSWORD must be set in .env file");
}

Bun.spawnSync(["mkdir", "-p", `${config.processingDir}/uploads`, `${config.processingDir}/results`]);

const resultsDir = `${config.processingDir}/results`;

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

function requireAuth({ cookie, set }: { cookie: any; set: any }): void {
  const session = cookie?.session;
  if (!session?.value || !verifySession(session.value, config.secretKey)) {
    set.status = 401;
    throw new Error("Unauthorized");
  }
}

function resultUrl(abspath: string): string {
  const name = abspath.split("/").pop()!;
  return `/api/download/${name}`;
}

const app = new Elysia()
  .use(cors())
  .use(cookie())
  .onError(({ code, error, set }) => {
    const msg = error && typeof error === "object" && "message" in error ? (error as any).message : String(error);
    set.status = code === "VALIDATION" ? 400 : 500;
    return { error: msg || "Internal server error" };
  })
  // --- Auth ---
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
  .get("/api/health", () => ({ status: "ok", version: "1.0.0" }))
  // --- Download endpoint ---
  .get("/api/download/:filename", ({ params: { filename }, cookie, set }: any) => {
    const s = cookie?.session;
    if (!verifySession(typeof s?.value === "string" ? s.value : undefined, config.secretKey)) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
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
  // --- Tools ---
  .post("/api/merge", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const paths = await saveUploadedFiles(await request.formData(), "file");
    return { url: resultUrl(await merge_pdfs(paths)) };
  })
  .post("/api/split", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const fd = await request.formData();
    const path = await saveUploadedFile(fd, "file");
    const ranges = (fd.get("input") as string) || "1";
    const urls = (await split_pdf(path, ranges)).map(resultUrl);
    return { urls };
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
    return { url: resultUrl(await pdf_to_jpg(path, dpi)) };
  })
  .post("/api/jpg-to-pdf", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const paths = await saveUploadedFiles(await request.formData(), "file");
    return { url: resultUrl(await images_to_pdf(paths)) };
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
  // --- Static ---
  .use(staticPlugin({ assets: "./client/dist", prefix: "/" }))
  .get("/", () => new Response(Bun.file("./client/dist/index.html"), { headers: { "Content-Type": "text/html" } }))
  .listen(config.port);

console.log(`🛠️  OfficeTools running on http://127.0.0.1:${config.port}`);
export type App = typeof app;
import { Elysia, t } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { staticPlugin } from "@elysiajs/static";
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

// Ensure processing dirs exist
Bun.spawnSync(["mkdir", "-p", `${config.processingDir}/uploads`, `${config.processingDir}/results`]);

// Helper: save uploaded file from form data
async function saveUploadedFile(formData: FormData, field: string = "file"): Promise<string> {
  const file = formData.get(field) as File | null;
  if (!file || file.size === 0) {
    throw new Error(`No file provided (field: "${field}")`);
  }
  const ext = file.name.split(".").pop() || "bin";
  const uploadPath = `${config.processingDir}/uploads/${crypto.randomUUID()}.${ext}`;
  await Bun.write(uploadPath, file);
  return uploadPath;
}

// Helper: save multiple uploaded files
async function saveUploadedFiles(formData: FormData, field: string = "file"): Promise<string[]> {
  const files = formData.getAll(field) as File[];
  if (!files || files.length === 0) {
    throw new Error(`No files provided (field: "${field}")`);
  }
  const paths: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop() || "bin";
    const uploadPath = `${config.processingDir}/uploads/${crypto.randomUUID()}.${ext}`;
    await Bun.write(uploadPath, file);
    paths.push(uploadPath);
  }
  return paths;
}

// Helper: require authenticated session
function requireAuth({ cookie, set }: { cookie: any; set: any }): void {
  const session = cookie?.session;
  if (!session?.value || !verifySession(session.value, config.secretKey)) {
    set.status = 401;
    throw new Error("Unauthorized");
  }
}

const app = new Elysia()
  .use(cookie())
  // --- Auth endpoints ---
  .post(
    "/api/login",
    ({ body, cookie: { session }, set }) => {
      if (body.password !== config.appPassword) {
        set.status = 401;
        return { success: false, message: "Invalid password" };
      }
      const s = createSessionCookie(config.secretKey);
      session.set({
        value: s["session"],
        maxAge: 86400,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
      return { success: true, message: "Authenticated" };
    },
    { body: t.Object({ password: t.String() }) }
  )
  .get("/api/check-auth", ({ cookie }) => {
    const session = cookie?.session;
    return { authenticated: verifySession(session?.value, config.secretKey) };
  })
  .post("/api/logout", ({ cookie }) => {
    const session = cookie?.session;
    if (session) session.set({ value: "", maxAge: 0, path: "/" });
    return { success: true };
  })
  // --- Health ---
  .get("/api/health", () => ({ status: "ok", version: "0.2.0" }))
  // --- Tool endpoints ---
  .post("/api/merge", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const formData = await request.formData();
    const paths = await saveUploadedFiles(formData, "file");
    const resultPath = await merge_pdfs(paths);
    return { path: resultPath };
  })
  .post("/api/split", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const formData = await request.formData();
    const path = await saveUploadedFile(formData, "file");
    const ranges = (formData.get("input") as string) || "1";
    const resultPaths = await split_pdf(path, ranges);
    return { paths: resultPaths };
  })
  .post("/api/compress", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const formData = await request.formData();
    const path = await saveUploadedFile(formData, "file");
    const mode = (formData.get("mode") as string) || "ebook";
    const resultPath = await compress_pdf(path, mode);
    return { path: resultPath };
  })
  .post("/api/pdf-to-jpg", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const formData = await request.formData();
    const path = await saveUploadedFile(formData, "file");
    const dpi = parseInt((formData.get("dpi") as string) || "150", 10);
    const resultPath = await pdf_to_jpg(path, dpi);
    return { path: resultPath };
  })
  .post("/api/jpg-to-pdf", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const formData = await request.formData();
    const paths = await saveUploadedFiles(formData, "file");
    const resultPath = await images_to_pdf(paths);
    return { path: resultPath };
  })
  .post("/api/docx-to-pdf", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const formData = await request.formData();
    const path = await saveUploadedFile(formData, "file");
    const resultPath = await docx_to_pdf(path);
    return { path: resultPath };
  })
  .post("/api/pdf-to-docx", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const formData = await request.formData();
    const path = await saveUploadedFile(formData, "file");
    const resultPath = await pdf_to_docx(path);
    return { path: resultPath };
  })
  .post("/api/rotate", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const formData = await request.formData();
    const path = await saveUploadedFile(formData, "file");
    const pages = (formData.get("pages") as string) || "all";
    const angle = parseInt((formData.get("angle") as string) || "90", 10);
    const resultPath = await rotate_pdf(path, pages, angle);
    return { path: resultPath };
  })
  .post("/api/unlock", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const formData = await request.formData();
    const path = await saveUploadedFile(formData, "file");
    const password = (formData.get("password") as string) || "";
    const resultPath = await unlock_pdf(path, password);
    return { path: resultPath };
  })
  .post("/api/protect", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const formData = await request.formData();
    const path = await saveUploadedFile(formData, "file");
    const password = (formData.get("password") as string) || "";
    const resultPath = await protect_pdf(path, password);
    return { path: resultPath };
  })
  .post("/api/pdf-to-text", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const formData = await request.formData();
    const path = await saveUploadedFile(formData, "file");
    const text = await pdf_to_text(path);
    return { text };
  })
  .post("/api/pdf-editor", async ({ request, cookie, set }: any) => {
    requireAuth({ cookie, set });
    const formData = await request.formData();
    const path = await saveUploadedFile(formData, "file");
    const text = (formData.get("text") as string) || "";
    const page = parseInt((formData.get("page") as string) || "1", 10);
    const x = parseFloat((formData.get("x") as string) || "50");
    const y = parseFloat((formData.get("y") as string) || "50");
    const resultPath = await add_text_annotation(path, text, page, x, y);
    return { path: resultPath };
  })
  // --- Serve Svelte static build ---
  .use(staticPlugin({ assets: "./client/dist", prefix: "/" }))
  .listen(config.port);

console.log(`🛠️  OfficeTools running on http://127.0.0.1:${config.port}`);

export type App = typeof app;
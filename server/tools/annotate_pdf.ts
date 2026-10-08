import { loadConfig } from "../config";
import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

function hexToRgb(hex: string) {
  const h = (hex || "#000000").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/**
 * Render annotations onto a PDF. Spec is a JSON array, coordinates normalized 0-1
 * with y from the TOP (CSS-like). Server maps to PDF points (bottom-left origin).
 * Types: text | draw | rect | highlight | underline | sign
 *   text: {p,x,y,text,size?,color?}
 *   draw: {p,points:[[nx,ny],...],color?,width?}
 *   rect/highlight: {p,x,y,w,h,color?,opacity?}
 *   underline: {p,x,y,w2,color?}
 *   sign: {p,x,y,text,size?,color?}
 */
export async function annotate_pdf(path: string, specJson: string): Promise<string> {
  if (!specJson || !specJson.trim()) throw new Error("No annotations provided");
  let items: any[];
  try { items = JSON.parse(specJson); } catch { throw new Error("Invalid annotation spec JSON"); }
  if (!Array.isArray(items)) throw new Error("Annotation spec must be an array");

  const bytes = await Bun.file(path).arrayBuffer();
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const total = pdf.getPageCount();

  for (const it of items) {
    const p = Number(it.p);
    if (!p || p < 1 || p > total) throw new Error(`Annotation page ${p} out of range`);
    const page: PDFPage = pdf.getPage(p - 1);
    const W = page.getWidth();
    const H = page.getHeight();
    const X = (n: number) => (Number(n) || 0) * W;
    const Y = (n: number) => H - (Number(n) || 0) * H; // flip top->bottom
    const color = hexToRgb(it.color);

    switch (it.type) {
      case "text":
        page.drawText(String(it.text ?? ""), { x: X(it.x), y: Y(it.y), size: it.size || 24, font, color });
        break;
      case "sign":
        page.drawText(String(it.text ?? "✍"), { x: X(it.x), y: Y(it.y), size: it.size || 48, font: fontBold, color });
        break;
      case "draw": {
        const pts = (it.points || []) as number[][];
        for (let i = 0; i < pts.length - 1; i++) {
          page.drawLine({
            start: { x: X(pts[i]![0]), y: Y(pts[i]![1]) },
            end: { x: X(pts[i + 1]![0]), y: Y(pts[i + 1]![1]) },
            thickness: it.width || 3,
            color,
          });
        }
        break;
      }
      case "rect":
      case "highlight":
        page.drawRectangle({ x: X(it.x), y: Y(it.y) - (it.h || 0.05) * H, width: X(it.w), height: (it.h || 0.05) * H, color, opacity: it.opacity ?? 0.4 });
        break;
      case "underline":
        page.drawLine({ start: { x: X(it.x), y: Y(it.y) }, end: { x: X(it.x) + X(it.w2 || it.w || 0.2), y: Y(it.y) }, thickness: it.width || 2, color });
        break;
      default:
        throw new Error(`Unknown annotation type: ${it.type}`);
    }
  }

  const outPath = `${resultsDir}/${crypto.randomUUID()}.pdf`;
  await Bun.write(outPath, await pdf.save());
  return outPath;
}
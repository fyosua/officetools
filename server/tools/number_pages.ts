import { loadConfig } from "../config";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

const POS: Record<string, (w: number, h: number, tw: number, th: number) => [number, number]> = {
  tl: (_w, h, _tw) => [20, h - 30], tm: (w, _h, tw) => [(w - tw) / 2, _h - 30], tr: (w, _h, tw) => [w - tw - 20, _h - 30],
  ml: (_w, h, _tw, th) => [20, (h - th) / 2], mm: (w, h, tw, th) => [(w - tw) / 2, (h - th) / 2], mr: (w, h, tw, th) => [w - tw - 20, (h - th) / 2],
  bl: (_w, _h, _tw) => [20, 20], bm: (w, _h, tw) => [(w - tw) / 2, 20], br: (w, _h, tw) => [w - tw - 20, 20],
};

/**
 * Add sequential page numbers (e.g. "3 / 5") at a chosen position on every page.
 * @param position one of tl/tm/tr/ml/mm/mr/bl/bm/br (top/middle/bottom × left/mid/right)
 */
export async function number_pages(path: string, start: number = 1, position: string = "bm"): Promise<string> {
  const bytes = await Bun.file(path).arrayBuffer();
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const total = pages.length;
  const posFn = POS[position] || POS.bm!;
  pages.forEach((page, i) => {
    const n = start + i;
    const { width, height } = page.getSize();
    const label = `${n} / ${total}`;
    const size = 11;
    const tw = font.widthOfTextAtSize(label, size);
    const th = 12;
    const [x, y] = posFn(width, height, tw, th);
    page.drawText(label, { x, y, size, font, color: rgb(0.2, 0.2, 0.2) });
  });
  const outPath = `${resultsDir}/${crypto.randomUUID()}.pdf`;
  await Bun.write(outPath, await pdf.save());
  return outPath;
}
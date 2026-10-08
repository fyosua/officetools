import { loadConfig } from "../config";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

const PAGE_SIZES: Record<string, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

export interface JpgToPdfOptions {
  margin?: number;        // padding around each image (points)
  orientation?: string;   // auto | portrait | landscape
  size?: string;          // auto | a4 | letter
}

/**
 * Convert one or more images into a single PDF with margin/orientation/size options.
 */
export async function images_to_pdf(paths: string[], opts: JpgToPdfOptions = {}): Promise<string> {
  if (paths.length === 0) throw new Error("At least one image file is required");
  const margin = opts.margin ?? 0;
  const orientation = opts.orientation ?? "auto";
  const sizeKey = opts.size ?? "auto";
  const pdfDoc = await PDFDocument.create();

  for (const imgPath of paths) {
    const buf = await Bun.file(imgPath).arrayBuffer();
    const meta = await sharp(buf).metadata();
    let img;
    if (meta.format === "png") img = await pdfDoc.embedPng(await sharp(buf).png().toBuffer());
    else if (meta.format === "jpeg") img = await pdfDoc.embedJpg(await sharp(buf).jpeg().toBuffer());
    else img = await pdfDoc.embedJpg(await sharp(buf).jpeg({ quality: 92 }).toBuffer());

    let pageW = img.width, pageH = img.height;
    if (sizeKey !== "auto" && PAGE_SIZES[sizeKey]) {
      let [w, h] = PAGE_SIZES[sizeKey]!;
      const imageLandscape = img.width > img.height;
      if (orientation === "landscape" && w < h) [w, h] = [h, w];
      if (orientation === "portrait" && w > h) [w, h] = [h, w];
      if (orientation === "auto" && imageLandscape && w < h) [w, h] = [h, w];
      pageW = w; pageH = h;
    } else if (orientation === "landscape" && pageH > pageW) {
      [pageW, pageH] = [pageH, pageW];
    } else if (orientation === "portrait" && pageW > pageH) {
      [pageW, pageH] = [pageH, pageW];
    }

    const page = pdfDoc.addPage([pageW + margin * 2, pageH + margin * 2]);
    const scale = Math.min(pageW / img.width, pageH / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    page.drawImage(img, {
      x: margin + (pageW - drawW) / 2,
      y: margin + (pageH - drawH) / 2,
      width: drawW,
      height: drawH,
    });
  }

  const outPath = `${resultsDir}/${crypto.randomUUID()}.pdf`;
  await Bun.write(outPath, await pdfDoc.save());
  return outPath;
}
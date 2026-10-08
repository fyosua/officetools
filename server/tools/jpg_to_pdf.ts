import { loadConfig } from "../config";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

const config = loadConfig();
const resultsDir = `${config.processingDir}/results`;

/**
 * Convert one or more images (JPG, PNG, etc.) into a single PDF.
 * @param paths - Array of absolute paths to image files
 * @returns Path of the resulting PDF
 */
export async function images_to_pdf(paths: string[]): Promise<string> {
  if (paths.length === 0) {
    throw new Error("At least one image file is required");
  }

  const pdfDoc = await PDFDocument.create();

  for (const imgPath of paths) {
    const imgBuffer = await Bun.file(imgPath).arrayBuffer();
    const img = sharp(imgBuffer);
    const metadata = await img.metadata();

    let image: { width: number; height: number; embed: () => Promise<any> };

    if (metadata.format === "png") {
      const pngBuffer = await img.png().toBuffer();
      const pngImage = await pdfDoc.embedPng(pngBuffer);
      image = { width: pngImage.width, height: pngImage.height, embed: async () => pngImage };
    } else if (metadata.format === "jpeg") {
      const jpgBuffer = await img.jpeg().toBuffer();
      const jpgImage = await pdfDoc.embedJpg(jpgBuffer);
      image = { width: jpgImage.width, height: jpgImage.height, embed: async () => jpgImage };
    } else {
      // Convert unsupported formats to JPEG first via sharp
      const jpgBuffer = await img.jpeg({ quality: 92 }).toBuffer();
      const jpgImage = await pdfDoc.embedJpg(jpgBuffer);
      image = { width: jpgImage.width, height: jpgImage.height, embed: async () => jpgImage };
    }

    const page = pdfDoc.addPage([image.width, image.height]);
    const embedded = await image.embed();
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const outName = `${crypto.randomUUID()}.pdf`;
  const outPath = `${resultsDir}/${outName}`;
  await Bun.write(outPath, pdfBytes);
  return outPath;
}

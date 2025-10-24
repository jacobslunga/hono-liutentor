import { PDFDocument } from "pdf-lib";

/**
 * Downloads and compresses a PDF from a URL
 * @param url - URL of the PDF to download and compress
 * @returns Base64 encoded compressed PDF
 */
export async function downloadAndCompressPdf(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }

    const pdfBytes = await response.arrayBuffer();

    const pdfDoc = await PDFDocument.load(pdfBytes, {
      ignoreEncryption: true,
    });

    const compressedPdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
    });

    const base64 = Buffer.from(compressedPdfBytes).toString("base64");

    console.log(
      `PDF compression stats: Original: ${(pdfBytes.byteLength / 1024).toFixed(
        2
      )}KB, Compressed: ${(compressedPdfBytes.byteLength / 1024).toFixed(2)}KB`
    );

    return base64;
  } catch (error) {
    console.error("Error compressing PDF:", error);
    throw new Error(
      `Failed to compress PDF from ${url}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Downloads and compresses multiple PDFs in parallel
 * @param urls - Array of PDF URLs to download and compress
 * @returns Array of base64 encoded compressed PDFs
 */
export async function downloadAndCompressPdfs(
  urls: string[]
): Promise<string[]> {
  return Promise.all(urls.map((url) => downloadAndCompressPdf(url)));
}

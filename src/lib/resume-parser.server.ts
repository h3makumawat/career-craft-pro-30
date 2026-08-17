/**
 * Resume text extraction (server-only).
 * DOCX: unzip word/document.xml and recover paragraph text.
 * PDF: handled by the multimodal model directly (see career.functions.ts),
 * but a light text-layer extraction is attempted here first.
 */
import { unzipSync, strFromU8 } from "fflate";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MIN_RESUME_CHARS = 200;

export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.includes(",") ? base64.slice(base64.indexOf(",") + 1) : base64;
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function extractDocxText(bytes: Uint8Array): string {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new Error("This DOCX file could not be opened. It may be corrupted or password protected.");
  }
  const doc = files["word/document.xml"];
  if (!doc) {
    throw new Error("This does not look like a valid Word (.docx) document.");
  }
  const xml = strFromU8(doc);
  return xml
    .replace(/<w:tab[^>]*\/>/g, " ")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:br[^>]*\/>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeText(text: string): string {
  return text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

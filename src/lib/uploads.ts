import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

const uploadDir = resolve(process.cwd(), "data", "uploads", "questions");
const maxImageBytes = 1_000_000;

const allowedTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/gif", ".gif"],
  ["image/webp", ".webp"]
]);

export type UploadResult =
  | { ok: true; path: string | null }
  | { ok: false; message: string };

export type StoredImage = {
  bytes: Buffer;
  contentType: string;
};

function isSafeFilename(filename: string): boolean {
  return /^[a-f0-9-]+\.(jpg|png|gif|webp)$/i.test(filename);
}

function contentTypeFor(filename: string): string | undefined {
  const extension = extname(filename).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }
  if (extension === ".png") {
    return "image/png";
  }
  if (extension === ".gif") {
    return "image/gif";
  }
  if (extension === ".webp") {
    return "image/webp";
  }

  return undefined;
}

function uploadPathForPublicPath(publicPath: string): string | undefined {
  if (!publicPath.startsWith("/uploads/questions/")) {
    return undefined;
  }

  const filename = publicPath.replace("/uploads/questions/", "");
  if (!isSafeFilename(filename)) {
    return undefined;
  }

  return join(uploadDir, filename);
}

function detectMime(bytes: Uint8Array): string | undefined {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return undefined;
}

export async function saveQuestionImage(file: File | null): Promise<UploadResult> {
  if (!file || file.size === 0) {
    return { ok: true, path: null };
  }

  if (file.size > maxImageBytes) {
    return { ok: false, message: "La imagen no puede superar 1 MB." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detectedMime = detectMime(bytes);
  if (!detectedMime || !allowedTypes.has(detectedMime)) {
    return { ok: false, message: "Solo se permiten imagenes JPG, PNG, GIF o WEBP validas." };
  }

  const declaredExtension = extname(file.name).toLowerCase();
  const extension = allowedTypes.get(detectedMime) as string;
  if (declaredExtension && declaredExtension !== extension && !(declaredExtension === ".jpeg" && extension === ".jpg")) {
    return { ok: false, message: "La extension del archivo no coincide con su contenido." };
  }

  await mkdir(uploadDir, { recursive: true });
  const filename = `${randomUUID()}${extension}`;
  await writeFile(join(uploadDir, filename), bytes);

  return { ok: true, path: `/uploads/questions/${filename}` };
}

export async function getStoredQuestionImage(filename: string): Promise<StoredImage | undefined> {
  if (!isSafeFilename(filename)) {
    return undefined;
  }

  const contentType = contentTypeFor(filename);
  if (!contentType) {
    return undefined;
  }

  const filePath = join(uploadDir, filename);
  try {
    await access(filePath);
    return {
      bytes: await readFile(filePath),
      contentType
    };
  } catch {
    return undefined;
  }
}

export async function deleteQuestionImage(publicPath: string | null | undefined): Promise<void> {
  if (!publicPath) {
    return;
  }

  const filePath = uploadPathForPublicPath(publicPath);
  if (!filePath) {
    return;
  }

  try {
    await unlink(filePath);
  } catch {
    // Missing files should not block question updates/deletes.
  }
}

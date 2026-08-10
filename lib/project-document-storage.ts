import { put } from "@vercel/blob";

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "text/plain",
];

/**
 * Shared by the create-project form and the details-page upload dialog via
 * the same API route: enforces file type/size before it ever reaches Blob storage.
 */
export function validateProjectDocumentFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Файл «${file.name}» превышает допустимый размер (20 МБ).`;
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Файл «${file.name}»: недопустимый тип файла.`;
  }
  return null;
}

export async function uploadProjectDocumentFile(projectId: string, file: File) {
  const blob = await put(`projects/${projectId}/${crypto.randomUUID()}-${file.name}`, file, {
    access: "public",
  });
  return blob.url;
}

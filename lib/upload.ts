import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// 上傳目錄路徑（在 public 目錄下）
const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "payments");

// 確保上傳目錄存在
export async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// 生成唯一檔名
export function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const ext = originalName.split(".").pop() || "";
  return `${timestamp}-${random}.${ext}`;
}

// 儲存文件
export async function saveFile(
  file: File,
  description?: string
): Promise<{
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description?: string;
}> {
  await ensureUploadDir();

  const fileName = generateFileName(file.name);
  const filePath = `/uploads/payments/${fileName}`;
  const absolutePath = join(UPLOAD_DIR, fileName);

  // 轉換 File 為 Buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 寫入檔案
  await writeFile(absolutePath, buffer);

  return {
    fileName,
    originalName: file.name,
    filePath,
    fileSize: file.size,
    mimeType: file.type,
    description,
  };
}

// 驗證檔案類型
export function validateFileType(mimeType: string): boolean {
  const allowedTypes = [
    // 圖片
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    // 文件
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  return allowedTypes.includes(mimeType);
}

// 驗證檔案大小（預設 10MB）
export function validateFileSize(size: number, maxSizeMB: number = 10): boolean {
  const maxSize = maxSizeMB * 1024 * 1024; // 轉換為 bytes
  return size <= maxSize;
}

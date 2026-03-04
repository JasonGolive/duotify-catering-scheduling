import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { saveFile, validateFileType, validateFileSize } from "@/lib/upload";

// GET /api/v1/payments-out/[id]/attachments - 取得附件列表
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { id } = await context.params;

    const attachments = await prisma.paymentOutAttachment.findMany({
      where: { paymentId: id },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error("取得附件列表錯誤:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// POST /api/v1/payments-out/[id]/attachments - 上傳附件
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { id: paymentId } = await context.params;

    // 檢查付款記錄是否存在
    const payment = await prisma.paymentOut.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json({ error: "找不到付款記錄" }, { status: 404 });
    }

    // 解析 FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const description = formData.get("description") as string | null;

    if (!file) {
      return NextResponse.json({ error: "未提供檔案" }, { status: 400 });
    }

    // 驗證檔案類型
    if (!validateFileType(file.type)) {
      return NextResponse.json(
        { error: "不支援的檔案類型。僅支援圖片、PDF、Word、Excel" },
        { status: 400 }
      );
    }

    // 驗證檔案大小（10MB）
    if (!validateFileSize(file.size, 10)) {
      return NextResponse.json(
        { error: "檔案過大。最大 10MB" },
        { status: 400 }
      );
    }

    // 儲存檔案
    const fileData = await saveFile(file, description || undefined);

    // 建立附件記錄
    const attachment = await prisma.paymentOutAttachment.create({
      data: {
        paymentId,
        fileName: fileData.fileName,
        originalName: fileData.originalName,
        filePath: fileData.filePath,
        fileSize: fileData.fileSize,
        mimeType: fileData.mimeType,
        description: description || null,
        uploadedBy: userId,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("上傳附件錯誤:", error);
    return NextResponse.json({ error: "上傳失敗" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { unlink } from "fs/promises";
import { join } from "path";

// DELETE /api/v1/payments-out/[id]/attachments/[attachmentId] - 刪除附件
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { attachmentId } = await context.params;

    // 查找附件
    const attachment = await prisma.paymentOutAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return NextResponse.json({ error: "找不到附件" }, { status: 404 });
    }

    // 刪除檔案
    try {
      const filePath = join(process.cwd(), "public", attachment.filePath);
      await unlink(filePath);
    } catch (error) {
      console.error("刪除檔案錯誤:", error);
      // 繼續刪除資料庫記錄，即使檔案刪除失敗
    }

    // 刪除資料庫記錄
    await prisma.paymentOutAttachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({ message: "附件已刪除" });
  } catch (error) {
    console.error("刪除附件錯誤:", error);
    return NextResponse.json({ error: "刪除失敗" }, { status: 500 });
  }
}

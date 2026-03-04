import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// GET /api/v1/payments-out/[id] - 取得單筆付款
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

    const payment = await prisma.paymentOut.findUnique({
      where: { id },
      include: {
        staff: true,
        supplier: true,
        bankAccount: true,
        attachments: {
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "找不到付款記錄" }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("取得付款錯誤:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// DELETE /api/v1/payments-out/[id] - 刪除付款
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { id } = await context.params;

    const payment = await prisma.paymentOut.findUnique({
      where: { id },
    });

    if (!payment) {
      return NextResponse.json({ error: "找不到付款記錄" }, { status: 404 });
    }

    // 如果已付款且有銀行帳戶，需要恢復餘額
    if (payment.status === "PAID" && payment.bankAccountId) {
      await prisma.$transaction([
        prisma.paymentOut.delete({ where: { id } }),
        prisma.bankAccount.update({
          where: { id: payment.bankAccountId },
          data: {
            currentBalance: {
              increment: payment.amount,
            },
          },
        }),
      ]);
    } else {
      await prisma.paymentOut.delete({ where: { id } });
    }

    return NextResponse.json({ message: "付款已刪除" });
  } catch (error) {
    console.error("刪除付款錯誤:", error);
    return NextResponse.json({ error: "刪除失敗" }, { status: 500 });
  }
}

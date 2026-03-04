import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// PATCH /api/v1/payments-out/[id]/cancel - 作廢付款
export async function PATCH(
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

    if (payment.status === "CANCELLED") {
      return NextResponse.json({ error: "此付款已經作廢" }, { status: 400 });
    }

    // 如果已付款且有銀行帳戶，需要恢復餘額
    if (payment.status === "PAID" && payment.bankAccountId && payment.paymentMethod !== "CASH") {
      await prisma.$transaction([
        prisma.paymentOut.update({
          where: { id },
          data: {
            status: "CANCELLED",
          },
        }),
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
      await prisma.paymentOut.update({
        where: { id },
        data: {
          status: "CANCELLED",
        },
      });
    }

    const updated = await prisma.paymentOut.findUnique({
      where: { id },
      include: {
        staff: true,
        supplier: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("作廢付款錯誤:", error);
    return NextResponse.json({ error: "作廢失敗" }, { status: 500 });
  }
}

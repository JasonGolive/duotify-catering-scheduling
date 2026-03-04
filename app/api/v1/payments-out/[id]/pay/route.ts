import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// PATCH /api/v1/payments-out/[id]/pay - 標記為已付款
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

    if (payment.status === "PAID") {
      return NextResponse.json({ error: "此付款已經付款" }, { status: 400 });
    }

    if (payment.status === "CANCELLED") {
      return NextResponse.json({ error: "已作廢的付款無法付款" }, { status: 400 });
    }

    // 如果有銀行帳戶，需要扣除餘額
    if (payment.bankAccountId && payment.paymentMethod !== "CASH") {
      await prisma.$transaction([
        prisma.paymentOut.update({
          where: { id },
          data: {
            status: "PAID",
          },
        }),
        prisma.bankAccount.update({
          where: { id: payment.bankAccountId },
          data: {
            currentBalance: {
              decrement: payment.amount,
            },
          },
        }),
      ]);
    } else {
      await prisma.paymentOut.update({
        where: { id },
        data: {
          status: "PAID",
        },
      });
    }

    const updated = await prisma.paymentOut.findUnique({
      where: { id },
      include: {
        staff: true,
        supplier: true,
        bankAccount: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("標記已付款錯誤:", error);
    return NextResponse.json({ error: "付款失敗" }, { status: 500 });
  }
}

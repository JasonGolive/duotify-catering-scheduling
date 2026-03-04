import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// PATCH /api/v1/payments-in/[id]/cancel - 作廢收款
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

    const existing = await prisma.paymentIn.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "收款記錄不存在" }, { status: 404 });
    }

    if (existing.status === "CANCELLED") {
      return NextResponse.json(
        { error: "此收款記錄已被作廢" },
        { status: 400 }
      );
    }

    // 使用交易處理
    const result = await prisma.$transaction(async (tx) => {
      // 恢復銀行帳戶餘額
      if (existing.bankAccountId && existing.paymentMethod !== "CASH") {
        await tx.bankAccount.update({
          where: { id: existing.bankAccountId },
          data: {
            currentBalance: {
              decrement: existing.amount.toNumber(),
            },
          },
        });
      }

      // 更新狀態為已作廢
      const payment = await tx.paymentIn.update({
        where: { id },
        data: {
          status: "CANCELLED",
        },
        include: {
          event: true,
          bankAccount: true,
        },
      });

      return payment;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("作廢收款錯誤:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

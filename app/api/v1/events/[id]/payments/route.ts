import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// GET /api/v1/events/[id]/payments - 取得場次收款統計與記錄
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

    // 查詢場次收款記錄
    const payments = await prisma.paymentIn.findMany({
      where: {
        eventId: id,
        status: { not: "CANCELLED" },
      },
      orderBy: { paymentDate: "desc" },
      select: {
        id: true,
        paymentNumber: true,
        paymentDate: true,
        amount: true,
        paymentMethod: true,
        paymentCategory: true,
        status: true,
        receiptNumber: true,
        customerName: true,
      },
    });

    // 計算統計
    const depositPayments = payments.filter((p) => p.paymentCategory === "DEPOSIT");
    const finalPayments = payments.filter((p) => p.paymentCategory === "FINAL_PAYMENT");
    const additionalPayments = payments.filter((p) => p.paymentCategory === "ADDITIONAL");

    const depositTotal = depositPayments.reduce(
      (sum, p) => sum + p.amount.toNumber(),
      0
    );
    const finalTotal = finalPayments.reduce(
      (sum, p) => sum + p.amount.toNumber(),
      0
    );
    const additionalTotal = additionalPayments.reduce(
      (sum, p) => sum + p.amount.toNumber(),
      0
    );
    const totalReceived = depositTotal + finalTotal + additionalTotal;

    return NextResponse.json({
      payments,
      stats: {
        depositTotal,
        finalTotal,
        additionalTotal,
        totalReceived,
        depositCount: depositPayments.length,
        finalCount: finalPayments.length,
        additionalCount: additionalPayments.length,
        totalCount: payments.length,
      },
    });
  } catch (error) {
    console.error("取得場次收款錯誤:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// PATCH /api/v1/payments-out/[id]/approve - 審核付款
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

    if (payment.status !== "PENDING") {
      return NextResponse.json(
        { error: "只能審核待審核的付款" },
        { status: 400 }
      );
    }

    const updated = await prisma.paymentOut.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedBy: userId,
        approvedAt: new Date(),
      },
      include: {
        staff: true,
        supplier: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("審核付款錯誤:", error);
    return NextResponse.json({ error: "審核失敗" }, { status: 500 });
  }
}

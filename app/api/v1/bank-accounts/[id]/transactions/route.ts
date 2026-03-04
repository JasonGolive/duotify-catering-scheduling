import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/bank-accounts/[id]/transactions - 取得帳戶交易明細
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 檢查帳戶是否存在
    const account = await prisma.bankAccount.findUnique({
      where: { id },
    });

    if (!account) {
      return NextResponse.json({ error: "銀行帳戶不存在" }, { status: 404 });
    }

    // 建立日期篩選條件
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // 取得收款記錄
    const paymentsIn = await prisma.paymentIn.findMany({
      where: {
        bankAccountId: id,
        ...(startDate || endDate ? { paymentDate: dateFilter } : {}),
      },
      select: {
        id: true,
        paymentNumber: true,
        paymentDate: true,
        amount: true,
        paymentMethod: true,
        paymentCategory: true,
        customerName: true,
        status: true,
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    // 取得付款記錄
    const paymentsOut = await prisma.paymentOut.findMany({
      where: {
        bankAccountId: id,
        status: "PAID", // 只顯示已付款的記錄
        ...(startDate || endDate ? { paymentDate: dateFilter } : {}),
      },
      select: {
        id: true,
        paymentNumber: true,
        paymentDate: true,
        amount: true,
        paymentMethod: true,
        paymentCategory: true,
        payeeType: true,
        payeeName: true,
        status: true,
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    // 合併並排序交易記錄
    const transactions = [
      ...paymentsIn.map((p) => ({
        id: p.id,
        transactionNumber: p.paymentNumber,
        date: p.paymentDate,
        type: "IN" as const,
        amount: p.amount,
        method: p.paymentMethod,
        category: p.paymentCategory,
        description: p.event
          ? `${p.customerName} - ${p.event.name}`
          : p.customerName,
        status: p.status,
        relatedId: p.event?.id,
        relatedType: "event" as const,
      })),
      ...paymentsOut.map((p) => ({
        id: p.id,
        transactionNumber: p.paymentNumber,
        date: p.paymentDate,
        type: "OUT" as const,
        amount: p.amount,
        method: p.paymentMethod,
        category: p.paymentCategory,
        description:
          p.staff?.name || p.supplier?.name || p.payeeName || "其他支出",
        status: p.status,
        relatedId: p.staff?.id || p.supplier?.id,
        relatedType: (p.staff ? "staff" : p.supplier ? "supplier" : "other") as "staff" | "supplier" | "other",
      })),
    ].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({
      account: {
        id: account.id,
        accountName: account.accountName,
        currentBalance: account.currentBalance,
      },
      transactions,
      summary: {
        totalIn: paymentsIn
          .filter((p) => p.status !== "CANCELLED")
          .reduce((sum, p) => sum + p.amount.toNumber(), 0),
        totalOut: paymentsOut.reduce(
          (sum, p) => sum + p.amount.toNumber(),
          0
        ),
        count: transactions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "無法取得交易明細" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// 生成收款單號 PI-YYYYMMDD-XXX
async function generatePaymentNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  
  const lastPayment = await prisma.paymentIn.findFirst({
    where: {
      paymentNumber: {
        startsWith: `PI-${dateStr}`,
      },
    },
    orderBy: { paymentNumber: "desc" },
  });

  let sequence = 1;
  if (lastPayment) {
    const lastSeq = parseInt(lastPayment.paymentNumber.split("-")[2]);
    sequence = lastSeq + 1;
  }

  return `PI-${dateStr}-${sequence.toString().padStart(3, "0")}`;
}

// GET /api/v1/payments-in - 取得收款列表
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const paymentMethod = searchParams.get("paymentMethod");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    const where: any = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (category && category !== "all") {
      where.paymentCategory = category;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (paymentMethod && paymentMethod !== "all") {
      where.paymentMethod = paymentMethod;
    }

    if (startDate && endDate) {
      where.paymentDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { receiptNumber: { contains: search, mode: "insensitive" } },
        { transactionReference: { contains: search, mode: "insensitive" } },
      ];
    }

    const payments = await prisma.paymentIn.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
          },
        },
        bankAccount: {
          select: {
            id: true,
            accountName: true,
          },
        },
      },
    });

    // 計算統計
    const stats = await prisma.paymentIn.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      payments,
      total: payments.length,
      stats: {
        totalAmount: stats._sum.amount?.toNumber() || 0,
        totalCount: stats._count,
      },
    });
  } catch (error) {
    console.error("取得收款列表錯誤:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// POST /api/v1/payments-in - 新增收款
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    // 取得當前使用者
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "找不到使用者" }, { status: 404 });
    }

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      eventId,
      paymentDate,
      amount,
      paymentMethod,
      bankAccountId,
      checkNumber,
      transactionReference,
      paymentCategory,
      notes,
      receiptNumber,
    } = body;

    if (!customerName || !paymentDate || !amount || !paymentMethod || !paymentCategory) {
      return NextResponse.json(
        { error: "客戶名稱、收款日期、金額、付款方式和類別為必填" },
        { status: 400 }
      );
    }

    // 生成收款單號
    const paymentNumber = await generatePaymentNumber();

    // 使用交易確保資料一致性
    const result = await prisma.$transaction(async (tx) => {
      // 建立收款記錄
      const payment = await tx.paymentIn.create({
        data: {
          paymentNumber,
          customerName,
          customerPhone: customerPhone || null,
          eventId: eventId || null,
          paymentDate: new Date(paymentDate),
          amount: parseFloat(amount),
          paymentMethod,
          bankAccountId: bankAccountId || null,
          checkNumber,
          transactionReference,
          paymentCategory,
          notes,
          receiptNumber,
          status: "CONFIRMED",
          createdBy: currentUser.id,
        },
        include: {
          event: true,
          bankAccount: true,
        },
      });

      // 如果有指定銀行帳戶且付款方式需要帳戶，更新餘額
      if (bankAccountId && paymentMethod !== "CASH") {
        await tx.bankAccount.update({
          where: { id: bankAccountId },
          data: {
            currentBalance: {
              increment: parseFloat(amount),
            },
          },
        });
      }

      return payment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("新增收款錯誤:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

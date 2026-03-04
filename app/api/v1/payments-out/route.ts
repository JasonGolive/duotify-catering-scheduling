import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// 自動生成付款單號 PO-YYYYMMDD-XXX
async function generatePaymentNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
  const prefix = `PO-${dateStr}-`;

  const lastPayment = await prisma.paymentOut.findFirst({
    where: {
      paymentNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      paymentNumber: "desc",
    },
  });

  let sequence = 1;
  if (lastPayment) {
    const lastSeq = parseInt(lastPayment.paymentNumber.split("-")[2]);
    sequence = lastSeq + 1;
  }

  return `${prefix}${sequence.toString().padStart(3, "0")}`;
}

// GET /api/v1/payments-out - 取得付款列表
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const payeeType = searchParams.get("payeeType");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // 構建查詢條件
    const where: Prisma.PaymentOutWhereInput = {};

    if (category) where.paymentCategory = category as any;
    if (status) where.status = status as any;
    if (payeeType) where.payeeType = payeeType as any;
    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: "insensitive" } },
        { payeeName: { contains: search, mode: "insensitive" } },
        { invoiceNumber: { contains: search, mode: "insensitive" } },
      ];
    }
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }

    const [payments, total] = await Promise.all([
      prisma.paymentOut.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: "desc" },
        include: {
          staff: {
            select: {
              name: true,
            },
          },
          supplier: {
            select: {
              name: true,
            },
          },
          bankAccount: {
            select: {
              accountName: true,
            },
          },
        },
      }),
      prisma.paymentOut.count({ where }),
    ]);

    // 計算統計
    const stats = await prisma.paymentOut.aggregate({
      where: { ...where, status: { not: "CANCELLED" } },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalAmount: stats._sum.amount?.toNumber() || 0,
        totalCount: stats._count,
      },
    });
  } catch (error) {
    console.error("取得付款列表錯誤:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// POST /api/v1/payments-out - 新增付款
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const body = await request.json();
    const {
      paymentDate,
      amount,
      paymentMethod,
      bankAccountId,
      checkNumber,
      transactionReference,
      paymentCategory,
      payeeType,
      staffId,
      supplierId,
      payeeName,
      invoiceNumber,
      notes,
    } = body;

    // 驗證必填欄位
    if (!paymentDate || !amount || !paymentMethod || !paymentCategory || !payeeType) {
      return NextResponse.json({ error: "缺少必填欄位" }, { status: 400 });
    }

    // 驗證收款對象
    if (payeeType === "STAFF" && !staffId) {
      return NextResponse.json({ error: "請選擇員工" }, { status: 400 });
    }
    if (payeeType === "SUPPLIER" && !supplierId) {
      return NextResponse.json({ error: "請選擇供應商" }, { status: 400 });
    }
    if (payeeType === "OTHER" && !payeeName) {
      return NextResponse.json({ error: "請輸入收款對象名稱" }, { status: 400 });
    }

    // 生成付款單號
    const paymentNumber = await generatePaymentNumber();

    // 建立付款記錄
    const payment = await prisma.paymentOut.create({
      data: {
        paymentNumber,
        paymentDate: new Date(paymentDate),
        amount: new Prisma.Decimal(amount),
        paymentMethod,
        bankAccountId: bankAccountId || null,
        checkNumber: checkNumber || null,
        transactionReference: transactionReference || null,
        paymentCategory,
        payeeType,
        staffId: staffId || null,
        supplierId: supplierId || null,
        payeeName: payeeName || null,
        invoiceNumber: invoiceNumber || null,
        notes: notes || null,
        status: "PENDING",
        createdBy: userId,
      },
      include: {
        staff: true,
        supplier: true,
        bankAccount: true,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("新增付款錯誤:", error);
    return NextResponse.json({ error: "新增失敗" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

// GET /api/v1/bank-accounts - 取得銀行帳戶列表
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const accounts = await prisma.bankAccount.findMany({
      orderBy: [
        { status: "asc" }, // ACTIVE first
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return NextResponse.json(
      { error: "無法取得銀行帳戶列表" },
      { status: 500 }
    );
  }
}

// POST /api/v1/bank-accounts - 新增銀行帳戶
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const body = await request.json();
    const {
      accountName,
      bankName,
      accountNumber,
      accountType,
      currency,
      initialBalance,
      notes,
    } = body;

    // 驗證必填欄位
    if (!accountName) {
      return NextResponse.json(
        { error: "帳戶名稱為必填" },
        { status: 400 }
      );
    }

    const account = await prisma.bankAccount.create({
      data: {
        accountName,
        bankName,
        accountNumber,
        accountType: accountType || "CHECKING",
        currency: currency || "TWD",
        initialBalance: initialBalance || 0,
        currentBalance: initialBalance || 0, // 初始餘額 = 當前餘額
        notes,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("Error creating bank account:", error);
    return NextResponse.json(
      { error: "無法建立銀行帳戶" },
      { status: 500 }
    );
  }
}

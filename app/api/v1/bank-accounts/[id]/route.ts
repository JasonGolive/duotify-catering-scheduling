import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/bank-accounts/[id] - 取得單一銀行帳戶
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { id } = await params;

    const account = await prisma.bankAccount.findUnique({
      where: { id },
    });

    if (!account) {
      return NextResponse.json({ error: "銀行帳戶不存在" }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error fetching bank account:", error);
    return NextResponse.json(
      { error: "無法取得銀行帳戶" },
      { status: 500 }
    );
  }
}

// PUT /api/v1/bank-accounts/[id] - 更新銀行帳戶
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      accountName,
      bankName,
      accountNumber,
      accountType,
      currency,
      initialBalance,
      status,
      notes,
    } = body;

    // 檢查帳戶是否存在
    const existing = await prisma.bankAccount.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "銀行帳戶不存在" }, { status: 404 });
    }

    // 如果修改期初餘額，需要調整當前餘額
    let currentBalance: number | undefined = undefined;
    if (
      initialBalance !== undefined &&
      initialBalance !== existing.initialBalance.toNumber()
    ) {
      const difference = initialBalance - existing.initialBalance.toNumber();
      currentBalance = existing.currentBalance.toNumber() + difference;
    }

    const account = await prisma.bankAccount.update({
      where: { id },
      data: {
        accountName,
        bankName,
        accountNumber,
        accountType,
        currency,
        initialBalance,
        currentBalance,
        status,
        notes,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error updating bank account:", error);
    return NextResponse.json(
      { error: "無法更新銀行帳戶" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/bank-accounts/[id] - 刪除銀行帳戶
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { id } = await params;

    // 檢查是否有關聯的收付款記錄
    const paymentsInCount = await prisma.paymentIn.count({
      where: { bankAccountId: id },
    });

    const paymentsOutCount = await prisma.paymentOut.count({
      where: { bankAccountId: id },
    });

    if (paymentsInCount > 0 || paymentsOutCount > 0) {
      return NextResponse.json(
        {
          error: "此帳戶有關聯的收付款記錄，無法刪除。請改為停用帳戶。",
        },
        { status: 400 }
      );
    }

    await prisma.bankAccount.delete({
      where: { id },
    });

    return NextResponse.json({ message: "銀行帳戶已刪除" });
  } catch (error) {
    console.error("Error deleting bank account:", error);
    return NextResponse.json(
      { error: "無法刪除銀行帳戶" },
      { status: 500 }
    );
  }
}

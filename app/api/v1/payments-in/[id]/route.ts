import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// GET /api/v1/payments-in/[id] - 取得單筆收款
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

    const payment = await prisma.paymentIn.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            venue: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        bankAccount: {
          select: {
            id: true,
            accountName: true,
            bankName: true,
            accountNumber: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "收款記錄不存在" }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("取得收款記錄錯誤:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// PUT /api/v1/payments-in/[id] - 更新收款
export async function PUT(
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
      include: { bankAccount: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "收款記錄不存在" }, { status: 404 });
    }

    if (existing.status === "CANCELLED") {
      return NextResponse.json(
        { error: "已作廢的收款記錄無法修改" },
        { status: 400 }
      );
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

    // 使用交易處理餘額更新
    const result = await prisma.$transaction(async (tx) => {
      // 如果金額或銀行帳戶改變，需要調整餘額
      if (
        (amount !== undefined && parseFloat(amount) !== existing.amount.toNumber()) ||
        (bankAccountId !== undefined && bankAccountId !== existing.bankAccountId)
      ) {
        // 恢復舊帳戶餘額
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

        // 更新新帳戶餘額
        const newBankAccountId = bankAccountId !== undefined ? bankAccountId : existing.bankAccountId;
        const newAmount = amount !== undefined ? parseFloat(amount) : existing.amount.toNumber();
        const newPaymentMethod = paymentMethod !== undefined ? paymentMethod : existing.paymentMethod;

        if (newBankAccountId && newPaymentMethod !== "CASH") {
          await tx.bankAccount.update({
            where: { id: newBankAccountId },
            data: {
              currentBalance: {
                increment: newAmount,
              },
            },
          });
        }
      }

      // 更新收款記錄
      const payment = await tx.paymentIn.update({
        where: { id },
        data: {
          ...(customerName !== undefined && { customerName }),
          ...(customerPhone !== undefined && { customerPhone }),
          ...(eventId !== undefined && { eventId }),
          ...(paymentDate !== undefined && { paymentDate: new Date(paymentDate) }),
          ...(amount !== undefined && { amount: parseFloat(amount) }),
          ...(paymentMethod !== undefined && { paymentMethod }),
          ...(bankAccountId !== undefined && { bankAccountId }),
          ...(checkNumber !== undefined && { checkNumber }),
          ...(transactionReference !== undefined && { transactionReference }),
          ...(paymentCategory !== undefined && { paymentCategory }),
          ...(notes !== undefined && { notes }),
          ...(receiptNumber !== undefined && { receiptNumber }),
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
    console.error("更新收款錯誤:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// DELETE /api/v1/payments-in/[id] - 刪除收款
export async function DELETE(
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

    // 使用交易處理
    await prisma.$transaction(async (tx) => {
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

      // 刪除收款記錄
      await tx.paymentIn.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: "收款記錄已刪除" });
  } catch (error) {
    console.error("刪除收款錯誤:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

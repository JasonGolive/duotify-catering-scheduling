import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// GET /api/v1/suppliers/[id] - 取得單一供應商
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

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: { paymentDate: "desc" },
          take: 20,
          select: {
            id: true,
            paymentNumber: true,
            paymentDate: true,
            amount: true,
            paymentMethod: true,
            paymentCategory: true,
            status: true,
            invoiceNumber: true,
            notes: true,
          },
        },
        _count: {
          select: { payments: true },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: "供應商不存在" }, { status: 404 });
    }

    // 計算付款統計
    const paymentStats = await prisma.paymentOut.aggregate({
      where: {
        supplierId: id,
        status: "PAID",
      },
      _sum: {
        amount: true,
      },
    });

    const pendingPayments = await prisma.paymentOut.aggregate({
      where: {
        supplierId: id,
        status: { in: ["PENDING", "APPROVED"] },
      },
      _sum: {
        amount: true,
      },
    });

    return NextResponse.json({
      supplier,
      stats: {
        totalPaid: paymentStats._sum.amount?.toNumber() || 0,
        totalPending: pendingPayments._sum.amount?.toNumber() || 0,
        paymentCount: supplier._count.payments,
      },
    });
  } catch (error) {
    console.error("取得供應商錯誤:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// PUT /api/v1/suppliers/[id] - 更新供應商
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

    const existing = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "供應商不存在" }, { status: 404 });
    }

    const body = await request.json();
    const {
      supplierCode,
      name,
      category,
      contactPerson,
      phone,
      email,
      address,
      taxId,
      paymentTerms,
      notes,
      status,
    } = body;

    // 如果更改供應商編號，檢查是否重複
    if (supplierCode && supplierCode !== existing.supplierCode) {
      const duplicate = await prisma.supplier.findUnique({
        where: { supplierCode },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "供應商編號已存在" },
          { status: 400 }
        );
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(supplierCode !== undefined && { supplierCode }),
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(taxId !== undefined && { taxId }),
        ...(paymentTerms !== undefined && { paymentTerms }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("更新供應商錯誤:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// DELETE /api/v1/suppliers/[id] - 刪除供應商
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

    const existing = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { payments: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "供應商不存在" }, { status: 404 });
    }

    // 檢查是否有付款記錄
    if (existing._count.payments > 0) {
      return NextResponse.json(
        { error: "此供應商有付款記錄，無法刪除。請改為停用。" },
        { status: 400 }
      );
    }

    await prisma.supplier.delete({
      where: { id },
    });

    return NextResponse.json({ message: "供應商已刪除" });
  } catch (error) {
    console.error("刪除供應商錯誤:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

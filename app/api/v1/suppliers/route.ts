import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// GET /api/v1/suppliers - 取得供應商列表
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    
    if (category && category !== "all") {
      where.category = category;
    }
    
    if (status && status !== "all") {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { supplierCode: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { payments: true },
        },
      },
    });

    return NextResponse.json({
      suppliers,
      total: suppliers.length,
    });
  } catch (error) {
    console.error("取得供應商列表錯誤:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// POST /api/v1/suppliers - 新增供應商
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
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
    } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: "供應商名稱和類別為必填" },
        { status: 400 }
      );
    }

    // 檢查供應商編號是否重複
    if (supplierCode) {
      const existing = await prisma.supplier.findUnique({
        where: { supplierCode },
      });
      if (existing) {
        return NextResponse.json(
          { error: "供應商編號已存在" },
          { status: 400 }
        );
      }
    }

    const supplier = await prisma.supplier.create({
      data: {
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
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("新增供應商錯誤:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrAbove } from "@/lib/auth";

/**
 * GET /api/v1/menu/items
 * 取得品項列表
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminOrAbove();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (category) {
      where.category = category;
    }

    if (isActive !== null && isActive !== "") {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const items = await prisma.menuItem.findMany({
      where,
      include: {
        bomItems: true,
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching menu items:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "取得品項失敗" }, { status: 500 });
  }
}

/**
 * POST /api/v1/menu/items
 * 新增品項
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminOrAbove();

    const body = await request.json();
    const {
      name,
      category,
      unit,
      defaultQuantityPerPerson = 1,
      description,
      bomItems = [],
    } = body as {
      name: string;
      category: string;
      unit: string;
      defaultQuantityPerPerson?: number;
      description?: string;
      bomItems?: Array<{
        ingredientName: string;
        quantity: number;
        unit: string;
        notes?: string;
      }>;
    };

    if (!name || !category || !unit) {
      return NextResponse.json(
        { error: "name, category, unit 為必填" },
        { status: 400 }
      );
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        category: category as any,
        unit,
        defaultQuantityPerPerson,
        description,
        bomItems: {
          create: bomItems.map((bom) => ({
            ingredientName: bom.ingredientName,
            quantity: bom.quantity,
            unit: bom.unit,
            notes: bom.notes,
          })),
        },
      },
      include: {
        bomItems: true,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Error creating menu item:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "新增品項失敗" }, { status: 500 });
  }
}

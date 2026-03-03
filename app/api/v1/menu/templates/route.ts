import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrAbove } from "@/lib/auth";

/**
 * GET /api/v1/menu/templates
 * 取得範本列表
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminOrAbove();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }

    if (isActive !== null && isActive !== "") {
      where.isActive = isActive === "true";
    }

    const templates = await prisma.menuTemplate.findMany({
      where,
      include: {
        items: {
          include: {
            menuItem: true,
          },
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { eventMenus: true },
        },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "取得範本失敗" }, { status: 500 });
  }
}

/**
 * POST /api/v1/menu/templates
 * 新增範本
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminOrAbove();

    const body = await request.json();
    const {
      name,
      type,
      description,
      items = [],
    } = body as {
      name: string;
      type: string;
      description?: string;
      items?: Array<{
        menuItemId: string;
        quantity?: number;
        sortOrder?: number;
        notes?: string;
      }>;
    };

    if (!name || !type) {
      return NextResponse.json(
        { error: "name, type 為必填" },
        { status: 400 }
      );
    }

    const template = await prisma.menuTemplate.create({
      data: {
        name,
        type: type as any,
        description,
        items: {
          create: items.map((item, index) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity ?? 1,
            sortOrder: item.sortOrder ?? index,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "新增範本失敗" }, { status: 500 });
  }
}

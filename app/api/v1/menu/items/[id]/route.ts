import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrAbove } from "@/lib/auth";

/**
 * GET /api/v1/menu/items/[id]
 * 取得單一品項
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrAbove();

    const { id } = await params;

    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        bomItems: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: "找不到品項" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error fetching menu item:", error);

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
 * PUT /api/v1/menu/items/[id]
 * 更新品項
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrAbove();

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      category,
      unit,
      defaultQuantityPerPerson,
      description,
      isActive,
      bomItems,
    } = body as {
      name?: string;
      category?: string;
      unit?: string;
      defaultQuantityPerPerson?: number;
      description?: string;
      isActive?: boolean;
      bomItems?: Array<{
        id?: string;
        ingredientName: string;
        quantity: number;
        unit: string;
        notes?: string;
      }>;
    };

    // 檢查品項是否存在
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "找不到品項" }, { status: 404 });
    }

    // 更新品項與 BOM
    const item = await prisma.$transaction(async (tx) => {
      // 更新品項基本資料
      const updated = await tx.menuItem.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(category && { category: category as any }),
          ...(unit && { unit }),
          ...(defaultQuantityPerPerson !== undefined && { defaultQuantityPerPerson }),
          ...(description !== undefined && { description }),
          ...(isActive !== undefined && { isActive }),
        },
      });

      // 如果有提供 bomItems，重建 BOM
      if (bomItems !== undefined) {
        // 刪除舊的 BOM
        await tx.bOMItem.deleteMany({ where: { menuItemId: id } });

        // 建立新的 BOM
        if (bomItems.length > 0) {
          await tx.bOMItem.createMany({
            data: bomItems.map((bom) => ({
              menuItemId: id,
              ingredientName: bom.ingredientName,
              quantity: bom.quantity,
              unit: bom.unit,
              notes: bom.notes,
            })),
          });
        }
      }

      return updated;
    });

    // 重新取得完整資料
    const result = await prisma.menuItem.findUnique({
      where: { id },
      include: { bomItems: true },
    });

    return NextResponse.json({ item: result });
  } catch (error) {
    console.error("Error updating menu item:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "更新品項失敗" }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/menu/items/[id]
 * 刪除品項
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrAbove();

    const { id } = await params;

    // 檢查品項是否存在
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "找不到品項" }, { status: 404 });
    }

    // 檢查是否有範本使用此品項
    const templateUsage = await prisma.menuTemplateItem.count({
      where: { menuItemId: id },
    });

    if (templateUsage > 0) {
      // 改為停用而非刪除
      await prisma.menuItem.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "品項已被範本使用，已改為停用",
        deactivated: true,
      });
    }

    await prisma.menuItem.delete({ where: { id } });

    return NextResponse.json({ message: "品項已刪除" });
  } catch (error) {
    console.error("Error deleting menu item:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "刪除品項失敗" }, { status: 500 });
  }
}

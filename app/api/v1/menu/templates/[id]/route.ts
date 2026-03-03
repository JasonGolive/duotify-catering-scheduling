import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrAbove } from "@/lib/auth";

/**
 * GET /api/v1/menu/templates/[id]
 * 取得單一範本
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrAbove();

    const { id } = await params;

    const template = await prisma.menuTemplate.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                bomItems: true,
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { eventMenus: true },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "找不到範本" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error fetching template:", error);

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
 * PUT /api/v1/menu/templates/[id]
 * 更新範本
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
      type,
      description,
      isActive,
      items,
      incrementVersion = false,
    } = body as {
      name?: string;
      type?: string;
      description?: string;
      isActive?: boolean;
      items?: Array<{
        menuItemId: string;
        quantity?: number;
        sortOrder?: number;
        notes?: string;
      }>;
      incrementVersion?: boolean;
    };

    // 檢查範本是否存在
    const existing = await prisma.menuTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "找不到範本" }, { status: 404 });
    }

    // 更新範本
    const template = await prisma.$transaction(async (tx) => {
      // 更新基本資料
      const updated = await tx.menuTemplate.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(type && { type: type as any }),
          ...(description !== undefined && { description }),
          ...(isActive !== undefined && { isActive }),
          ...(incrementVersion && { version: existing.version + 1 }),
        },
      });

      // 如果有提供 items，重建品項清單
      if (items !== undefined) {
        // 刪除舊品項
        await tx.menuTemplateItem.deleteMany({ where: { templateId: id } });

        // 建立新品項
        if (items.length > 0) {
          await tx.menuTemplateItem.createMany({
            data: items.map((item, index) => ({
              templateId: id,
              menuItemId: item.menuItemId,
              quantity: item.quantity ?? 1,
              sortOrder: item.sortOrder ?? index,
              notes: item.notes,
            })),
          });
        }
      }

      return updated;
    });

    // 重新取得完整資料
    const result = await prisma.menuTemplate.findUnique({
      where: { id },
      include: {
        items: {
          include: { menuItem: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ template: result });
  } catch (error) {
    console.error("Error updating template:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "更新範本失敗" }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/menu/templates/[id]
 * 刪除範本
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrAbove();

    const { id } = await params;

    // 檢查範本是否存在
    const existing = await prisma.menuTemplate.findUnique({
      where: { id },
      include: {
        _count: { select: { eventMenus: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "找不到範本" }, { status: 404 });
    }

    // 如果有場次使用，改為停用
    if (existing._count.eventMenus > 0) {
      await prisma.menuTemplate.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "範本已被場次使用，已改為停用",
        deactivated: true,
      });
    }

    await prisma.menuTemplate.delete({ where: { id } });

    return NextResponse.json({ message: "範本已刪除" });
  } catch (error) {
    console.error("Error deleting template:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "刪除範本失敗" }, { status: 500 });
  }
}

/**
 * POST /api/v1/menu/templates/[id] (with action=duplicate)
 * 複製範本
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrAbove();

    const { id } = await params;
    const body = await request.json();
    const { name } = body as { name?: string };

    // 取得原範本
    const original = await prisma.menuTemplate.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!original) {
      return NextResponse.json({ error: "找不到範本" }, { status: 404 });
    }

    // 複製範本
    const duplicated = await prisma.menuTemplate.create({
      data: {
        name: name || `${original.name} (複製)`,
        type: original.type,
        description: original.description,
        version: 1,
        items: {
          create: original.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            sortOrder: item.sortOrder,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: {
          include: { menuItem: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ template: duplicated }, { status: 201 });
  } catch (error) {
    console.error("Error duplicating template:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "複製範本失敗" }, { status: 500 });
  }
}

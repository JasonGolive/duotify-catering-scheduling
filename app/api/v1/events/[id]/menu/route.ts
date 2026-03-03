import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrAbove } from "@/lib/auth";

/**
 * GET /api/v1/events/[id]/menu
 * 取得場次菜單
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrAbove();

    const { id: eventId } = await params;

    // 檢查場次是否存在
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, adultsCount: true, childrenCount: true },
    });

    if (!event) {
      return NextResponse.json({ error: "找不到場次" }, { status: 404 });
    }

    // 取得場次菜單
    const eventMenu = await prisma.eventMenu.findUnique({
      where: { eventId },
      include: {
        template: true,
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({
      event,
      eventMenu,
      totalGuests: (event.adultsCount || 0) + (event.childrenCount || 0),
    });
  } catch (error) {
    console.error("Error fetching event menu:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "取得場次菜單失敗" }, { status: 500 });
  }
}

/**
 * POST /api/v1/events/[id]/menu
 * 從範本建立場次菜單
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrAbove();

    const { id: eventId } = await params;
    const body = await request.json();
    const { templateId } = body as { templateId: string };

    // 檢查場次是否存在
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, adultsCount: true, childrenCount: true },
    });

    if (!event) {
      return NextResponse.json({ error: "找不到場次" }, { status: 404 });
    }

    // 檢查是否已有場次菜單
    const existingMenu = await prisma.eventMenu.findUnique({
      where: { eventId },
    });

    if (existingMenu) {
      return NextResponse.json(
        { error: "場次已有菜單，請使用 PUT 更新" },
        { status: 400 }
      );
    }

    // 取得範本
    const template = await prisma.menuTemplate.findUnique({
      where: { id: templateId },
      include: {
        items: {
          include: {
            menuItem: {
              include: { bomItems: true },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "找不到範本" }, { status: 404 });
    }

    const totalGuests = (event.adultsCount || 0) + (event.childrenCount || 0);

    // 建立場次菜單（從範本展開）
    const eventMenu = await prisma.eventMenu.create({
      data: {
        eventId,
        templateId,
        templateVersion: template.version,
        templateName: template.name,
        items: {
          create: template.items.map((templateItem) => ({
            menuItemId: templateItem.menuItemId,
            itemName: templateItem.menuItem.name,
            itemCategory: templateItem.menuItem.category,
            itemUnit: templateItem.menuItem.unit,
            quantityPerPerson: templateItem.quantity,
            totalQuantity: Number(templateItem.quantity) * totalGuests,
            bomSnapshot: templateItem.menuItem.bomItems.map((bom) => ({
              ingredientName: bom.ingredientName,
              quantity: Number(bom.quantity),
              unit: bom.unit,
            })),
            sortOrder: templateItem.sortOrder,
            notes: templateItem.notes,
          })),
        },
      },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ eventMenu }, { status: 201 });
  } catch (error) {
    console.error("Error creating event menu:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "建立場次菜單失敗" }, { status: 500 });
  }
}

/**
 * PUT /api/v1/events/[id]/menu
 * 更新場次菜單（微調品項）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrAbove();

    const { id: eventId } = await params;
    const body = await request.json();
    const { items, notes } = body as {
      items?: Array<{
        id?: string;
        menuItemId?: string;
        itemName: string;
        itemCategory: string;
        itemUnit: string;
        quantityPerPerson: number;
        totalQuantity: number;
        bomSnapshot?: Array<{ ingredientName: string; quantity: number; unit: string }>;
        sortOrder?: number;
        notes?: string;
      }>;
      notes?: string;
    };

    // 取得場次菜單
    const eventMenu = await prisma.eventMenu.findUnique({
      where: { eventId },
    });

    if (!eventMenu) {
      return NextResponse.json({ error: "找不到場次菜單" }, { status: 404 });
    }

    // 檢查是否已鎖定
    if (eventMenu.lockedAt) {
      return NextResponse.json(
        { error: "場次菜單已鎖定，無法修改" },
        { status: 400 }
      );
    }

    // 更新菜單
    const updated = await prisma.$transaction(async (tx) => {
      // 更新基本資料
      await tx.eventMenu.update({
        where: { id: eventMenu.id },
        data: {
          ...(notes !== undefined && { notes }),
        },
      });

      // 如果有提供 items，重建品項清單
      if (items !== undefined) {
        // 刪除舊品項
        await tx.eventMenuItem.deleteMany({ where: { eventMenuId: eventMenu.id } });

        // 建立新品項
        if (items.length > 0) {
          await tx.eventMenuItem.createMany({
            data: items.map((item, index) => ({
              eventMenuId: eventMenu.id,
              menuItemId: item.menuItemId,
              itemName: item.itemName,
              itemCategory: item.itemCategory,
              itemUnit: item.itemUnit,
              quantityPerPerson: item.quantityPerPerson,
              totalQuantity: item.totalQuantity,
              bomSnapshot: item.bomSnapshot,
              sortOrder: item.sortOrder ?? index,
              notes: item.notes,
            })),
          });
        }
      }

      return tx.eventMenu.findUnique({
        where: { id: eventMenu.id },
        include: {
          items: { orderBy: { sortOrder: "asc" } },
        },
      });
    });

    return NextResponse.json({ eventMenu: updated });
  } catch (error) {
    console.error("Error updating event menu:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "更新場次菜單失敗" }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/events/[id]/menu
 * 鎖定場次菜單（歷史凍結）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrAbove();

    const { id: eventId } = await params;
    const body = await request.json();
    const { action, lockedBy } = body as { action: string; lockedBy?: string };

    if (action !== "lock") {
      return NextResponse.json({ error: "不支援的操作" }, { status: 400 });
    }

    // 取得場次菜單
    const eventMenu = await prisma.eventMenu.findUnique({
      where: { eventId },
    });

    if (!eventMenu) {
      return NextResponse.json({ error: "找不到場次菜單" }, { status: 404 });
    }

    if (eventMenu.lockedAt) {
      return NextResponse.json(
        { error: "場次菜單已鎖定" },
        { status: 400 }
      );
    }

    // 鎖定菜單
    const locked = await prisma.eventMenu.update({
      where: { id: eventMenu.id },
      data: {
        lockedAt: new Date(),
        lockedBy: lockedBy || "SYSTEM",
      },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json({
      message: "場次菜單已鎖定",
      eventMenu: locked,
    });
  } catch (error) {
    console.error("Error locking event menu:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "鎖定場次菜單失敗" }, { status: 500 });
  }
}

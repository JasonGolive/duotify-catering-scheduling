import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrAbove } from "@/lib/auth";

interface BOMAggregate {
  ingredientName: string;
  unit: string;
  totalQuantity: number;
  events: Array<{
    eventId: string;
    eventName: string;
    eventDate: string;
    quantity: number;
  }>;
}

/**
 * GET /api/v1/menu/procurement
 * 跨場次備料彙總
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminOrAbove();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const eventIds = searchParams.get("eventIds"); // comma-separated

    if (!startDate && !endDate && !eventIds) {
      return NextResponse.json(
        { error: "請提供日期範圍或場次 ID" },
        { status: 400 }
      );
    }

    // 建立查詢條件
    const where: Record<string, unknown> = {};

    if (eventIds) {
      where.id = { in: eventIds.split(",") };
    } else {
      const dateFilter: Record<string, unknown> = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }
      where.date = dateFilter;
    }

    // 取得場次及其菜單
    const events = await prisma.event.findMany({
      where,
      select: {
        id: true,
        name: true,
        date: true,
        adultsCount: true,
        childrenCount: true,
        eventMenu: {
          include: {
            items: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    // 彙總 BOM
    const bomMap = new Map<string, BOMAggregate>();

    for (const event of events) {
      if (!event.eventMenu) continue;

      const totalGuests = (event.adultsCount || 0) + (event.childrenCount || 0);

      for (const item of event.eventMenu.items) {
        const bomSnapshot = item.bomSnapshot as Array<{
          ingredientName: string;
          quantity: number;
          unit: string;
        }> | null;

        if (!bomSnapshot) continue;

        for (const bom of bomSnapshot) {
          // 計算此場次此材料的總需求
          const itemQuantity = Number(item.totalQuantity) * bom.quantity;

          const key = `${bom.ingredientName}__${bom.unit}`;

          if (!bomMap.has(key)) {
            bomMap.set(key, {
              ingredientName: bom.ingredientName,
              unit: bom.unit,
              totalQuantity: 0,
              events: [],
            });
          }

          const aggregate = bomMap.get(key)!;
          aggregate.totalQuantity += itemQuantity;
          aggregate.events.push({
            eventId: event.id,
            eventName: event.name,
            eventDate: event.date.toISOString().split("T")[0],
            quantity: itemQuantity,
          });
        }
      }
    }

    // 轉換為陣列並排序
    const procurement = Array.from(bomMap.values()).sort((a, b) =>
      a.ingredientName.localeCompare(b.ingredientName, "zh-TW")
    );

    // 統計
    const summary = {
      totalEvents: events.length,
      eventsWithMenu: events.filter((e) => e.eventMenu).length,
      totalIngredients: procurement.length,
      dateRange: {
        start: startDate || events[0]?.date?.toISOString().split("T")[0],
        end: endDate || events[events.length - 1]?.date?.toISOString().split("T")[0],
      },
    };

    return NextResponse.json({
      summary,
      procurement,
      events: events.map((e) => ({
        id: e.id,
        name: e.name,
        date: e.date.toISOString().split("T")[0],
        hasMenu: !!e.eventMenu,
        totalGuests: (e.adultsCount || 0) + (e.childrenCount || 0),
      })),
    });
  } catch (error) {
    console.error("Error fetching procurement:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "取得備料彙總失敗" }, { status: 500 });
  }
}

/**
 * POST /api/v1/menu/procurement
 * 匯出採購單（返回 JSON 格式供前端轉換）
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminOrAbove();

    const body = await request.json();
    const { startDate, endDate, eventIds, format = "json" } = body as {
      startDate?: string;
      endDate?: string;
      eventIds?: string[];
      format?: "json" | "csv";
    };

    // 使用相同的邏輯取得備料彙總
    const where: Record<string, unknown> = {};

    if (eventIds && eventIds.length > 0) {
      where.id = { in: eventIds };
    } else if (startDate || endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.date = dateFilter;
    } else {
      return NextResponse.json(
        { error: "請提供日期範圍或場次 ID" },
        { status: 400 }
      );
    }

    const events = await prisma.event.findMany({
      where,
      select: {
        id: true,
        name: true,
        date: true,
        adultsCount: true,
        childrenCount: true,
        eventMenu: {
          include: { items: true },
        },
      },
      orderBy: { date: "asc" },
    });

    // 彙總
    const bomMap = new Map<string, { ingredientName: string; unit: string; totalQuantity: number }>();

    for (const event of events) {
      if (!event.eventMenu) continue;

      for (const item of event.eventMenu.items) {
        const bomSnapshot = item.bomSnapshot as Array<{
          ingredientName: string;
          quantity: number;
          unit: string;
        }> | null;

        if (!bomSnapshot) continue;

        for (const bom of bomSnapshot) {
          const itemQuantity = Number(item.totalQuantity) * bom.quantity;
          const key = `${bom.ingredientName}__${bom.unit}`;

          if (!bomMap.has(key)) {
            bomMap.set(key, {
              ingredientName: bom.ingredientName,
              unit: bom.unit,
              totalQuantity: 0,
            });
          }

          bomMap.get(key)!.totalQuantity += itemQuantity;
        }
      }
    }

    const procurement = Array.from(bomMap.values()).sort((a, b) =>
      a.ingredientName.localeCompare(b.ingredientName, "zh-TW")
    );

    if (format === "csv") {
      // 產生 CSV
      const csvRows = [
        ["材料名稱", "單位", "總需求量"],
        ...procurement.map((p) => [
          p.ingredientName,
          p.unit,
          p.totalQuantity.toFixed(2),
        ]),
      ];
      const csv = csvRows.map((row) => row.join(",")).join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="procurement_${startDate || "export"}.csv"`,
        },
      });
    }

    return NextResponse.json({
      exportDate: new Date().toISOString(),
      dateRange: { startDate, endDate },
      eventCount: events.length,
      procurement,
    });
  } catch (error) {
    console.error("Error exporting procurement:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "匯出採購單失敗" }, { status: 500 });
  }
}

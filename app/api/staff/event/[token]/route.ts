import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/staff/event/[token]
 * 員工查看活動詳情（公開 API，使用 token 驗證）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 16) {
      return NextResponse.json({ error: "無效的連結" }, { status: 400 });
    }

    // 透過 token 查找活動
    const event = await prisma.event.findUnique({
      where: { staffToken: token },
      include: {
        venue: {
          select: {
            name: true,
            address: true,
            equipment: true,
            notes: true,
          },
        },
        eventStaff: {
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                phone: true,
                skill: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "找不到活動或連結已失效" }, { status: 404 });
    }

    // 格式化日期
    const dateStr = event.date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });

    // 計算總人數
    const guestCount = {
      adults: event.adultsCount || 0,
      children: event.childrenCount || 0,
      vegetarian: event.vegetarianCount || 0,
      total: (event.adultsCount || 0) + (event.childrenCount || 0),
    };

    // 建立 Google Maps 連結
    const mapsLink = event.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`
      : null;

    // 組裝回傳資料（不含敏感資訊如金額）
    const response = {
      name: event.name,
      date: dateStr,
      dateRaw: event.date.toISOString().split("T")[0],
      assemblyTime: event.assemblyTime,
      startTime: event.startTime,
      mealTime: event.mealTime,
      
      location: event.location,
      address: event.address,
      mapsLink,
      
      venue: event.venue
        ? {
            name: event.venue.name,
            equipment: event.venue.equipment,
            notes: event.venue.notes,
          }
        : null,
      
      guestCount,
      
      contactName: event.contactName,
      contactPhone: event.contactPhone,
      
      menu: event.menu,
      reminders: event.reminders,
      notes: event.notes,
      
      eventType: event.eventType,
      status: event.status,
      
      // 當天工作人員（不含電話）
      staff: event.eventStaff.map((es) => ({
        name: es.staff.name,
        role: es.role,
        attendanceStatus: es.attendanceStatus,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching event for staff:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/staff/event/[token]
 * 員工確認出席
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { staffId, action } = body;

    if (!token || !staffId) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    // 透過 token 查找活動
    const event = await prisma.event.findUnique({
      where: { staffToken: token },
    });

    if (!event) {
      return NextResponse.json({ error: "找不到活動" }, { status: 404 });
    }

    // 查找該員工的排班記錄
    const eventStaff = await prisma.eventStaff.findUnique({
      where: {
        eventId_staffId: {
          eventId: event.id,
          staffId,
        },
      },
    });

    if (!eventStaff) {
      return NextResponse.json({ error: "找不到排班記錄" }, { status: 404 });
    }

    // 更新出勤狀態
    if (action === "confirm") {
      await prisma.eventStaff.update({
        where: { id: eventStaff.id },
        data: { attendanceStatus: "CONFIRMED" },
      });
      return NextResponse.json({ message: "已確認出席", status: "CONFIRMED" });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (error) {
    console.error("Error confirming attendance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

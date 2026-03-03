import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// GET: 活動匯出報表
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    // 建立查詢條件
    const where: Record<string, unknown> = {};

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        (where.date as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.date as Record<string, Date>).lte = new Date(endDate);
      }
    }

    if (status) {
      where.status = status;
    }

    // 取得活動資料，包含場地和派工關聯
    const events = await prisma.event.findMany({
      where,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
          },
        },
        eventStaff: {
          select: {
            id: true,
            staffId: true,
            notified: true,
          },
        },
        notifications: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    // 轉換為匯出格式
    const exportData = events.map((event) => {
      const staffCount = event.eventStaff.length;
      const notifiedCount = event.eventStaff.filter((es) => es.notified).length;

      return {
        // 基本資訊
        name: event.name,
        date: event.date.toISOString().split("T")[0],
        startTime: event.startTime,
        assemblyTime: event.assemblyTime,
        mealTime: event.mealTime,

        // 場地資訊
        location: event.location,
        venueName: event.venue?.name || null,

        // 用餐人數
        adultsCount: event.adultsCount,
        childrenCount: event.childrenCount,
        vegetarianCount: event.vegetarianCount,

        // 活動狀態
        eventType: event.eventType,
        status: event.status,

        // 聯絡資訊
        contactName: event.contactName,
        contactPhone: event.contactPhone,

        // 金額資訊
        totalAmount: event.totalAmount ? Number(event.totalAmount) : null,
        depositAmount: event.depositAmount ? Number(event.depositAmount) : null,
        balanceAmount: event.balanceAmount ? Number(event.balanceAmount) : null,

        // 派工統計
        staffCount,
        notifiedCount,
      };
    });

    // 總計
    const summary = {
      totalEvents: exportData.length,
      totalAdults: exportData.reduce((sum, e) => sum + (e.adultsCount || 0), 0),
      totalChildren: exportData.reduce((sum, e) => sum + (e.childrenCount || 0), 0),
      totalVegetarian: exportData.reduce((sum, e) => sum + (e.vegetarianCount || 0), 0),
      totalAmount: exportData.reduce((sum, e) => sum + (e.totalAmount || 0), 0),
      totalDeposit: exportData.reduce((sum, e) => sum + (e.depositAmount || 0), 0),
      totalBalance: exportData.reduce((sum, e) => sum + (e.balanceAmount || 0), 0),
      totalStaffAssigned: exportData.reduce((sum, e) => sum + e.staffCount, 0),
      totalNotified: exportData.reduce((sum, e) => sum + e.notifiedCount, 0),
    };

    return NextResponse.json({
      events: exportData,
      summary,
      dateRange: {
        start: startDate || null,
        end: endDate || null,
      },
      filters: {
        status: status || null,
      },
    });
  } catch (error) {
    console.error("Events export error:", error);
    return NextResponse.json({ error: "取得活動匯出資料失敗" }, { status: 500 });
  }
}

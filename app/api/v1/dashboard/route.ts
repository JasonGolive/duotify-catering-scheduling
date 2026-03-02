import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";

/**
 * GET /api/v1/dashboard
 * Get dashboard statistics and data
 */
export async function GET() {
  try {
    await requireManager();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // 本月場次數
    const monthlyEvents = await prisma.event.count({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // 上月場次數（計算變化）
    const lastMonthEvents = await prisma.event.count({
      where: {
        date: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    // 在職員工數
    const activeStaff = await prisma.staff.count({
      where: { status: "ACTIVE" },
    });

    // 待確認活動
    const pendingEvents = await prisma.event.count({
      where: { status: "PENDING" },
    });

    // 待通知人次（已排班但未通知）
    const pendingNotifications = await prisma.eventStaff.count({
      where: {
        notified: false,
        event: {
          date: { gte: now },
        },
      },
    });

    // 即將到來的活動（未來 7 天）
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingEventsRaw = await prisma.event.findMany({
      where: {
        date: {
          gte: now,
          lte: sevenDaysLater,
        },
        status: {
          not: "CANCELLED",
        },
      },
      orderBy: { date: "asc" },
      take: 5,
      include: {
        _count: {
          select: { eventStaff: true },
        },
      },
    });

    const upcomingEvents = upcomingEventsRaw.map((event) => ({
      id: event.id,
      name: event.name,
      date: event.date.toISOString(),
      location: event.location,
      status: event.status,
      staffCount: event._count.eventStaff,
    }));

    // 最近動態（最近 5 筆通知記錄）
    const recentNotifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        staff: { select: { name: true } },
        event: { select: { name: true } },
      },
    });

    const recentActivity = recentNotifications.map((n) => ({
      id: n.id,
      type: n.type === "ASSIGNMENT" ? "STAFF_ASSIGNED" : "NOTIFICATION_SENT",
      title: n.staff?.name || "系統",
      description: n.event?.name ? `已通知：${n.event.name}` : n.title,
      createdAt: n.createdAt.toISOString(),
    }));

    return NextResponse.json({
      stats: {
        monthlyEvents,
        monthlyEventsChange: monthlyEvents - lastMonthEvents,
        activeStaff,
        pendingEvents,
        pendingNotifications,
      },
      upcomingEvents,
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

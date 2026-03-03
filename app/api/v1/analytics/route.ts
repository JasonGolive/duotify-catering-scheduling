import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { EventStatus, EventType, AttendanceStatus } from "@prisma/client";

// Map EventType enum to Chinese display names
const eventTypeLabels: Record<EventType, string> = {
  WEDDING: "婚宴",
  YEAREND: "尾牙",
  SPRING: "春酒",
  BIRTHDAY: "生日宴",
  CORPORATE: "企業活動",
  OTHER: "其他",
};

/**
 * GET /api/v1/analytics
 * Returns comprehensive analytics data for management reporting
 * Query params: startDate, endDate (optional, defaults to current month)
 */
export async function GET(request: NextRequest) {
  try {
    await requireManager();

    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Default to current month if not provided
    const now = new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = endDateParam
      ? new Date(endDateParam)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch events within date range
    const events = await prisma.event.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        eventStaff: true,
      },
    });

    // Event Metrics
    const totalEvents = events.length;
    const completedEvents = events.filter(
      (e) => e.status === EventStatus.COMPLETED
    ).length;
    const cancelledEvents = events.filter(
      (e) => e.status === EventStatus.CANCELLED
    ).length;
    const pendingEvents = events.filter(
      (e) => e.status === EventStatus.PENDING
    ).length;

    const totalStaffAssigned = events.reduce(
      (sum, e) => sum + e.eventStaff.length,
      0
    );
    const averageStaffPerEvent =
      totalEvents > 0
        ? Math.round((totalStaffAssigned / totalEvents) * 100) / 100
        : 0;

    // Events by type
    const eventsByType: Record<string, number> = {};
    for (const event of events) {
      const label = eventTypeLabels[event.eventType];
      eventsByType[label] = (eventsByType[label] || 0) + 1;
    }

    // Staff Metrics
    const activeStaff = await prisma.staff.count({
      where: { status: "ACTIVE" },
    });

    // Get all event staff records within date range
    const eventStaffRecords = await prisma.eventStaff.findMany({
      where: {
        event: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        staff: true,
      },
    });

    // Calculate attendance stats
    const totalScheduled = eventStaffRecords.length;
    const confirmedStatuses: AttendanceStatus[] = [
      AttendanceStatus.CONFIRMED,
      AttendanceStatus.ATTENDED,
      AttendanceStatus.COMPLETED,
    ];
    const leaveStatuses: AttendanceStatus[] = [
      AttendanceStatus.LEAVE_REQUESTED,
      AttendanceStatus.LEAVE_APPROVED,
    ];
    const confirmedAttendance = eventStaffRecords.filter((es) =>
      confirmedStatuses.includes(es.attendanceStatus)
    ).length;
    const leaveRequests = eventStaffRecords.filter((es) =>
      leaveStatuses.includes(es.attendanceStatus)
    ).length;

    const attendanceRate =
      totalScheduled > 0
        ? Math.round((confirmedAttendance / totalScheduled) * 10000) / 100
        : 0;
    const leaveRate =
      totalScheduled > 0
        ? Math.round((leaveRequests / totalScheduled) * 10000) / 100
        : 0;

    // Calculate events per staff
    const staffEventCounts: Record<
      string,
      { name: string; count: number; confirmed: number }
    > = {};
    for (const es of eventStaffRecords) {
      if (!staffEventCounts[es.staffId]) {
        staffEventCounts[es.staffId] = {
          name: es.staff.name,
          count: 0,
          confirmed: 0,
        };
      }
      staffEventCounts[es.staffId].count++;
      if (confirmedStatuses.includes(es.attendanceStatus)) {
        staffEventCounts[es.staffId].confirmed++;
      }
    }

    const staffWithEvents = Object.keys(staffEventCounts).length;
    const averageEventsPerStaff =
      staffWithEvents > 0
        ? Math.round(
            (Object.values(staffEventCounts).reduce((sum, s) => sum + s.count, 0) /
              staffWithEvents) *
              100
          ) / 100
        : 0;

    // Top performers (top 5 by event count)
    const topPerformers = Object.entries(staffEventCounts)
      .map(([staffId, data]) => ({
        staffId,
        staffName: data.name,
        eventCount: data.count,
        attendanceRate:
          data.count > 0
            ? Math.round((data.confirmed / data.count) * 10000) / 100
            : 0,
      }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 5);

    // Financial Metrics
    const totalRevenue = events.reduce(
      (sum, e) => sum + (e.totalAmount ? Number(e.totalAmount) : 0),
      0
    );

    // Get worklogs within date range
    const workLogs = await prisma.workLog.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalSalaryCost = workLogs.reduce(
      (sum, w) => sum + Number(w.totalSalary),
      0
    );

    const averageRevenuePerEvent =
      totalEvents > 0 ? Math.round(totalRevenue / totalEvents) : 0;

    const costRatio =
      totalRevenue > 0
        ? Math.round((totalSalaryCost / totalRevenue) * 10000) / 100
        : 0;

    // Trend Data (last 6 months including current)
    const trendMonths: { month: string; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0
      );
      const monthStr = `${monthDate.getFullYear()}-${String(
        monthDate.getMonth() + 1
      ).padStart(2, "0")}`;
      trendMonths.push({ month: monthStr, start: monthDate, end: monthEnd });
    }

    // Fetch events for trend data
    const trendStartDate = trendMonths[0].start;
    const trendEndDate = trendMonths[trendMonths.length - 1].end;

    const trendEvents = await prisma.event.findMany({
      where: {
        date: {
          gte: trendStartDate,
          lte: trendEndDate,
        },
      },
    });

    const monthlyEvents = trendMonths.map(({ month, start, end }) => ({
      month,
      count: trendEvents.filter(
        (e) => e.date >= start && e.date <= end
      ).length,
    }));

    const monthlyRevenue = trendMonths.map(({ month, start, end }) => ({
      month,
      amount: trendEvents
        .filter((e) => e.date >= start && e.date <= end)
        .reduce((sum, e) => sum + (e.totalAmount ? Number(e.totalAmount) : 0), 0),
    }));

    const analyticsData = {
      eventMetrics: {
        totalEvents,
        completedEvents,
        cancelledEvents,
        pendingEvents,
        averageStaffPerEvent,
        eventsByType,
      },
      staffMetrics: {
        totalActiveStaff: activeStaff,
        averageEventsPerStaff,
        topPerformers,
        attendanceRate,
        leaveRate,
      },
      financialMetrics: {
        totalRevenue,
        totalSalaryCost,
        averageRevenuePerEvent,
        costRatio,
      },
      trendData: {
        monthlyEvents,
        monthlyRevenue,
      },
    };

    return NextResponse.json(analyticsData, { status: 200 });
  } catch (error) {
    console.error("Error fetching analytics:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json(
        { error: "Forbidden: Manager role required" },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

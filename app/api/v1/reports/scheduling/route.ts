import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// GET: 排班統計報表
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const staffId = searchParams.get("staffId");

    // Build event filter based on date range
    const eventWhere: Record<string, unknown> = {};
    if (startDate || endDate) {
      eventWhere.date = {};
      if (startDate) {
        (eventWhere.date as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (eventWhere.date as Record<string, Date>).lte = new Date(endDate);
      }
    }

    // Build EventStaff filter
    const eventStaffWhere: Record<string, unknown> = {
      event: eventWhere,
    };
    if (staffId) {
      eventStaffWhere.staffId = staffId;
    }

    // Fetch event staff assignments with related data
    const eventStaffRecords = await prisma.eventStaff.findMany({
      where: eventStaffWhere,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            skill: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            status: true,
          },
        },
      },
      orderBy: [
        { event: { date: "asc" } },
        { staff: { name: "asc" } },
      ],
    });

    // Aggregate statistics by staff member
    const staffStatsMap = new Map<
      string,
      {
        staffId: string;
        staffName: string;
        staffSkill: string;
        totalEvents: number;
        eventsByRole: Record<string, number>;
        eventsByVehicle: Record<string, number>;
        attendanceStatusCounts: Record<string, number>;
      }
    >();

    for (const record of eventStaffRecords) {
      const key = record.staffId;
      
      if (!staffStatsMap.has(key)) {
        staffStatsMap.set(key, {
          staffId: record.staffId,
          staffName: record.staff.name,
          staffSkill: record.staff.skill,
          totalEvents: 0,
          eventsByRole: { FRONT: 0, HOT: 0, BOTH: 0 },
          eventsByVehicle: {
            BIG_TRUCK: 0,
            SMALL_TRUCK: 0,
            MANAGER_CAR: 0,
            OWN_CAR: 0,
            UNASSIGNED: 0,
          },
          attendanceStatusCounts: {
            SCHEDULED: 0,
            CONFIRMED: 0,
            ATTENDED: 0,
            LATE: 0,
            ABSENT: 0,
            CANCELLED: 0,
          },
        });
      }

      const stats = staffStatsMap.get(key)!;
      stats.totalEvents += 1;

      // Count by role
      if (stats.eventsByRole[record.role] !== undefined) {
        stats.eventsByRole[record.role] += 1;
      }

      // Count by vehicle type
      const vehicleKey = record.vehicle || "UNASSIGNED";
      if (stats.eventsByVehicle[vehicleKey] !== undefined) {
        stats.eventsByVehicle[vehicleKey] += 1;
      }

      // Count by attendance status
      if (stats.attendanceStatusCounts[record.attendanceStatus] !== undefined) {
        stats.attendanceStatusCounts[record.attendanceStatus] += 1;
      }
    }

    // Convert map to array
    const staffStats = Array.from(staffStatsMap.values()).sort((a, b) =>
      a.staffName.localeCompare(b.staffName)
    );

    // Calculate overall summary
    const summary = {
      totalAssignments: eventStaffRecords.length,
      uniqueStaffCount: staffStatsMap.size,
      uniqueEventCount: new Set(eventStaffRecords.map((r) => r.eventId)).size,
      overallByRole: { FRONT: 0, HOT: 0, BOTH: 0 },
      overallByVehicle: {
        BIG_TRUCK: 0,
        SMALL_TRUCK: 0,
        MANAGER_CAR: 0,
        OWN_CAR: 0,
        UNASSIGNED: 0,
      },
      overallAttendanceStatus: {
        SCHEDULED: 0,
        CONFIRMED: 0,
        ATTENDED: 0,
        LATE: 0,
        ABSENT: 0,
        CANCELLED: 0,
      },
    };

    for (const stats of staffStats) {
      for (const [role, count] of Object.entries(stats.eventsByRole)) {
        summary.overallByRole[role as keyof typeof summary.overallByRole] += count;
      }
      for (const [vehicle, count] of Object.entries(stats.eventsByVehicle)) {
        summary.overallByVehicle[vehicle as keyof typeof summary.overallByVehicle] += count;
      }
      for (const [status, count] of Object.entries(stats.attendanceStatusCounts)) {
        summary.overallAttendanceStatus[status as keyof typeof summary.overallAttendanceStatus] += count;
      }
    }

    return NextResponse.json({
      staffStats,
      summary,
      dateRange: {
        start: startDate || null,
        end: endDate || null,
      },
    });
  } catch (error) {
    console.error("Scheduling report error:", error);
    return NextResponse.json({ error: "取得排班統計失敗" }, { status: 500 });
  }
}

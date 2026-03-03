import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getCurrentSession } from "@/lib/auth";

/**
 * GET /api/v1/staff/me/events
 * Get the current staff member's assigned events
 * Query params: month (optional), year (optional)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { userId } = await getCurrentSession();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get staff record for the current user
    const staff = await prisma.staff.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff profile not found. Please contact your manager." },
        { status: 404 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    // Build date filter
    let dateFilter: { gte?: Date; lt?: Date } = {};
    
    if (monthParam && yearParam) {
      const year = parseInt(yearParam, 10);
      const month = parseInt(monthParam, 10) - 1; // JavaScript months are 0-indexed
      
      if (!isNaN(year) && !isNaN(month) && month >= 0 && month <= 11) {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 1);
        dateFilter = { gte: startDate, lt: endDate };
      }
    } else if (yearParam) {
      const year = parseInt(yearParam, 10);
      if (!isNaN(year)) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year + 1, 0, 1);
        dateFilter = { gte: startDate, lt: endDate };
      }
    }

    // Build where clause for events
    const whereClause: any = {
      staffId: staff.id,
      event: {
        status: { notIn: ["CANCELLED"] },
      },
    };

    if (Object.keys(dateFilter).length > 0) {
      whereClause.event.date = dateFilter;
    }

    // Fetch staff's assigned events
    const eventStaffRecords = await prisma.eventStaff.findMany({
      where: whereClause,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            assemblyTime: true,
            startTime: true,
            location: true,
            address: true,
            eventType: true,
            status: true,
          },
        },
      },
      orderBy: {
        event: {
          date: "asc",
        },
      },
    });

    // Transform to response format
    const events = eventStaffRecords.map((es) => ({
      id: es.event.id,
      name: es.event.name,
      date: es.event.date.toISOString().split("T")[0],
      assemblyTime: es.event.assemblyTime,
      startTime: es.event.startTime,
      location: es.event.location,
      address: es.event.address,
      eventType: es.event.eventType,
      eventStatus: es.event.status,
      workRole: es.role,
      attendanceStatus: es.attendanceStatus,
      confirmedAt: es.confirmedAt,
      notifiedAt: es.notifiedAt,
      leaveReason: es.leaveReason,
      // GPS check-in/check-out data
      checkInTime: es.checkInTime,
      checkInLatitude: es.checkInLatitude,
      checkInLongitude: es.checkInLongitude,
      checkOutTime: es.checkOutTime,
      checkOutLatitude: es.checkOutLatitude,
      checkOutLongitude: es.checkOutLongitude,
      actualHours: es.actualHours ? Number(es.actualHours) : null,
    }));

    // Calculate monthly summary if month/year specified
    let summary = null;
    if (monthParam && yearParam) {
      const totalEvents = events.length;
      const confirmedEvents = events.filter(
        (e) => e.attendanceStatus === "CONFIRMED" || e.attendanceStatus === "ATTENDED" || e.attendanceStatus === "COMPLETED"
      ).length;
      const pendingEvents = events.filter(
        (e) => e.attendanceStatus === "SCHEDULED"
      ).length;
      const leaveRequested = events.filter(
        (e) => e.attendanceStatus === "LEAVE_REQUESTED"
      ).length;

      summary = {
        month: parseInt(monthParam, 10),
        year: parseInt(yearParam, 10),
        totalEvents,
        confirmedEvents,
        pendingEvents,
        leaveRequested,
      };
    }

    return NextResponse.json({
      events,
      summary,
    });
  } catch (error) {
    console.error("Error fetching staff events:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { AttendanceStatus, Prisma } from "@prisma/client";

/**
 * GET /api/v1/leave-requests
 * List all leave requests (Manager only)
 * Query params: status (LEAVE_REQUESTED, LEAVE_APPROVED, LEAVE_REJECTED)
 */
export async function GET(request: NextRequest) {
  try {
    await requireManager();

    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get("status");

    // Build where clause
    const where: Prisma.EventStaffWhereInput = {};
    
    if (statusFilter && ["LEAVE_REQUESTED", "LEAVE_APPROVED", "LEAVE_REJECTED"].includes(statusFilter)) {
      where.attendanceStatus = statusFilter as AttendanceStatus;
    } else {
      // Default: show all leave-related statuses
      where.attendanceStatus = {
        in: [
          AttendanceStatus.LEAVE_REQUESTED,
          AttendanceStatus.LEAVE_APPROVED,
          AttendanceStatus.LEAVE_REJECTED,
        ],
      };
    }

    const leaveRequests = await prisma.eventStaff.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            assemblyTime: true,
            startTime: true,
            location: true,
            venue: {
              select: {
                name: true,
              },
            },
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            lineUserId: true,
          },
        },
      },
      orderBy: [
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ leaveRequests }, { status: 200 });
  } catch (error) {
    console.error("Error fetching leave requests:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden: Manager role required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getCurrentSession } from "@/lib/auth";

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

/**
 * POST /api/v1/staff/me/events/[eventId]/confirm
 * Staff confirms their attendance for an event
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();

    const { userId } = await getCurrentSession();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;

    // Get staff record for the current user
    const staff = await prisma.staff.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff profile not found. Please contact your manager." },
        { status: 404 }
      );
    }

    // Find the event assignment
    const eventStaff = await prisma.eventStaff.findUnique({
      where: {
        eventId_staffId: {
          eventId,
          staffId: staff.id,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            status: true,
          },
        },
      },
    });

    if (!eventStaff) {
      return NextResponse.json(
        { error: "You are not assigned to this event" },
        { status: 404 }
      );
    }

    // Check if event is cancelled
    if (eventStaff.event.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot confirm attendance for a cancelled event" },
        { status: 400 }
      );
    }

    // Check if event date has passed
    const eventDate = new Date(eventStaff.event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      return NextResponse.json(
        { error: "Cannot confirm attendance for a past event" },
        { status: 400 }
      );
    }

    // Check current status - only allow confirming from SCHEDULED or LEAVE_REJECTED states
    const allowedStatuses = ["SCHEDULED", "LEAVE_REJECTED"];
    if (!allowedStatuses.includes(eventStaff.attendanceStatus)) {
      return NextResponse.json(
        { error: `Cannot confirm attendance. Current status: ${eventStaff.attendanceStatus}` },
        { status: 400 }
      );
    }

    // Update attendance status
    const updatedEventStaff = await prisma.eventStaff.update({
      where: {
        eventId_staffId: {
          eventId,
          staffId: staff.id,
        },
      },
      data: {
        attendanceStatus: "CONFIRMED",
        confirmedAt: new Date(),
        leaveReason: null, // Clear any previous leave reason
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Attendance confirmed successfully",
      eventStaff: {
        eventId: updatedEventStaff.eventId,
        eventName: updatedEventStaff.event.name,
        eventDate: updatedEventStaff.event.date.toISOString().split("T")[0],
        attendanceStatus: updatedEventStaff.attendanceStatus,
        confirmedAt: updatedEventStaff.confirmedAt,
      },
    });
  } catch (error) {
    console.error("Error confirming attendance:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

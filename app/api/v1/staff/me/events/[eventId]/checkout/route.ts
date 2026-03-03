import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getCurrentSession } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

interface CheckOutBody {
  latitude: number;
  longitude: number;
}

/**
 * POST /api/v1/staff/me/events/[eventId]/checkout
 * Staff checks out from an event with GPS coordinates
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();

    const { userId } = await getCurrentSession();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;

    // Parse request body
    let body: CheckOutBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Validate required fields
    if (typeof body.latitude !== "number" || typeof body.longitude !== "number") {
      return NextResponse.json(
        { error: "latitude and longitude are required" },
        { status: 400 }
      );
    }

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

    // Check if already checked out
    if (eventStaff.checkOutTime) {
      return NextResponse.json(
        { error: "You have already checked out from this event" },
        { status: 400 }
      );
    }

    // Check if not checked in yet
    if (!eventStaff.checkInTime) {
      return NextResponse.json(
        { error: "You must check in before checking out" },
        { status: 400 }
      );
    }

    // Calculate actual hours
    const now = new Date();
    const checkInTime = new Date(eventStaff.checkInTime);
    const diffMs = now.getTime() - checkInTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    // Round to 2 decimal places
    const actualHours = Math.round(diffHours * 100) / 100;

    // Update check-out data
    const updatedEventStaff = await prisma.eventStaff.update({
      where: {
        eventId_staffId: {
          eventId,
          staffId: staff.id,
        },
      },
      data: {
        checkOutTime: now,
        checkOutLatitude: body.latitude,
        checkOutLongitude: body.longitude,
        actualHours: new Decimal(actualHours),
        attendanceStatus: "COMPLETED",
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
      message: "Check-out successful",
      checkOut: {
        eventId: updatedEventStaff.eventId,
        eventName: updatedEventStaff.event.name,
        eventDate: updatedEventStaff.event.date.toISOString().split("T")[0],
        checkInTime: updatedEventStaff.checkInTime,
        checkOutTime: updatedEventStaff.checkOutTime,
        checkOutLatitude: updatedEventStaff.checkOutLatitude,
        checkOutLongitude: updatedEventStaff.checkOutLongitude,
        actualHours: updatedEventStaff.actualHours,
        attendanceStatus: updatedEventStaff.attendanceStatus,
      },
    });
  } catch (error) {
    console.error("Error checking out:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

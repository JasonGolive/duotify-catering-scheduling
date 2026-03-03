import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getCurrentSession } from "@/lib/auth";

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

interface CheckInBody {
  latitude: number;
  longitude: number;
  photoUrl?: string;
}

/**
 * POST /api/v1/staff/me/events/[eventId]/checkin
 * Staff checks in to an event with GPS coordinates
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
    let body: CheckInBody;
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
            assemblyTime: true,
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
        { error: "Cannot check in to a cancelled event" },
        { status: 400 }
      );
    }

    // Check if already checked in
    if (eventStaff.checkInTime) {
      return NextResponse.json(
        { error: "You have already checked in to this event" },
        { status: 400 }
      );
    }

    // Check if event is today or within 30 minutes of start time
    const now = new Date();
    const eventDate = new Date(eventStaff.event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    // Allow check-in on the event day or if within 30 minutes of assembly time
    const isEventDay = eventDate.getTime() === today.getTime();
    
    if (!isEventDay) {
      // Check if event is tomorrow and we're within 30 minutes of midnight
      // Or calculate based on assembly time
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (eventDate.getTime() === tomorrow.getTime() && eventStaff.event.assemblyTime) {
        // Parse assembly time
        const [hours, minutes] = eventStaff.event.assemblyTime.split(":").map(Number);
        const eventStartTime = new Date(eventStaff.event.date);
        eventStartTime.setHours(hours, minutes, 0, 0);
        
        // Calculate 30 minutes before start time
        const earliestCheckIn = new Date(eventStartTime.getTime() - 30 * 60 * 1000);
        
        if (now < earliestCheckIn) {
          return NextResponse.json(
            { error: "Cannot check in yet. Check-in opens 30 minutes before assembly time." },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Cannot check in to an event on a different day" },
          { status: 400 }
        );
      }
    }

    // Update check-in data
    const updatedEventStaff = await prisma.eventStaff.update({
      where: {
        eventId_staffId: {
          eventId,
          staffId: staff.id,
        },
      },
      data: {
        checkInTime: now,
        checkInLatitude: body.latitude,
        checkInLongitude: body.longitude,
        checkInPhotoUrl: body.photoUrl || null,
        // Update attendance status to CONFIRMED if not already
        attendanceStatus: eventStaff.attendanceStatus === "SCHEDULED" ? "CONFIRMED" : eventStaff.attendanceStatus,
        confirmedAt: eventStaff.confirmedAt || now,
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
      message: "Check-in successful",
      checkIn: {
        eventId: updatedEventStaff.eventId,
        eventName: updatedEventStaff.event.name,
        eventDate: updatedEventStaff.event.date.toISOString().split("T")[0],
        checkInTime: updatedEventStaff.checkInTime,
        checkInLatitude: updatedEventStaff.checkInLatitude,
        checkInLongitude: updatedEventStaff.checkInLongitude,
        attendanceStatus: updatedEventStaff.attendanceStatus,
      },
    });
  } catch (error) {
    console.error("Error checking in:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

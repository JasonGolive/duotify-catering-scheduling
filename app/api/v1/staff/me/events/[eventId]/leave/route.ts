import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getCurrentSession } from "@/lib/auth";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

// Validation schema for leave request
const leaveRequestSchema = z.object({
  reason: z.string().min(1, "Leave reason is required").max(500, "Reason cannot exceed 500 characters"),
});

/**
 * POST /api/v1/staff/me/events/[eventId]/leave
 * Staff requests leave for an event
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();

    const { userId } = await getCurrentSession();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = leaveRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { reason } = validationResult.data;

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
        { error: "Cannot request leave for a cancelled event" },
        { status: 400 }
      );
    }

    // Check if event date has passed
    const eventDate = new Date(eventStaff.event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      return NextResponse.json(
        { error: "Cannot request leave for a past event" },
        { status: 400 }
      );
    }

    // Check current status - only allow leave request from SCHEDULED or CONFIRMED states
    const allowedStatuses = ["SCHEDULED", "CONFIRMED"];
    if (!allowedStatuses.includes(eventStaff.attendanceStatus)) {
      return NextResponse.json(
        { error: `Cannot request leave. Current status: ${eventStaff.attendanceStatus}` },
        { status: 400 }
      );
    }

    // Update attendance status and record leave reason
    const updatedEventStaff = await prisma.eventStaff.update({
      where: {
        eventId_staffId: {
          eventId,
          staffId: staff.id,
        },
      },
      data: {
        attendanceStatus: "LEAVE_REQUESTED",
        leaveReason: reason,
        confirmedAt: null, // Clear confirmation time
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

    // Create notification for managers
    // Find all managers to notify
    const managers = await prisma.user.findMany({
      where: { role: "MANAGER" },
      select: { id: true },
    });

    // Create notification records for each manager
    // Note: We store one notification per manager in the system
    // The notification content is about the leave request
    const notificationTitle = `【請假申請】${staff.name} - ${eventStaff.event.name}`;
    const notificationContent = `員工 ${staff.name} 已申請請假：
活動：${eventStaff.event.name}
日期：${eventStaff.event.date.toISOString().split("T")[0]}
原因：${reason}

請至管理後台審核此請假申請。`;

    // Create a notification record (linked to the staff who requested)
    await prisma.notification.create({
      data: {
        staffId: staff.id,
        eventId: eventStaff.eventId,
        type: "LEAVE_REQUEST",
        channel: "EMAIL", // Default channel for leave requests
        title: notificationTitle,
        content: notificationContent,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      message: "Leave request submitted successfully",
      eventStaff: {
        eventId: updatedEventStaff.eventId,
        eventName: updatedEventStaff.event.name,
        eventDate: updatedEventStaff.event.date.toISOString().split("T")[0],
        attendanceStatus: updatedEventStaff.attendanceStatus,
        leaveReason: updatedEventStaff.leaveReason,
      },
    });
  } catch (error) {
    console.error("Error requesting leave:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

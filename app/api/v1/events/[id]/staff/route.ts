import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { createEventStaffSchema } from "@/lib/validations/event-staff";
import { z } from "zod";

/**
 * GET /api/v1/events/[id]/staff
 * Get all staff assigned to an event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManager();
    const { id: eventId } = await params;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "找不到活動" }, { status: 404 });
    }

    const eventStaff = await prisma.eventStaff.findMany({
      where: { eventId },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            phone: true,
            skill: true,
            perEventSalary: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Serialize Decimal fields
    const serialized = eventStaff.map((es) => ({
      ...es,
      salary: Number(es.salary),
      actualHours: es.actualHours ? Number(es.actualHours) : null,
      adjustedSalary: es.adjustedSalary ? Number(es.adjustedSalary) : null,
      staff: {
        ...es.staff,
        perEventSalary: Number(es.staff.perEventSalary),
      },
    }));

    return NextResponse.json({ eventStaff: serialized }, { status: 200 });
  } catch (error) {
    console.error("Error fetching event staff:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/v1/events/[id]/staff
 * Add a staff member to an event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManager();
    const { id: eventId } = await params;
    const body = await request.json();

    const validatedData = createEventStaffSchema.parse(body);

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "找不到活動" }, { status: 404 });
    }

    // Check if staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: validatedData.staffId },
    });

    if (!staff) {
      return NextResponse.json({ error: "找不到員工" }, { status: 404 });
    }

    // Check if already assigned
    const existing = await prisma.eventStaff.findUnique({
      where: {
        eventId_staffId: {
          eventId,
          staffId: validatedData.staffId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "此員工已指派到此活動" }, { status: 400 });
    }

    // Check for scheduling conflicts (same day)
    const conflicts = await prisma.eventStaff.findMany({
      where: {
        staffId: validatedData.staffId,
        event: {
          date: event.date,
          id: { not: eventId },
        },
      },
      include: {
        event: {
          select: { id: true, name: true, date: true },
        },
      },
    });

    // Create the assignment
    const eventStaff = await prisma.eventStaff.create({
      data: {
        eventId,
        staffId: validatedData.staffId,
        role: validatedData.role,
        salary: validatedData.salary,
        attendanceStatus: validatedData.attendanceStatus,
        actualHours: validatedData.actualHours ?? null,
        adjustedSalary: validatedData.adjustedSalary ?? null,
        notes: validatedData.notes ?? null,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            phone: true,
            skill: true,
            perEventSalary: true,
          },
        },
      },
    });

    // Serialize
    const serialized = {
      ...eventStaff,
      salary: Number(eventStaff.salary),
      actualHours: eventStaff.actualHours ? Number(eventStaff.actualHours) : null,
      adjustedSalary: eventStaff.adjustedSalary ? Number(eventStaff.adjustedSalary) : null,
      staff: {
        ...eventStaff.staff,
        perEventSalary: Number(eventStaff.staff.perEventSalary),
      },
      conflicts: conflicts.map((c) => ({
        eventId: c.event.id,
        eventName: c.event.name,
        date: c.event.date,
      })),
    };

    return NextResponse.json({ eventStaff: serialized }, { status: 201 });
  } catch (error) {
    console.error("Error adding staff to event:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "驗證失敗", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { updateEventStaffSchema } from "@/lib/validations/event-staff";
import { z } from "zod";

/**
 * PUT /api/v1/events/[id]/staff/[staffId]
 * Update a staff assignment (attendance, salary, etc.)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    await requireManager();
    const { id: eventId, staffId } = await params;
    const body = await request.json();

    const validatedData = updateEventStaffSchema.parse(body);

    // Find the assignment
    const existing = await prisma.eventStaff.findUnique({
      where: {
        eventId_staffId: { eventId, staffId },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "找不到此排班記錄" }, { status: 404 });
    }

    // Calculate adjusted salary based on attendance
    let adjustedSalary = validatedData.adjustedSalary;
    if (validatedData.attendanceStatus && !adjustedSalary) {
      const currentSalary = validatedData.salary ?? Number(existing.salary);
      switch (validatedData.attendanceStatus) {
        case "ABSENT":
        case "CANCELLED":
          adjustedSalary = 0;
          break;
        case "ATTENDED":
        case "CONFIRMED":
        case "SCHEDULED":
          adjustedSalary = currentSalary;
          break;
        // LATE: keep as undefined, let user set manually
      }
    }

    // Update the assignment
    const updated = await prisma.eventStaff.update({
      where: {
        eventId_staffId: { eventId, staffId },
      },
      data: {
        role: validatedData.role,
        salary: validatedData.salary,
        attendanceStatus: validatedData.attendanceStatus,
        actualHours: validatedData.actualHours,
        adjustedSalary: adjustedSalary,
        notes: validatedData.notes,
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
      ...updated,
      salary: Number(updated.salary),
      actualHours: updated.actualHours ? Number(updated.actualHours) : null,
      adjustedSalary: updated.adjustedSalary ? Number(updated.adjustedSalary) : null,
      staff: {
        ...updated.staff,
        perEventSalary: Number(updated.staff.perEventSalary),
      },
    };

    return NextResponse.json({ eventStaff: serialized }, { status: 200 });
  } catch (error) {
    console.error("Error updating event staff:", error);

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

/**
 * DELETE /api/v1/events/[id]/staff/[staffId]
 * Remove a staff member from an event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    await requireManager();
    const { id: eventId, staffId } = await params;

    // Check if exists
    const existing = await prisma.eventStaff.findUnique({
      where: {
        eventId_staffId: { eventId, staffId },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "找不到此排班記錄" }, { status: 404 });
    }

    // Delete the assignment
    await prisma.eventStaff.delete({
      where: {
        eventId_staffId: { eventId, staffId },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error removing staff from event:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

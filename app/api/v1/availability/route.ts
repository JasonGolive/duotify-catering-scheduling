import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Skill } from "@prisma/client";

// GET /api/v1/availability - Get available staff for a specific date
// Query params: date (required), skill (optional)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const skill = searchParams.get("skill");

    if (!date) {
      return NextResponse.json(
        { error: "日期為必填" },
        { status: 400 }
      );
    }

    const dateObj = new Date(date);

    // Get all active staff
    const staffQuery: {
      status: "ACTIVE";
      skill?: Skill;
    } = { status: "ACTIVE" };
    
    if (skill && ["FRONT", "HOT", "BOTH"].includes(skill)) {
      staffQuery.skill = skill as Skill;
    }

    const allStaff = await prisma.staff.findMany({
      where: staffQuery,
      select: {
        id: true,
        name: true,
        phone: true,
        skill: true,
        perEventSalary: true,
        availability: {
          where: {
            date: dateObj,
          },
        },
        eventStaff: {
          where: {
            event: {
              date: dateObj,
            },
          },
          select: {
            eventId: true,
            event: {
              select: {
                name: true,
                startTime: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Process availability and conflicts
    const result = allStaff.map((staff) => {
      const availabilityRecord = staff.availability[0];
      const hasConflict = staff.eventStaff.length > 0;
      
      // Default is available unless explicitly marked unavailable
      const isAvailable = availabilityRecord?.available !== false;
      
      return {
        id: staff.id,
        name: staff.name,
        phone: staff.phone,
        skill: staff.skill,
        perEventSalary: Number(staff.perEventSalary),
        isAvailable,
        unavailableReason: availabilityRecord?.reason || null,
        hasConflict,
        conflicts: staff.eventStaff.map((es) => ({
          eventId: es.eventId,
          eventTitle: es.event.name,
          startTime: es.event.startTime,
        })),
      };
    });

    // Separate into available and unavailable
    const available = result.filter((s) => s.isAvailable && !s.hasConflict);
    const unavailable = result.filter((s) => !s.isAvailable);
    const conflicting = result.filter((s) => s.isAvailable && s.hasConflict);

    return NextResponse.json({
      date,
      available,
      unavailable,
      conflicting,
      summary: {
        total: result.length,
        available: available.length,
        unavailable: unavailable.length,
        conflicting: conflicting.length,
      },
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "無法取得可用員工" },
      { status: 500 }
    );
  }
}

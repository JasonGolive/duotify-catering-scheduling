import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Skill } from "@prisma/client";

// Default scheduling settings
const DEFAULT_MAX_EVENTS_PER_DAY = 2;
const DEFAULT_EVENT_DURATION_HOURS = 4;

// Helper: Parse HH:mm time string to minutes since midnight
function parseTimeToMinutes(time: string | null): number | null {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

// Helper: Check if two time ranges overlap
function doTimesOverlap(
  start1: number | null,
  end1: number | null,
  start2: number | null,
  end2: number | null
): boolean {
  // If any time is missing, assume potential overlap (conservative approach)
  if (start1 === null || start2 === null) return false;
  // Use default duration if end times are missing
  const actualEnd1 = end1 ?? start1 + DEFAULT_EVENT_DURATION_HOURS * 60;
  const actualEnd2 = end2 ?? start2 + DEFAULT_EVENT_DURATION_HOURS * 60;
  return start1 < actualEnd2 && start2 < actualEnd1;
}

// GET /api/v1/availability - Get available staff for a specific date
// Query params: date (required), skill (optional), startTime (optional), endTime (optional), maxEventsPerDay (optional)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const skill = searchParams.get("skill");
    const requestedStartTime = searchParams.get("startTime");
    const requestedEndTime = searchParams.get("endTime");
    const maxEventsPerDayParam = searchParams.get("maxEventsPerDay");
    
    const maxEventsPerDay = maxEventsPerDayParam 
      ? parseInt(maxEventsPerDayParam, 10) 
      : DEFAULT_MAX_EVENTS_PER_DAY;

    if (!date) {
      return NextResponse.json(
        { error: "日期為必填" },
        { status: 400 }
      );
    }

    const dateObj = new Date(date);
    const requestedStartMinutes = parseTimeToMinutes(requestedStartTime);
    const requestedEndMinutes = parseTimeToMinutes(requestedEndTime);

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
        canDrive: true,
        hasOwnCar: true,
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
                id: true,
                name: true,
                startTime: true,
                assemblyTime: true,
                mealTime: true,
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
      const eventsToday = staff.eventStaff.length;
      const exceedsLimit = eventsToday >= maxEventsPerDay;
      
      // Default is available unless explicitly marked unavailable
      const isAvailable = availabilityRecord?.available !== false;
      
      // Find conflicting time slots
      const conflictingTimeSlots: Array<{
        eventId: string;
        eventName: string;
        startTime: string | null;
        endTime: string | null;
      }> = [];
      
      // Check for time overlap with each assigned event
      for (const es of staff.eventStaff) {
        const eventStartMinutes = parseTimeToMinutes(es.event.startTime);
        // Estimate end time: use mealTime + buffer, or startTime + default duration
        const eventMealMinutes = parseTimeToMinutes(es.event.mealTime);
        const eventEndMinutes = eventMealMinutes 
          ? eventMealMinutes + 60 // Add 1 hour after meal time
          : (eventStartMinutes !== null ? eventStartMinutes + DEFAULT_EVENT_DURATION_HOURS * 60 : null);
        
        // Calculate estimated end time string for response
        let estimatedEndTime: string | null = null;
        if (eventEndMinutes !== null) {
          const endHours = Math.floor(eventEndMinutes / 60) % 24;
          const endMins = eventEndMinutes % 60;
          estimatedEndTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;
        }
        
        // Check overlap only if requested time is provided
        if (requestedStartMinutes !== null) {
          const overlaps = doTimesOverlap(
            requestedStartMinutes,
            requestedEndMinutes,
            eventStartMinutes,
            eventEndMinutes
          );
          
          if (overlaps) {
            conflictingTimeSlots.push({
              eventId: es.event.id,
              eventName: es.event.name,
              startTime: es.event.startTime,
              endTime: estimatedEndTime,
            });
          }
        } else {
          // If no specific time requested, include all events as potential conflicts
          conflictingTimeSlots.push({
            eventId: es.event.id,
            eventName: es.event.name,
            startTime: es.event.startTime,
            endTime: estimatedEndTime,
          });
        }
      }
      
      const hasConflict = eventsToday > 0;
      const hasTimeConflict = conflictingTimeSlots.length > 0;
      
      return {
        id: staff.id,
        name: staff.name,
        phone: staff.phone,
        skill: staff.skill,
        perEventSalary: Number(staff.perEventSalary),
        canDrive: staff.canDrive,
        hasOwnCar: staff.hasOwnCar,
        isAvailable,
        unavailableReason: availabilityRecord?.reason || null,
        hasConflict,
        // Enhanced conflict details
        conflictDetails: {
          eventsToday,
          exceedsLimit,
          maxEventsPerDay,
          conflictingTimeSlots,
          hasTimeConflict,
        },
        // Legacy conflicts array for backward compatibility
        conflicts: staff.eventStaff.map((es) => ({
          eventId: es.eventId,
          eventTitle: es.event.name,
          startTime: es.event.startTime,
        })),
      };
    });

    // Separate into available and unavailable
    // Available: isAvailable AND doesn't exceed limit AND no time conflicts (if time specified)
    const available = result.filter((s) => {
      if (!s.isAvailable) return false;
      if (s.conflictDetails.exceedsLimit) return false;
      if (requestedStartMinutes !== null && s.conflictDetails.hasTimeConflict) return false;
      return true;
    });
    
    const unavailable = result.filter((s) => !s.isAvailable);
    
    // Conflicting: isAvailable but has conflicts (exceeds limit OR time overlap)
    const conflicting = result.filter((s) => {
      if (!s.isAvailable) return false;
      return s.conflictDetails.exceedsLimit || 
        (requestedStartMinutes !== null && s.conflictDetails.hasTimeConflict) ||
        (requestedStartMinutes === null && s.hasConflict);
    });

    return NextResponse.json({
      date,
      requestedTimeSlot: requestedStartTime ? {
        startTime: requestedStartTime,
        endTime: requestedEndTime,
      } : null,
      settings: {
        maxEventsPerDay,
      },
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

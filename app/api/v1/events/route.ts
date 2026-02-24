import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { createEventSchema } from "@/lib/validations/event";
import { z } from "zod";

/**
 * GET /api/v1/events
 * Get all events (Manager only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireManager();

    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get("status");
    const typeFilter = searchParams.get("type");

    // Build where clause
    const where: Record<string, unknown> = {};
    if (statusFilter) {
      where.status = statusFilter;
    }
    if (typeFilter) {
      where.eventType = typeFilter;
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error("Error fetching events:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden: Manager role required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/v1/events
 * Create a new event (Manager only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireManager();

    const body = await request.json();
    const validatedData = createEventSchema.parse(body);

    const event = await prisma.event.create({
      data: {
        name: validatedData.name,
        date: new Date(validatedData.date),
        startTime: validatedData.startTime || null,
        endTime: validatedData.endTime || null,
        location: validatedData.location,
        address: validatedData.address || null,
        expectedGuests: validatedData.expectedGuests || null,
        contactName: validatedData.contactName || null,
        contactPhone: validatedData.contactPhone || null,
        eventType: validatedData.eventType,
        notes: validatedData.notes || null,
        status: validatedData.status,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "驗證失敗", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden: Manager role required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

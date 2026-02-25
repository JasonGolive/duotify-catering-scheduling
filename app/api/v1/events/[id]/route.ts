import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { updateEventSchema } from "@/lib/validations/event";
import { z } from "zod";

/**
 * GET /api/v1/events/[id]
 * Get a single event by ID (Manager only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManager();

    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        venue: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "找不到活動資料" }, { status: 404 });
    }

    // Convert Decimal to number for JSON serialization
    const serializedEvent = {
      ...event,
      totalAmount: event.totalAmount ? Number(event.totalAmount) : null,
      depositAmount: event.depositAmount ? Number(event.depositAmount) : null,
      balanceAmount: event.balanceAmount ? Number(event.balanceAmount) : null,
    };

    return NextResponse.json({ event: serializedEvent }, { status: 200 });
  } catch (error) {
    console.error("Error fetching event:", error);

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
 * PUT /api/v1/events/[id]
 * Update an event by ID (Manager only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManager();

    const { id } = await params;
    const body = await request.json();

    const validatedData = updateEventSchema.parse(body);

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "找不到活動資料" }, { status: 404 });
    }

    // 自動計算尾款：若未提供則為 總金額 - 訂金
    let balanceAmount = validatedData.balanceAmount;
    if (validatedData.totalAmount && validatedData.depositAmount && !balanceAmount) {
      balanceAmount = validatedData.totalAmount - validatedData.depositAmount;
    }

    // 自動將狀態設為已完成：若尾款已支付
    let status = validatedData.status;
    if (validatedData.balanceDate && validatedData.balanceMethod) {
      status = "COMPLETED";
    }

    // Helper to convert date string to Date or null
    const toDateOrNull = (dateStr: string | null | undefined) => {
      if (!dateStr || dateStr === "") return null;
      return new Date(dateStr);
    };

    // Helper to convert empty string to null
    const toNullIfEmpty = <T>(value: T | "" | null | undefined): T | null => {
      if (value === "" || value === undefined) return null;
      return value as T;
    };

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name: validatedData.name,
        date: validatedData.date ? new Date(validatedData.date) : undefined,
        startTime: toNullIfEmpty(validatedData.startTime),
        venueId: toNullIfEmpty(validatedData.venueId),
        location: validatedData.location,
        address: toNullIfEmpty(validatedData.address),
        adultsCount: validatedData.adultsCount ?? null,
        childrenCount: validatedData.childrenCount ?? null,
        vegetarianCount: validatedData.vegetarianCount ?? null,
        contactName: toNullIfEmpty(validatedData.contactName),
        contactPhone: toNullIfEmpty(validatedData.contactPhone),
        eventType: validatedData.eventType,
        totalAmount: validatedData.totalAmount ?? null,
        depositAmount: validatedData.depositAmount ?? null,
        depositMethod: toNullIfEmpty(validatedData.depositMethod),
        depositDate: toDateOrNull(validatedData.depositDate),
        balanceAmount: balanceAmount ?? null,
        balanceMethod: toNullIfEmpty(validatedData.balanceMethod),
        balanceDate: toDateOrNull(validatedData.balanceDate),
        notes: toNullIfEmpty(validatedData.notes),
        status: status,
      },
      include: {
        venue: true,
      },
    });

    // Convert Decimal to number for JSON serialization
    const serializedEvent = {
      ...updatedEvent,
      totalAmount: updatedEvent.totalAmount ? Number(updatedEvent.totalAmount) : null,
      depositAmount: updatedEvent.depositAmount ? Number(updatedEvent.depositAmount) : null,
      balanceAmount: updatedEvent.balanceAmount ? Number(updatedEvent.balanceAmount) : null,
    };

    return NextResponse.json({ event: serializedEvent }, { status: 200 });
  } catch (error) {
    console.error("Error updating event:", error);

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

/**
 * DELETE /api/v1/events/[id]
 * Delete an event by ID (Manager only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManager();

    const { id } = await params;

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "找不到活動資料" }, { status: 404 });
    }

    // Delete event
    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting event:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden: Manager role required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

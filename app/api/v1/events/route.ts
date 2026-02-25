import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { createEventSchema } from "@/lib/validations/event";
import { z } from "zod";

/**
 * GET /api/v1/events
 * Get all events (Manager only)
 * Supports: ?status=CONFIRMED&type=WEDDING&sort=asc
 */
export async function GET(request: NextRequest) {
  try {
    await requireManager();

    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get("status");
    const typeFilter = searchParams.get("type");
    const sortOrder = searchParams.get("sort") || "asc"; // 預設日期由近至遠

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
      orderBy: { date: sortOrder === "desc" ? "desc" : "asc" },
      include: {
        venue: true,
      },
    });

    // Convert Decimal to number for JSON serialization
    const serializedEvents = events.map((event) => ({
      ...event,
      totalAmount: event.totalAmount ? Number(event.totalAmount) : null,
      depositAmount: event.depositAmount ? Number(event.depositAmount) : null,
      balanceAmount: event.balanceAmount ? Number(event.balanceAmount) : null,
    }));

    return NextResponse.json({ events: serializedEvents }, { status: 200 });
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

    const event = await prisma.event.create({
      data: {
        name: validatedData.name,
        date: new Date(validatedData.date),
        startTime: validatedData.startTime || null,
        venueId: validatedData.venueId || null,
        location: validatedData.location,
        address: validatedData.address || null,
        adultsCount: validatedData.adultsCount || null,
        childrenCount: validatedData.childrenCount || null,
        vegetarianCount: validatedData.vegetarianCount || null,
        contactName: validatedData.contactName || null,
        contactPhone: validatedData.contactPhone || null,
        eventType: validatedData.eventType,
        totalAmount: validatedData.totalAmount || null,
        depositAmount: validatedData.depositAmount || null,
        depositMethod: validatedData.depositMethod || null,
        depositDate: validatedData.depositDate ? new Date(validatedData.depositDate) : null,
        balanceAmount: balanceAmount || null,
        balanceMethod: validatedData.balanceMethod || null,
        balanceDate: validatedData.balanceDate ? new Date(validatedData.balanceDate) : null,
        notes: validatedData.notes || null,
        status: status,
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

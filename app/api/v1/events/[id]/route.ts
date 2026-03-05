import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrAbove } from "@/lib/auth";
import { updateEventSchema } from "@/lib/validations/event";
import { z } from "zod";

/**
 * GET /api/v1/events/[id]
 * Get a single event by ID (Admin or Manager)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrAbove();

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
 * Update an event by ID (Admin or Manager)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrAbove();

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

    // 檢測關鍵欄位變更（用於通知）
    const criticalFields = ['date', 'assemblyTime', 'mealTime', 'location', 'address'];
    const changes: { field: string; oldValue: string | null; newValue: string | null }[] = [];
    
    const formatDate = (d: Date | string | null | undefined) => {
      if (!d) return null;
      const date = typeof d === 'string' ? new Date(d) : d;
      return date.toISOString().split('T')[0];
    };

    // 比對日期
    const oldDate = formatDate(existingEvent.date);
    const newDate = formatDate(validatedData.date);
    if (oldDate !== newDate && newDate) {
      changes.push({ field: 'date', oldValue: oldDate, newValue: newDate });
    }

    // 比對集合時間
    if (existingEvent.assemblyTime !== (validatedData.assemblyTime || null)) {
      changes.push({ 
        field: 'assemblyTime', 
        oldValue: existingEvent.assemblyTime, 
        newValue: validatedData.assemblyTime || null 
      });
    }

    // 比對用餐時間
    if (existingEvent.mealTime !== (validatedData.mealTime || null)) {
      changes.push({ 
        field: 'mealTime', 
        oldValue: existingEvent.mealTime, 
        newValue: validatedData.mealTime || null 
      });
    }

    // 比對地點
    if (existingEvent.location !== validatedData.location) {
      changes.push({ 
        field: 'location', 
        oldValue: existingEvent.location, 
        newValue: validatedData.location || null 
      });
    }

    // 比對地址
    if (existingEvent.address !== (validatedData.address || null)) {
      changes.push({ 
        field: 'address', 
        oldValue: existingEvent.address, 
        newValue: validatedData.address || null 
      });
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
        assemblyTime: toNullIfEmpty(validatedData.assemblyTime),
        startTime: toNullIfEmpty(validatedData.startTime),
        mealTime: toNullIfEmpty(validatedData.mealTime),
        venueId: toNullIfEmpty(validatedData.venueId),
        location: validatedData.location,
        address: toNullIfEmpty(validatedData.address),
        adultsCount: validatedData.adultsCount ?? null,
        childrenCount: validatedData.childrenCount ?? null,
        vegetarianCount: validatedData.vegetarianCount ?? null,
        contactName: toNullIfEmpty(validatedData.contactName),
        contactPhone: toNullIfEmpty(validatedData.contactPhone),
        eventType: validatedData.eventType,
        requireBigTruck: validatedData.requireBigTruck ?? false,
        requireSmallTruck: validatedData.requireSmallTruck ?? false,
        menu: toNullIfEmpty(validatedData.menu),
        reminders: toNullIfEmpty(validatedData.reminders),
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

    // 取得已通知的員工數量
    const notifiedStaffCount = await prisma.eventStaff.count({
      where: { eventId: id, notified: true },
    });

    // Convert Decimal to number for JSON serialization
    const serializedEvent = {
      ...updatedEvent,
      totalAmount: updatedEvent.totalAmount ? Number(updatedEvent.totalAmount) : null,
      depositAmount: updatedEvent.depositAmount ? Number(updatedEvent.depositAmount) : null,
      balanceAmount: updatedEvent.balanceAmount ? Number(updatedEvent.balanceAmount) : null,
    };

    return NextResponse.json({ 
      event: serializedEvent,
      changes: changes.length > 0 ? changes : null,
      notifiedStaffCount,
    }, { status: 200 });
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
 * Delete an event by ID (Admin or Manager)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrAbove();

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

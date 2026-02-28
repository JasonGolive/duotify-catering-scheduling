import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { staffAvailabilitySchema } from "@/lib/validations/event";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/staff/[id]/availability - Get staff availability for date range
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: staffId } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    // Build where clause
    const whereClause: {
      staffId: string;
      date?: { gte?: Date; lte?: Date };
    } = { staffId };
    
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    const availability = await prisma.staffAvailability.findMany({
      where: whereClause,
      orderBy: { date: "asc" },
    });

    // Convert dates to ISO string
    const result = availability.map((a) => ({
      ...a,
      date: a.date.toISOString().split("T")[0],
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching staff availability:", error);
    return NextResponse.json(
      { error: "無法取得員工可用時間" },
      { status: 500 }
    );
  }
}

// POST /api/v1/staff/[id]/availability - Set availability for a date
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: staffId } = await params;
    const body = await request.json();
    
    const validationResult = staffAvailabilitySchema.safeParse({
      ...body,
      staffId,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "驗證失敗", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { date, available, reason } = validationResult.data;
    const dateObj = new Date(date);

    // Upsert availability record
    const availability = await prisma.staffAvailability.upsert({
      where: {
        staffId_date: {
          staffId,
          date: dateObj,
        },
      },
      update: {
        available,
        reason,
      },
      create: {
        staffId,
        date: dateObj,
        available,
        reason,
      },
    });

    return NextResponse.json({
      ...availability,
      date: availability.date.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Error setting staff availability:", error);
    return NextResponse.json(
      { error: "無法設定員工可用時間" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/staff/[id]/availability - Remove availability record
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: staffId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "日期為必填" },
        { status: 400 }
      );
    }

    await prisma.staffAvailability.delete({
      where: {
        staffId_date: {
          staffId,
          date: new Date(date),
        },
      },
    });

    return NextResponse.json({ message: "可用性記錄已刪除" });
  } catch (error) {
    console.error("Error deleting staff availability:", error);
    return NextResponse.json(
      { error: "無法刪除可用性記錄" },
      { status: 500 }
    );
  }
}

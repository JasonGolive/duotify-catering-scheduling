import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateVenueSchema } from "@/lib/validations/event";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/venues/[id] - Get a specific venue
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        _count: {
          select: { events: true },
        },
      },
    });

    if (!venue) {
      return NextResponse.json(
        { error: "找不到此場地" },
        { status: 404 }
      );
    }

    return NextResponse.json(venue);
  } catch (error) {
    console.error("Error fetching venue:", error);
    return NextResponse.json(
      { error: "無法取得場地資料" },
      { status: 500 }
    );
  }
}

// PUT /api/v1/venues/[id] - Update a venue
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const validationResult = updateVenueSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "驗證失敗", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const venue = await prisma.venue.update({
      where: { id },
      data: validationResult.data,
    });

    return NextResponse.json(venue);
  } catch (error) {
    console.error("Error updating venue:", error);
    return NextResponse.json(
      { error: "無法更新場地" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/venues/[id] - Delete a venue (soft delete by setting isActive to false)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Check if venue has events
    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        _count: {
          select: { events: true },
        },
      },
    });

    if (!venue) {
      return NextResponse.json(
        { error: "找不到此場地" },
        { status: 404 }
      );
    }

    // If venue has events, soft delete (set isActive to false)
    if (venue._count.events > 0) {
      await prisma.venue.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ message: "場地已停用（因有關聯活動）" });
    }

    // If no events, hard delete
    await prisma.venue.delete({
      where: { id },
    });

    return NextResponse.json({ message: "場地已刪除" });
  } catch (error) {
    console.error("Error deleting venue:", error);
    return NextResponse.json(
      { error: "無法刪除場地" },
      { status: 500 }
    );
  }
}

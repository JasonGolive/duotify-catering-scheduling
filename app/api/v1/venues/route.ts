import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { venueSchema } from "@/lib/validations/event";

// GET /api/v1/venues - List all venues
export async function GET() {
  try {
    const venues = await prisma.venue.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(venues);
  } catch (error) {
    console.error("Error fetching venues:", error);
    return NextResponse.json(
      { error: "無法取得場地列表" },
      { status: 500 }
    );
  }
}

// POST /api/v1/venues - Create a new venue
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = venueSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "驗證失敗", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const venue = await prisma.venue.create({
      data: validationResult.data,
    });

    return NextResponse.json(venue, { status: 201 });
  } catch (error) {
    console.error("Error creating venue:", error);
    return NextResponse.json(
      { error: "無法新增場地" },
      { status: 500 }
    );
  }
}

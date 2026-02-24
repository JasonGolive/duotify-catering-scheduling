import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { createStaffSchema } from "@/lib/validations/staff";
import { normalizePhone } from "@/lib/utils";

/**
 * GET /api/v1/staff
 * Get all staff members (Manager only)
 * Query params: status (optional) - filter by ACTIVE or INACTIVE
 */
export async function GET(request: NextRequest) {
  try {
    // Require manager role
    await requireManager();

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get("status");

    // Build where clause
    const where: any = {};
    if (statusFilter && (statusFilter === "ACTIVE" || statusFilter === "INACTIVE")) {
      where.status = statusFilter;
    }

    // Fetch staff from database
    const staff = await prisma.staff.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ staff }, { status: 200 });
  } catch (error) {
    console.error("Error fetching staff:", error);

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
 * POST /api/v1/staff
 * Create a new staff member (Manager only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require manager role
    await requireManager();

    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = createStaffSchema.parse(body);

    // Normalize phone number
    const normalizedPhone = normalizePhone(validatedData.phone);

    // Check for duplicate phone number
    const existingStaff = await prisma.staff.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: "A staff member with this phone number already exists" },
        { status: 409 }
      );
    }

    // Create staff member
    const staff = await prisma.staff.create({
      data: {
        name: validatedData.name,
        phone: normalizedPhone,
        skill: validatedData.skill || "FRONT",
        perEventSalary: validatedData.perEventSalary,
        notes: validatedData.notes || null,
        status: validatedData.status,
      },
    });

    return NextResponse.json({ staff }, { status: 201 });
  } catch (error) {
    console.error("Error creating staff:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden: Manager role required" }, { status: 403 });
    }

    // Validation errors
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

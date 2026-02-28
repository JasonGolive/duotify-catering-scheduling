import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { z } from "zod";

const updateStaffSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(10).regex(/^[\d\s\-+()]+$/).optional(),
  skill: z.enum(["FRONT", "HOT", "BOTH"]).optional(),
  perEventSalary: z.number().positive().max(1000000).optional(),
  notes: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

/**
 * GET /api/v1/staff/[id]
 * Get a single staff member by ID (Manager only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require manager role
    await requireManager();

    const { id } = await params;

    // Fetch staff by ID
    const staff = await prisma.staff.findUnique({
      where: { id },
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

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

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
 * PUT /api/v1/staff/[id]
 * Update a staff member by ID (Manager only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManager();

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = updateStaffSchema.parse(body);

    // Check if staff exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!existingStaff) {
      return NextResponse.json({ error: "找不到員工資料" }, { status: 404 });
    }

    // Check for duplicate phone if phone is being updated
    if (validatedData.phone && validatedData.phone !== existingStaff.phone) {
      const phoneExists = await prisma.staff.findUnique({
        where: { phone: validatedData.phone },
      });

      if (phoneExists) {
        return NextResponse.json({ error: "此電話號碼已被使用" }, { status: 409 });
      }
    }

    // Update staff
    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: {
        ...validatedData,
        perEventSalary: validatedData.perEventSalary,
      },
    });

    return NextResponse.json({ staff: updatedStaff }, { status: 200 });
  } catch (error) {
    console.error("Error updating staff:", error);

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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";

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

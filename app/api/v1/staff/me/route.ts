import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getCurrentSession } from "@/lib/auth";

/**
 * GET /api/v1/staff/me
 * Get the current user's staff profile (Staff role)
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth();

    // Get current user ID from Clerk session
    const { userId } = await getCurrentSession();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch staff profile by user ID
    const staff = await prisma.staff.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        phone: true,
        perEventSalary: true,
        notes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff profile not found. Please contact your manager." },
        { status: 404 }
      );
    }

    return NextResponse.json({ staff }, { status: 200 });
  } catch (error) {
    console.error("Error fetching own profile:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

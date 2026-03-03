import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { createSalaryRuleSchema } from "@/lib/validations/salary-rule";
import { Prisma } from "@prisma/client";

/**
 * GET /api/v1/salary-rules
 * Get all salary rules (Manager only)
 * Query params: isActive (optional) - filter by active status
 */
export async function GET(request: NextRequest) {
  try {
    await requireManager();

    const searchParams = request.nextUrl.searchParams;
    const isActiveFilter = searchParams.get("isActive");

    const where: Record<string, boolean> = {};
    if (isActiveFilter !== null) {
      where.isActive = isActiveFilter === "true";
    }

    const rules = await prisma.salaryRule.findMany({
      where,
      orderBy: [
        { priority: "desc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({ rules }, { status: 200 });
  } catch (error) {
    console.error("Error fetching salary rules:", error);

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
 * POST /api/v1/salary-rules
 * Create a new salary rule (Manager only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireManager();

    const body = await request.json();
    const validatedData = createSalaryRuleSchema.parse(body);

    const rule = await prisma.salaryRule.create({
      data: {
        name: validatedData.name,
        type: validatedData.type,
        value: validatedData.value,
        condition: validatedData.condition as Prisma.InputJsonValue,
        isActive: validatedData.isActive,
        priority: validatedData.priority,
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error("Error creating salary rule:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden: Manager role required" }, { status: 403 });
    }

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

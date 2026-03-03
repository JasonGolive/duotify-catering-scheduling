import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { updateSalaryRuleSchema } from "@/lib/validations/salary-rule";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/salary-rules/[id]
 * Get a single salary rule by ID (Manager only)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await requireManager();

    const { id } = await params;

    const rule = await prisma.salaryRule.findUnique({
      where: { id },
    });

    if (!rule) {
      return NextResponse.json({ error: "Salary rule not found" }, { status: 404 });
    }

    return NextResponse.json({ rule }, { status: 200 });
  } catch (error) {
    console.error("Error fetching salary rule:", error);

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
 * PUT /api/v1/salary-rules/[id]
 * Update a salary rule (Manager only)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await requireManager();

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateSalaryRuleSchema.parse(body);

    // Check if rule exists
    const existingRule = await prisma.salaryRule.findUnique({
      where: { id },
    });

    if (!existingRule) {
      return NextResponse.json({ error: "Salary rule not found" }, { status: 404 });
    }

    const updateData: Prisma.SalaryRuleUpdateInput = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.value !== undefined) updateData.value = validatedData.value;
    if (validatedData.condition !== undefined) updateData.condition = validatedData.condition as Prisma.InputJsonValue;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority;

    const rule = await prisma.salaryRule.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ rule }, { status: 200 });
  } catch (error) {
    console.error("Error updating salary rule:", error);

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

/**
 * DELETE /api/v1/salary-rules/[id]
 * Delete a salary rule (Manager only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await requireManager();

    const { id } = await params;

    // Check if rule exists
    const existingRule = await prisma.salaryRule.findUnique({
      where: { id },
    });

    if (!existingRule) {
      return NextResponse.json({ error: "Salary rule not found" }, { status: 404 });
    }

    await prisma.salaryRule.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Salary rule deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting salary rule:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden: Manager role required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

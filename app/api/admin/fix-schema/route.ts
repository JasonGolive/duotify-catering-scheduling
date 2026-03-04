import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/admin/fix-schema
 * One-time fix to add missing notes column
 */
export async function POST() {
  try {
    // Add notes column if it doesn't exist
    await prisma.$executeRaw`
      ALTER TABLE "AvailabilityToken" 
      ADD COLUMN IF NOT EXISTS "notes" VARCHAR(600);
    `;

    console.log("✅ Schema fix applied: notes column added to AvailabilityToken");

    return NextResponse.json({
      success: true,
      message: "Schema fix applied successfully",
    });
  } catch (error) {
    console.error("❌ Schema fix error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/fix-schema
 * Check if fix is needed
 */
export async function GET() {
  try {
    // Try to query the notes column
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'AvailabilityToken' 
      AND column_name = 'notes';
    `;

    const notesExists = Array.isArray(result) && result.length > 0;

    return NextResponse.json({
      notesColumnExists: notesExists,
      needsFix: !notesExists,
    });
  } catch (error) {
    console.error("Error checking schema:", error);
    return NextResponse.json(
      { error: "Failed to check schema" },
      { status: 500 }
    );
  }
}

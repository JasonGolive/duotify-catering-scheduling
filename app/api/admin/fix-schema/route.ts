import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/admin/fix-schema
 * One-time fix to add missing notes column
 */
export async function POST() {
  try {
    // Use the correct table name: availability_tokens (lowercase with underscore)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE availability_tokens 
      ADD COLUMN IF NOT EXISTS notes VARCHAR(600);
    `);

    console.log("✅ Schema fix applied: notes column added to availability_tokens");

    return NextResponse.json({
      success: true,
      message: "Schema fix applied successfully - notes column added to availability_tokens",
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
    // Check if notes column exists in availability_tokens table
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'availability_tokens' 
      AND column_name = 'notes';
    `;

    const notesExists = Array.isArray(columns) && columns.length > 0;

    return NextResponse.json({
      tableExists: true,
      tableName: "availability_tokens",
      notesColumnExists: notesExists,
      needsFix: !notesExists,
      columnInfo: notesExists ? columns : null,
    });
  } catch (error) {
    console.error("Error checking schema:", error);
    return NextResponse.json(
      { 
        error: "Failed to check schema",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

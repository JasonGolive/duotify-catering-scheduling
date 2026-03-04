import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/admin/fix-schema
 * One-time fix to add missing notes column
 */
export async function POST() {
  try {
    // Try different table name variations (Prisma uses PascalCase, Postgres might use snake_case)
    const queries = [
      `ALTER TABLE "AvailabilityToken" ADD COLUMN IF NOT EXISTS "notes" VARCHAR(600);`,
      `ALTER TABLE availability_token ADD COLUMN IF NOT EXISTS notes VARCHAR(600);`,
      `ALTER TABLE "availabilitytoken" ADD COLUMN IF NOT EXISTS "notes" VARCHAR(600);`,
    ];

    let success = false;
    let lastError = null;

    for (const query of queries) {
      try {
        await prisma.$executeRawUnsafe(query);
        console.log(`✅ Schema fix applied with query: ${query}`);
        success = true;
        break;
      } catch (error) {
        lastError = error;
        console.log(`⚠️ Query failed: ${query}`, error instanceof Error ? error.message : error);
      }
    }

    if (!success) {
      throw lastError || new Error("All queries failed");
    }

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
    // Check which table name exists and if notes column exists
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (
        table_name = 'AvailabilityToken' 
        OR table_name = 'availability_token'
        OR table_name = 'availabilitytoken'
      );
    `;

    const tableExists = Array.isArray(tables) && tables.length > 0;
    
    if (!tableExists) {
      return NextResponse.json({
        tableExists: false,
        error: "AvailabilityToken table not found in any case variation",
      });
    }

    const tableName = (tables as any)[0].table_name;

    // Check if notes column exists
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${tableName}' 
      AND column_name IN ('notes', 'Notes');
    `);

    const notesExists = Array.isArray(columns) && columns.length > 0;

    return NextResponse.json({
      tableExists: true,
      tableName,
      notesColumnExists: notesExists,
      needsFix: !notesExists,
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

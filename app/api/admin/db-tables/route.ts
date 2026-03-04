import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/db-tables
 * List all tables in the database
 */
export async function GET() {
  try {
    // Get all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name, table_schema
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    // Get columns for tables that might be AvailabilityToken
    const availabilityTables = (tables as any[]).filter((t: any) => 
      t.table_name.toLowerCase().includes('availability')
    );

    const tableDetails = [];
    for (const table of availabilityTables) {
      const columns = await prisma.$queryRawUnsafe(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = '${table.table_name}'
        ORDER BY ordinal_position;
      `);
      
      tableDetails.push({
        tableName: table.table_name,
        columns: columns,
      });
    }

    return NextResponse.json({
      allTables: (tables as any[]).map((t: any) => t.table_name),
      availabilityTables: tableDetails,
    });
  } catch (error) {
    console.error("Error listing tables:", error);
    return NextResponse.json(
      { 
        error: "Failed to list tables",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

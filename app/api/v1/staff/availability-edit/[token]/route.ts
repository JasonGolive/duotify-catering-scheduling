import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

type RouteParams = {
  params: Promise<{ token: string }>;
};

// GET /api/v1/staff/availability-edit/[token] - Get token info and availability
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;

    const availabilityToken = await prisma.availabilityToken.findUnique({
      where: { token },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            availability: {
              where: {
                date: {
                  gte: new Date(new Date().getFullYear(), 0, 1), // Start of current year
                  lte: new Date(new Date().getFullYear() + 1, 11, 31), // End of next year
                },
              },
            },
          },
        },
      },
    });

    if (!availabilityToken) {
      return NextResponse.json(
        { error: "無效的連結" },
        { status: 404 }
      );
    }

    // Check expiration
    if (new Date() > new Date(availabilityToken.expiresAt)) {
      return NextResponse.json(
        { error: "連結已過期，請聯繫管理員取得新連結" },
        { status: 410 }
      );
    }

    // Filter availability for the specific month
    const monthStart = new Date(availabilityToken.year, availabilityToken.month - 1, 1);
    const monthEnd = new Date(availabilityToken.year, availabilityToken.month, 0);

    const availability = availabilityToken.staff.availability
      .filter((a) => {
        const d = new Date(a.date);
        return d >= monthStart && d <= monthEnd;
      })
      .map((a) => ({
        ...a,
        date: new Date(a.date).toISOString().split("T")[0],
      }));

    return NextResponse.json({
      tokenInfo: {
        id: availabilityToken.id,
        staffId: availabilityToken.staffId,
        staffName: availabilityToken.staff.name,
        month: availabilityToken.month,
        year: availabilityToken.year,
        expiresAt: availabilityToken.expiresAt.toISOString(),
        completedAt: availabilityToken.completedAt?.toISOString() || null,
      },
      availability,
    });
  } catch (error) {
    console.error("Error fetching availability token:", error);
    return NextResponse.json(
      { error: "無法取得資料" },
      { status: 500 }
    );
  }
}

// POST /api/v1/staff/availability-edit/[token] - Update single date availability
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { date, available, reason } = body as {
      date: string;
      available: boolean;
      reason?: string;
    };

    // Validate token
    const availabilityToken = await prisma.availabilityToken.findUnique({
      where: { token },
      include: { staff: { select: { id: true, name: true } } },
    });

    if (!availabilityToken) {
      return NextResponse.json({ error: "無效的連結" }, { status: 404 });
    }

    if (new Date() > new Date(availabilityToken.expiresAt)) {
      return NextResponse.json({ error: "連結已過期" }, { status: 410 });
    }

    // Get IP address for logging
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || 
                      headersList.get("x-real-ip") || 
                      "unknown";

    // Update availability
    const record = await prisma.staffAvailability.upsert({
      where: {
        staffId_date: {
          staffId: availabilityToken.staffId,
          date: new Date(date),
        },
      },
      update: { available, reason: reason || null },
      create: {
        staffId: availabilityToken.staffId,
        date: new Date(date),
        available,
        reason: reason || null,
      },
    });

    // Create log entry
    await prisma.availabilityLog.create({
      data: {
        staffId: availabilityToken.staffId,
        date: new Date(date),
        available,
        reason: reason || null,
        editedBy: "STAFF",
        ipAddress,
      },
    });

    return NextResponse.json({
      record: {
        ...record,
        date: new Date(record.date).toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}

// PUT /api/v1/staff/availability-edit/[token] - Bulk update availability
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { dates, available, reason } = body as {
      dates: string[];
      available: boolean;
      reason?: string;
    };

    // Validate token
    const availabilityToken = await prisma.availabilityToken.findUnique({
      where: { token },
    });

    if (!availabilityToken) {
      return NextResponse.json({ error: "無效的連結" }, { status: 404 });
    }

    if (new Date() > new Date(availabilityToken.expiresAt)) {
      return NextResponse.json({ error: "連結已過期" }, { status: 410 });
    }

    // Get IP address
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || 
                      headersList.get("x-real-ip") || 
                      "unknown";

    // Bulk upsert using transaction
    const records = await prisma.$transaction([
      // Upsert all availability records
      ...dates.map((date: string) =>
        prisma.staffAvailability.upsert({
          where: {
            staffId_date: {
              staffId: availabilityToken.staffId,
              date: new Date(date),
            },
          },
          update: { available, reason: reason || null },
          create: {
            staffId: availabilityToken.staffId,
            date: new Date(date),
            available,
            reason: reason || null,
          },
        })
      ),
      // Create log entries
      ...dates.map((date: string) =>
        prisma.availabilityLog.create({
          data: {
            staffId: availabilityToken.staffId,
            date: new Date(date),
            available,
            reason: reason || null,
            editedBy: "STAFF",
            ipAddress,
          },
        })
      ),
    ]);

    // Extract only the availability records (first half of results)
    const availabilityRecords = records.slice(0, dates.length);

    return NextResponse.json({
      updated: dates.length,
      records: availabilityRecords.map((r) => ({
        ...r,
        date: new Date(r.date).toISOString().split("T")[0],
      })),
    });
  } catch (error) {
    console.error("Error bulk updating availability:", error);
    return NextResponse.json({ error: "批量更新失敗" }, { status: 500 });
  }
}

// DELETE /api/v1/staff/availability-edit/[token] - Clear all availability for the month
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;

    const availabilityToken = await prisma.availabilityToken.findUnique({
      where: { token },
    });

    if (!availabilityToken) {
      return NextResponse.json({ error: "無效的連結" }, { status: 404 });
    }

    // Check expiration
    if (new Date() > new Date(availabilityToken.expiresAt)) {
      return NextResponse.json(
        { error: "連結已過期" },
        { status: 410 }
      );
    }

    // Delete all availability records for this month
    const monthStart = new Date(availabilityToken.year, availabilityToken.month - 1, 1);
    const monthEnd = new Date(availabilityToken.year, availabilityToken.month, 0, 23, 59, 59);

    const deletedCount = await prisma.staffAvailability.deleteMany({
      where: {
        staffId: availabilityToken.staffId,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

    // Log the clear action
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    
    await prisma.availabilityLog.create({
      data: {
        staffId: availabilityToken.staffId,
        date: monthStart,
        available: false,
        reason: `清除重填 ${availabilityToken.year}/${availabilityToken.month} 月份行事曆`,
        editedBy: "STAFF",
        ipAddress,
      },
    });

    console.log(`✅ Cleared ${deletedCount.count} availability records for staff ${availabilityToken.staffId} (${availabilityToken.year}/${availabilityToken.month})`);

    return NextResponse.json({
      success: true,
      deletedCount: deletedCount.count,
      message: "已清除所有行事曆記錄",
    });
  } catch (error) {
    console.error("Error clearing availability:", error);
    return NextResponse.json({ error: "清除失敗" }, { status: 500 });
  }
}

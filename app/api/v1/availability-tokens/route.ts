import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

// GET /api/v1/availability-tokens - List all tokens (for management dashboard)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: Record<string, unknown> = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    const tokens = await prisma.availabilityToken.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            phone: true,
            lineUserId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tokens);
  } catch (error) {
    console.error("Error fetching availability tokens:", error);
    return NextResponse.json(
      { error: "無法取得可用性 Token 列表" },
      { status: 500 }
    );
  }
}

// POST /api/v1/availability-tokens - Create and send tokens to staff
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { staffIds, month, year, expiresInDays = 7, sendNotification = true } = body as {
      staffIds: string[];
      month: number;
      year: number;
      expiresInDays?: number;
      sendNotification?: boolean;
    };

    if (!staffIds || !Array.isArray(staffIds) || staffIds.length === 0) {
      return NextResponse.json(
        { error: "staffIds 陣列為必填" },
        { status: 400 }
      );
    }

    if (!month || !year) {
      return NextResponse.json(
        { error: "month 和 year 為必填" },
        { status: 400 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const results = [];
    const errors = [];

    for (const staffId of staffIds) {
      try {
        // Generate unique token
        const token = crypto.randomBytes(32).toString("hex");

        // Upsert the token (create or update if exists)
        const availabilityToken = await prisma.availabilityToken.upsert({
          where: {
            staffId_month_year: { staffId, month, year },
          },
          update: {
            token,
            expiresAt,
            sentAt: sendNotification ? new Date() : null,
            completedAt: null, // Reset completion status
          },
          create: {
            staffId,
            month,
            year,
            token,
            expiresAt,
            sentAt: sendNotification ? new Date() : null,
          },
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                phone: true,
                lineUserId: true,
                lineNotify: true,
              },
            },
          },
        });

        // Send LINE notification if enabled
        if (sendNotification && availabilityToken.staff.lineUserId && availabilityToken.staff.lineNotify) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://duotify-catering-scheduling-production.up.railway.app";
          const editUrl = `${baseUrl}/staff/availability/${token}`;
          
          const message = `📅 ${year}年${month}月行事曆填寫通知\n\n請點擊以下連結填寫您的可出勤時間：\n${editUrl}\n\n⏰ 填寫期限：${expiresAt.toLocaleDateString("zh-TW")}\n\n請盡早填寫，謝謝！`;

          try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/line/send`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: availabilityToken.staff.lineUserId,
                message,
              }),
            });
          } catch (lineError) {
            console.error("Failed to send LINE notification:", lineError);
          }
        }

        results.push(availabilityToken);
      } catch (err) {
        console.error(`Error creating token for staff ${staffId}:`, err);
        errors.push({ staffId, error: "建立 Token 失敗" });
      }
    }

    return NextResponse.json({
      success: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error) {
    console.error("Error creating availability tokens:", error);
    return NextResponse.json(
      { error: "無法建立可用性 Token" },
      { status: 500 }
    );
  }
}

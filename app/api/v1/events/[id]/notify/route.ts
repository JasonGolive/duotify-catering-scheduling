import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { sendNotification } from "@/lib/services/notification";

/**
 * POST /api/v1/events/[id]/notify
 * 發送排班通知給尚未通知的員工
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManager();
    const { id: eventId } = await params;

    // 取得活動資訊
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "找不到活動" }, { status: 404 });
    }

    // 取得尚未通知的指派人員
    const unnotifiedStaff = await prisma.eventStaff.findMany({
      where: {
        eventId,
        notified: false,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            lineUserId: true,
            email: true,
            lineNotify: true,
            emailNotify: true,
          },
        },
      },
    });

    if (unnotifiedStaff.length === 0) {
      return NextResponse.json({
        message: "所有人員皆已通知",
        sent: 0,
        failed: 0,
      });
    }

    // 格式化日期
    const dateStr = event.date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
    const timeStr = event.assemblyTime || event.startTime || "待確認";
    
    // 取得網站 URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const detailUrl = event.staffToken 
      ? `${baseUrl}/staff/event/${event.staffToken}`
      : null;
    
    // 人數資訊
    const guestInfo = [
      event.adultsCount ? `${event.adultsCount}大` : null,
      event.childrenCount ? `${event.childrenCount}小` : null,
      event.vegetarianCount ? `(含${event.vegetarianCount}素)` : null,
    ].filter(Boolean).join("");

    let sent = 0;
    let failed = 0;
    const results: Array<{ staffId: string; staffName: string; success: boolean; error?: string }> = [];

    // 逐一發送通知
    for (const es of unnotifiedStaff) {
      try {
        const result = await sendNotification({
          staffId: es.staff.id,
          eventId: event.id,
          type: "ASSIGNMENT",
          title: `【排班通知】${event.name}`,
          content: `${es.staff.name} 您好，

您已被指派到以下活動：

📅 ${dateStr}
⏰ 集合時間：${timeStr}
${event.mealTime ? `🍽️ 用餐時間：${event.mealTime}` : ""}
📍 ${event.location}
${event.address ? `   ${event.address}` : ""}
${guestInfo ? `👥 人數：${guestInfo}` : ""}
${event.reminders ? `\n⚠️ 提醒：\n${event.reminders}` : ""}
${detailUrl ? `\n📋 詳細資訊：\n${detailUrl}` : ""}

如有問題請盡快聯繫管理員。`,
        });

        // 更新通知狀態
        const success = result.line.sent || result.email.sent;
        if (success) {
          await prisma.eventStaff.update({
            where: { id: es.id },
            data: {
              notified: true,
              notifiedAt: new Date(),
            },
          });
          sent++;
        } else {
          failed++;
        }

        results.push({
          staffId: es.staff.id,
          staffName: es.staff.name,
          success,
          error: success ? undefined : "LINE 和 Email 都發送失敗",
        });
      } catch (error) {
        console.error(`Failed to notify ${es.staff.name}:`, error);
        failed++;
        results.push({
          staffId: es.staff.id,
          staffName: es.staff.name,
          success: false,
          error: error instanceof Error ? error.message : "發送失敗",
        });
      }
    }

    return NextResponse.json({
      message: `已發送 ${sent} 筆通知${failed > 0 ? `，${failed} 筆失敗` : ""}`,
      sent,
      failed,
      total: unnotifiedStaff.length,
      results,
    });
  } catch (error) {
    console.error("Error sending notifications:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/v1/events/[id]/notify
 * 取得活動的通知狀態
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManager();
    const { id: eventId } = await params;

    // 統計通知狀態
    const stats = await prisma.eventStaff.groupBy({
      by: ["notified"],
      where: { eventId },
      _count: true,
    });

    const notified = stats.find((s) => s.notified)?._count || 0;
    const pending = stats.find((s) => !s.notified)?._count || 0;

    // 取得詳細清單
    const staffList = await prisma.eventStaff.findMany({
      where: { eventId },
      select: {
        id: true,
        notified: true,
        notifiedAt: true,
        staff: {
          select: {
            id: true,
            name: true,
            lineUserId: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      notified,
      pending,
      total: notified + pending,
      staffList: staffList.map((s) => ({
        id: s.id,
        staffId: s.staff.id,
        name: s.staff.name,
        hasLine: !!s.staff.lineUserId,
        hasEmail: !!s.staff.email,
        notified: s.notified,
        notifiedAt: s.notifiedAt,
      })),
    });
  } catch (error) {
    console.error("Error getting notification status:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

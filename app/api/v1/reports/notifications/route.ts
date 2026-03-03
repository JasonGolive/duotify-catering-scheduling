import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// GET: 通知記錄報表匯出
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const channel = searchParams.get("channel"); // LINE or EMAIL
    const status = searchParams.get("status"); // sent or pending

    // 建立查詢條件
    const where: Record<string, unknown> = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        // 設定為當日結束
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, Date>).lte = end;
      }
    }

    if (channel) {
      const upperChannel = channel.toUpperCase();
      if (upperChannel === "LINE" || upperChannel === "EMAIL") {
        where.channel = upperChannel;
      }
    }

    if (status) {
      const lowerStatus = status.toLowerCase();
      if (lowerStatus === "sent") {
        where.status = "SENT";
      } else if (lowerStatus === "pending") {
        where.status = "PENDING";
      } else if (lowerStatus === "failed") {
        where.status = "FAILED";
      }
    }

    // 取得通知記錄
    const notifications = await prisma.notification.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            lineUserId: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            location: true,
            assemblyTime: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    // 轉換資料格式
    const records = notifications.map((n) => ({
      id: n.id,
      // 活動資訊
      eventId: n.eventId,
      eventName: n.event?.name || null,
      eventDate: n.event?.date?.toISOString().split("T")[0] || null,
      eventLocation: n.event?.location || null,
      eventAssemblyTime: n.event?.assemblyTime || null,
      // 員工資訊
      staffId: n.staffId,
      staffName: n.staff.name,
      staffPhone: n.staff.phone,
      staffEmail: n.staff.email || null,
      staffLineUserId: n.staff.lineUserId || null,
      // 通知資訊
      type: n.type,
      channel: n.channel,
      title: n.title,
      content: n.content,
      // 發送狀態
      status: n.status,
      sentAt: n.sentAt?.toISOString() || null,
      error: n.error,
      createdAt: n.createdAt.toISOString(),
    }));

    // 統計摘要
    const summary = {
      total: records.length,
      byStatus: {
        sent: records.filter((r) => r.status === "SENT").length,
        pending: records.filter((r) => r.status === "PENDING").length,
        failed: records.filter((r) => r.status === "FAILED").length,
      },
      byChannel: {
        LINE: records.filter((r) => r.channel === "LINE").length,
        EMAIL: records.filter((r) => r.channel === "EMAIL").length,
      },
    };

    return NextResponse.json({
      records,
      summary,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        channel: channel || null,
        status: status || null,
      },
    });
  } catch (error) {
    console.error("Notification report error:", error);
    return NextResponse.json({ error: "取得通知報表失敗" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { notifyEventStaff, sendNotification } from "@/lib/services/notification";

// GET: 取得通知記錄列表
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const staffId = searchParams.get("staffId");
    const eventId = searchParams.get("eventId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (staffId) where.staffId = staffId;
    if (eventId) where.eventId = eventId;
    if (status) where.status = status;

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        staff: {
          select: { id: true, name: true },
        },
        event: {
          select: { id: true, name: true, date: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(
      notifications.map((n) => ({
        id: n.id,
        staffId: n.staffId,
        staffName: n.staff.name,
        eventId: n.eventId,
        eventName: n.event?.name || null,
        eventDate: n.event?.date?.toISOString().split("T")[0] || null,
        type: n.type,
        channel: n.channel,
        title: n.title,
        content: n.content,
        status: n.status,
        sentAt: n.sentAt,
        error: n.error,
        createdAt: n.createdAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "取得通知記錄失敗" }, { status: 500 });
  }
}

// POST: 發送通知
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const body = await request.json();
    const { action, eventId, staffId, type, title, content } = body;

    // 發送給活動所有排班人員
    if (action === "notifyEvent" && eventId) {
      const result = await notifyEventStaff({
        eventId,
        type: type || "ASSIGNMENT",
      });
      return NextResponse.json(result);
    }

    // 發送給單一員工
    if (action === "notifyStaff" && staffId) {
      if (!title || !content) {
        return NextResponse.json({ error: "缺少通知內容" }, { status: 400 });
      }
      
      const result = await sendNotification({
        staffId,
        eventId,
        type: type || "ASSIGNMENT",
        title,
        content,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "無效的操作" }, { status: 400 });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: "發送通知失敗" }, { status: 500 });
  }
}

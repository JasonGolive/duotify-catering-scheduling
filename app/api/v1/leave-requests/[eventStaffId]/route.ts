import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { Client as LineClient, TextMessage } from "@line/bot-sdk";

// Initialize LINE Messaging API client
const lineClient = process.env.LINE_CHANNEL_ACCESS_TOKEN
  ? new LineClient({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    })
  : null;

// Send LINE message
async function sendLineMessage(lineUserId: string, message: string): Promise<boolean> {
  if (!lineClient) {
    console.warn("LINE client not configured");
    return false;
  }

  try {
    const textMessage: TextMessage = {
      type: "text",
      text: message,
    };

    await lineClient.pushMessage(lineUserId, textMessage);
    return true;
  } catch (error) {
    console.error("LINE Messaging API error:", error);
    return false;
  }
}

// Format date for notification
function formatDate(date: Date): string {
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

/**
 * PATCH /api/v1/leave-requests/[eventStaffId]
 * Approve or reject a leave request (Manager only)
 * Body: { action: 'approve' | 'reject', reason?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventStaffId: string }> }
) {
  try {
    await requireManager();

    const { eventStaffId } = await params;
    const body = await request.json();
    const { action, reason } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Get the event staff record with related data
    const eventStaff = await prisma.eventStaff.findUnique({
      where: { id: eventStaffId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            lineUserId: true,
            lineNotify: true,
          },
        },
      },
    });

    if (!eventStaff) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 }
      );
    }

    if (eventStaff.attendanceStatus !== "LEAVE_REQUESTED") {
      return NextResponse.json(
        { error: "This leave request has already been processed" },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "LEAVE_APPROVED" : "LEAVE_REJECTED";

    // Update the event staff record
    const updated = await prisma.eventStaff.update({
      where: { id: eventStaffId },
      data: {
        attendanceStatus: newStatus,
        notes: action === "reject" && reason 
          ? `拒絕原因: ${reason}${eventStaff.notes ? `\n${eventStaff.notes}` : ""}`
          : eventStaff.notes,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            lineUserId: true,
            lineNotify: true,
          },
        },
      },
    });

    // Send LINE notification to staff
    let notificationSent = false;
    if (updated.staff.lineUserId && updated.staff.lineNotify) {
      const dateStr = formatDate(updated.event.date);
      let message: string;

      if (action === "approve") {
        message = `✅ 請假已核准\n活動：${updated.event.name}\n日期：${dateStr}`;
      } else {
        message = `❌ 請假未核准\n活動：${updated.event.name}\n日期：${dateStr}${reason ? `\n原因：${reason}` : ""}`;
      }

      notificationSent = await sendLineMessage(updated.staff.lineUserId, message);

      // Record notification in database
      await prisma.notification.create({
        data: {
          staffId: updated.staff.id,
          eventId: updated.event.id,
          type: "LEAVE_REQUEST",
          channel: "LINE",
          title: action === "approve" ? "✅ 請假已核准" : "❌ 請假未核准",
          content: message,
          status: notificationSent ? "SENT" : "FAILED",
          sentAt: notificationSent ? new Date() : null,
          error: notificationSent ? null : "LINE 訊息發送失敗",
        },
      });
    }

    return NextResponse.json({
      success: true,
      eventStaff: updated,
      notificationSent,
    }, { status: 200 });
  } catch (error) {
    console.error("Error processing leave request:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden: Manager role required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

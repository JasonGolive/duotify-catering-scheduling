import { Resend } from "resend";
import { Client as LineClient, TextMessage } from "@line/bot-sdk";
import { prisma } from "@/lib/db";

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Initialize LINE Messaging API client
const lineClient = process.env.LINE_CHANNEL_ACCESS_TOKEN
  ? new LineClient({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    })
  : null;

// Email sender address
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@example.com";
const FROM_NAME = process.env.FROM_NAME || "北歐餐桌到府私廚";

// Types
interface NotifyParams {
  staffId: string;
  eventId?: string;
  type: "ASSIGNMENT" | "REMINDER" | "EVENT_CHANGE" | "EVENT_CANCEL";
  title: string;
  content: string;
}

interface EventNotifyParams {
  eventId: string;
  type: "ASSIGNMENT" | "REMINDER" | "EVENT_CHANGE" | "EVENT_CANCEL";
}

// Send LINE message via Messaging API
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

// Send Email via Resend
async function sendEmail(
  to: string,
  subject: string,
  content: string
): Promise<boolean> {
  if (!resend) {
    console.warn("Resend API key not configured");
    return false;
  }
  
  try {
    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      text: content,
    });
    
    if (error) {
      console.error("Resend error:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

// Send notification to a staff member
export async function sendNotification(params: NotifyParams): Promise<{
  line: { sent: boolean; error?: string };
  email: { sent: boolean; error?: string };
}> {
  const { staffId, eventId, type, title, content } = params;
  
  // Get staff info
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      name: true,
      email: true,
      lineUserId: true,
      lineNotify: true,
      emailNotify: true,
    },
  });
  
  if (!staff) {
    throw new Error("Staff not found");
  }
  
  const results = {
    line: { sent: false, error: undefined as string | undefined },
    email: { sent: false, error: undefined as string | undefined },
  };
  
  // Send LINE notification
  if (staff.lineNotify && staff.lineUserId) {
    const lineMessage = `${title}\n\n${content}`;
    const success = await sendLineMessage(staff.lineUserId, lineMessage);
    
    await prisma.notification.create({
      data: {
        staffId,
        eventId,
        type,
        channel: "LINE",
        title,
        content,
        status: success ? "SENT" : "FAILED",
        sentAt: success ? new Date() : null,
        error: success ? null : "LINE 訊息發送失敗",
      },
    });
    
    results.line.sent = success;
    if (!success) results.line.error = "LINE 訊息發送失敗";
  }
  
  // Send Email notification
  if (staff.emailNotify && staff.email) {
    const success = await sendEmail(staff.email, title, content);
    
    await prisma.notification.create({
      data: {
        staffId,
        eventId,
        type,
        channel: "EMAIL",
        title,
        content,
        status: success ? "SENT" : "FAILED",
        sentAt: success ? new Date() : null,
        error: success ? null : "Email 發送失敗",
      },
    });
    
    results.email.sent = success;
    if (!success) results.email.error = "Email 發送失敗";
  }
  
  return results;
}

// Format event date for notification
function formatDate(date: Date): string {
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

// Generate notification content for event
function generateEventContent(
  event: {
    name: string;
    date: Date;
    assemblyTime: string | null;
    startTime: string | null;
    location: string;
    address: string | null;
    notes: string | null;
  },
  type: "ASSIGNMENT" | "REMINDER" | "EVENT_CHANGE" | "EVENT_CANCEL"
): { title: string; content: string } {
  const dateStr = formatDate(event.date);
  const timeStr = event.assemblyTime || event.startTime || "待確認";
  
  switch (type) {
    case "ASSIGNMENT":
      return {
        title: `【排班通知】${event.name}`,
        content: `您已被指派到以下活動：

活動名稱：${event.name}
日期：${dateStr}
集合時間：${timeStr}
地點：${event.location}
${event.address ? `地址：${event.address}` : ""}
${event.notes ? `備註：${event.notes}` : ""}

如有問題請盡快聯繫管理員。`,
      };
      
    case "REMINDER":
      return {
        title: `【活動提醒】${event.name}`,
        content: `提醒您明天有活動：

活動名稱：${event.name}
日期：${dateStr}
集合時間：${timeStr}
地點：${event.location}
${event.address ? `地址：${event.address}` : ""}
${event.notes ? `備註：${event.notes}` : ""}

請準時出席！`,
      };
      
    case "EVENT_CHANGE":
      return {
        title: `【活動異動】${event.name}`,
        content: `活動資訊已更新，請確認：

活動名稱：${event.name}
日期：${dateStr}
集合時間：${timeStr}
地點：${event.location}
${event.address ? `地址：${event.address}` : ""}
${event.notes ? `備註：${event.notes}` : ""}

如有問題請聯繫管理員。`,
      };
      
    case "EVENT_CANCEL":
      return {
        title: `【活動取消】${event.name}`,
        content: `以下活動已取消：

活動名稱：${event.name}
原定日期：${dateStr}

如有問題請聯繫管理員。`,
      };
  }
}

// Notify all staff assigned to an event
export async function notifyEventStaff(params: EventNotifyParams): Promise<{
  total: number;
  success: number;
  failed: number;
}> {
  const { eventId, type } = params;
  
  // Get event with assigned staff
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      eventStaff: {
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
              lineUserId: true,
              lineNotify: true,
              emailNotify: true,
            },
          },
        },
      },
    },
  });
  
  if (!event) {
    throw new Error("Event not found");
  }
  
  const { title, content } = generateEventContent(event, type);
  
  let success = 0;
  let failed = 0;
  
  for (const es of event.eventStaff) {
    try {
      const result = await sendNotification({
        staffId: es.staffId,
        eventId,
        type,
        title,
        content,
      });
      
      if (result.line.sent || result.email.sent) {
        success++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Failed to notify staff ${es.staffId}:`, error);
      failed++;
    }
  }
  
  return {
    total: event.eventStaff.length,
    success,
    failed,
  };
}

// Map skill/role to Chinese display
function getWorkRoleDisplay(skill: string): string {
  switch (skill) {
    case "FRONT": return "外場";
    case "HOT": return "熱台";
    case "BOTH": return "皆可";
    default: return skill;
  }
}

// Format weekday in Chinese
function getWeekdayDisplay(date: Date): string {
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return `週${weekdays[date.getDay()]}`;
}

// Send daily reminders for events happening tomorrow
export async function sendDailyReminders(): Promise<{
  eventsFound: number;
  eventsProcessed: number;
  notificationsSent: number;
  errors: Array<{ staffId: string; staffName: string; eventId: string; eventName: string; error: string }>;
}> {
  // Get tomorrow's date range
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  
  // Find events happening tomorrow (not cancelled/completed)
  const events = await prisma.event.findMany({
    where: {
      date: {
        gte: tomorrow,
        lt: dayAfter,
      },
      status: {
        notIn: ["CANCELLED", "COMPLETED"],
      },
    },
    include: {
      venue: {
        select: {
          name: true,
        },
      },
      eventStaff: {
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              lineUserId: true,
              lineNotify: true,
              email: true,
              emailNotify: true,
            },
          },
        },
      },
    },
  });
  
  let notificationsSent = 0;
  const errors: Array<{ staffId: string; staffName: string; eventId: string; eventName: string; error: string }> = [];
  
  for (const event of events) {
    // Format date display
    const dateStr = event.date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const weekday = getWeekdayDisplay(event.date);
    const assemblyTime = event.assemblyTime || event.startTime || "待確認";
    const venueOrLocation = event.venue?.name || event.location;
    
    // Process each assigned staff
    for (const es of event.eventStaff) {
      const staff = es.staff;
      
      // Skip if staff doesn't have LINE userId or LINE notify is disabled
      if (!staff.lineUserId || !staff.lineNotify) {
        continue;
      }
      
      // Check if reminder already sent for this event+staff combination
      // Look for REMINDER type notification sent today for this event and staff
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingReminder = await prisma.notification.findFirst({
        where: {
          staffId: staff.id,
          eventId: event.id,
          type: "REMINDER",
          channel: "LINE",
          status: "SENT",
          sentAt: {
            gte: today,
          },
        },
      });
      
      if (existingReminder) {
        // Already sent reminder today, skip
        continue;
      }
      
      // Build reminder message
      const workRole = getWorkRoleDisplay(es.role);
      const message = `🔔 明日出勤提醒

活動：${event.name}
日期：${dateStr} (${weekday})
集合時間：${assemblyTime}
地點：${venueOrLocation}
角色：${workRole}

請準時出勤！如有問題請盡早聯繫。`;
      
      try {
        // Send LINE message
        const success = await sendLineMessage(staff.lineUserId, message);
        
        // Record notification
        await prisma.notification.create({
          data: {
            staffId: staff.id,
            eventId: event.id,
            type: "REMINDER",
            channel: "LINE",
            title: "🔔 明日出勤提醒",
            content: message,
            status: success ? "SENT" : "FAILED",
            sentAt: success ? new Date() : null,
            error: success ? null : "LINE 訊息發送失敗",
          },
        });
        
        if (success) {
          notificationsSent++;
        } else {
          errors.push({
            staffId: staff.id,
            staffName: staff.name,
            eventId: event.id,
            eventName: event.name,
            error: "LINE 訊息發送失敗",
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "未知錯誤";
        errors.push({
          staffId: staff.id,
          staffName: staff.name,
          eventId: event.id,
          eventName: event.name,
          error: errorMsg,
        });
        
        // Record failed notification
        await prisma.notification.create({
          data: {
            staffId: staff.id,
            eventId: event.id,
            type: "REMINDER",
            channel: "LINE",
            title: "🔔 明日出勤提醒",
            content: message,
            status: "FAILED",
            error: errorMsg,
          },
        });
      }
    }
  }
  
  return {
    eventsFound: events.length,
    eventsProcessed: events.length,
    notificationsSent,
    errors,
  };
}

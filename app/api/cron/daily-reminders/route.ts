import { NextRequest, NextResponse } from "next/server";
import { sendDailyReminders } from "@/lib/services/notification";

// GET: 每日活動提醒 (由外部 Cron 服務呼叫)
export async function GET(request: NextRequest) {
  try {
    // 驗證 cron secret (防止未授權呼叫)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await sendDailyReminders();
    
    console.log(`Daily reminders sent: ${result.notificationsSent} notifications for ${result.eventsProcessed} events`);
    
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: "執行失敗" }, { status: 500 });
  }
}

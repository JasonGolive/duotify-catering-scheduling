import { NextRequest, NextResponse } from "next/server";
import { sendDailyReminders } from "@/lib/services/notification";

// GET: 每日活動提醒 (由外部 Cron 服務呼叫)
export async function GET(request: NextRequest) {
  try {
    // 驗證 cron secret (防止未授權呼叫)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    // Security: Verify request is from legitimate cron source
    // Option 1: Check Authorization header with Bearer token
    // Option 2: For Vercel Cron, check CRON_SECRET header
    const vercelCronSecret = request.headers.get("x-vercel-cron-signature");
    
    if (cronSecret) {
      const isValidBearer = authHeader === `Bearer ${cronSecret}`;
      const isValidVercel = vercelCronSecret === cronSecret;
      
      if (!isValidBearer && !isValidVercel) {
        console.warn("Unauthorized cron request attempt");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const result = await sendDailyReminders();
    
    console.log(
      `Daily reminders: ${result.eventsFound} events found, ` +
      `${result.notificationsSent} notifications sent, ` +
      `${result.errors.length} errors`
    );
    
    return NextResponse.json({
      success: true,
      eventsFound: result.eventsFound,
      notificationsSent: result.notificationsSent,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { 
        error: "執行失敗",
        message: error instanceof Error ? error.message : "Unknown error",
      }, 
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { Client } from "@line/bot-sdk";

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";

/**
 * POST /api/line/send
 * 發送 LINE 訊息給指定用戶
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, message } = body as {
      userId: string;
      message: string;
    };

    if (!userId || !message) {
      return NextResponse.json(
        { error: "userId 和 message 為必填" },
        { status: 400 }
      );
    }

    if (!channelAccessToken) {
      console.error("LINE_CHANNEL_ACCESS_TOKEN not configured");
      return NextResponse.json(
        { error: "LINE 未設定" },
        { status: 500 }
      );
    }

    const client = new Client({ channelAccessToken });

    // 發送推播訊息
    await client.pushMessage(userId, {
      type: "text",
      text: message,
    });

    console.log(`LINE message sent to ${userId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending LINE message:", error);
    
    // 檢查是否為 LINE API 錯誤
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      // 常見錯誤處理
      if (errorMessage.includes("Invalid reply token")) {
        return NextResponse.json(
          { error: "無效的回覆 token" },
          { status: 400 }
        );
      }
      
      if (errorMessage.includes("User not found")) {
        return NextResponse.json(
          { error: "找不到此 LINE 用戶" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "發送訊息失敗" },
      { status: 500 }
    );
  }
}

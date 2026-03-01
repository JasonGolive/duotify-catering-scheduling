import { NextRequest, NextResponse } from "next/server";
import { validateSignature, WebhookEvent } from "@line/bot-sdk";
import { prisma } from "@/lib/db";

const channelSecret = process.env.LINE_CHANNEL_SECRET || "";

// POST: LINE Webhook 接收事件
export async function POST(request: NextRequest) {
  console.log("LINE Webhook received");
  
  try {
    // 取得 signature
    const signature = request.headers.get("x-line-signature");
    console.log("Signature present:", !!signature);
    
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // 取得 body
    const body = await request.text();
    console.log("Body received, length:", body.length);

    // 驗證簽名
    if (channelSecret) {
      const isValid = validateSignature(body, channelSecret, signature);
      console.log("Signature valid:", isValid);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      console.log("WARNING: LINE_CHANNEL_SECRET not set, skipping validation");
    }

    const data = JSON.parse(body);
    const events: WebhookEvent[] = data.events || [];
    console.log("Events count:", events.length);

    // 處理事件
    for (const event of events) {
      console.log("Processing event type:", event.type);
      await handleEvent(event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("LINE Webhook error:", error);
    return NextResponse.json({ error: "處理失敗" }, { status: 500 });
  }
}

// 處理 LINE 事件
async function handleEvent(event: WebhookEvent) {
  // 只處理來自用戶的事件
  if (event.source.type !== "user") {
    return;
  }

  const lineUserId = event.source.userId;
  if (!lineUserId) return;

  switch (event.type) {
    case "follow":
      // 用戶加入好友
      console.log(`User followed: ${lineUserId}`);
      await handleFollow(lineUserId, event.replyToken);
      break;

    case "unfollow":
      // 用戶封鎖
      console.log(`User unfollowed: ${lineUserId}`);
      await handleUnfollow(lineUserId);
      break;

    case "message":
      // 用戶傳訊息 - 可用於綁定
      if (event.message.type === "text") {
        await handleMessage(lineUserId, event.message.text, event.replyToken);
      }
      break;
  }
}

// 處理加好友事件
async function handleFollow(lineUserId: string, replyToken: string) {
  // 回覆歡迎訊息
  const lineClient = await getLineClient();
  if (lineClient) {
    try {
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: `歡迎加入北歐餐桌到府私廚！

請輸入您的手機號碼進行綁定，例如：
綁定 0912345678

綁定成功後即可收到排班通知。`,
      });
    } catch (error) {
      console.error("Reply error:", error);
    }
  }
}

// 處理取消追蹤
async function handleUnfollow(lineUserId: string) {
  // 清除員工的 LINE User ID
  await prisma.staff.updateMany({
    where: { lineUserId },
    data: { lineUserId: null },
  });
}

// 處理訊息 - 用於綁定手機號碼
async function handleMessage(lineUserId: string, text: string, replyToken: string) {
  console.log("handleMessage called, text:", text, "lineUserId:", lineUserId);
  
  const lineClient = await getLineClient();
  if (!lineClient) {
    console.log("LINE client not available");
    return;
  }

  // 正規化文字：移除前後空白，將全形轉半形
  const normalizedText = text.trim().replace(/　/g, ' ');
  console.log("Normalized text:", normalizedText);

  // 檢查是否是綁定指令（支援「綁定」後接空格和10位數字）
  const bindMatch = normalizedText.match(/^綁定\s*(\d{10})$/);
  console.log("Bind match result:", bindMatch);
  
  if (bindMatch) {
    const phone = bindMatch[1];
    console.log("Looking for staff with phone:", phone);
    
    try {
      // 查找員工
      const staff = await prisma.staff.findUnique({
        where: { phone },
      });
      console.log("Staff found:", staff ? staff.name : "not found");

      if (!staff) {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "找不到此手機號碼的員工資料，請確認號碼是否正確。",
        });
        return;
      }

      // 檢查是否已被其他人綁定
      if (staff.lineUserId && staff.lineUserId !== lineUserId) {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "此手機號碼已綁定其他 LINE 帳號。",
        });
        return;
      }

      // 綁定
      await prisma.staff.update({
        where: { id: staff.id },
        data: { lineUserId },
      });

      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: `✅ 綁定成功！

${staff.name} 您好，
您的 LINE 已成功綁定，之後會收到排班通知。`,
      });
      return;
    } catch (error) {
      console.error("Bind error:", error);
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: "綁定過程發生錯誤，請稍後再試。",
      });
      return;
    }
  }

  // 其他訊息
  await lineClient.replyMessage(replyToken, {
    type: "text",
    text: `您好！這是北歐餐桌到府私廚的排班通知系統。

如需綁定帳號，請輸入：
綁定 您的手機號碼

例如：綁定 0912345678`,
  });
}

// 取得 LINE Client
async function getLineClient() {
  const { Client } = await import("@line/bot-sdk");
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return null;
  return new Client({ channelAccessToken: token });
}

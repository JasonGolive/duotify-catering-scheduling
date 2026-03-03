import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import crypto from "crypto";

/**
 * POST /api/v1/invite
 * Send invitation to staff for account registration
 */
export async function POST(request: NextRequest) {
  try {
    await requireManager();

    const body = await request.json();
    const { staffId, expiresInDays = 7, sendNotification = true } = body as {
      staffId: string;
      expiresInDays?: number;
      sendNotification?: boolean;
    };

    if (!staffId) {
      return NextResponse.json({ error: "staffId 為必填" }, { status: 400 });
    }

    // Get staff info
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        lineUserId: true,
        lineNotify: true,
        userId: true,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "找不到員工資料" }, { status: 404 });
    }

    // Check if already has account
    if (staff.userId) {
      return NextResponse.json(
        { error: "此員工已有登入帳號" },
        { status: 400 }
      );
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create invite token
    const inviteToken = await prisma.inviteToken.create({
      data: {
        staffId,
        token,
        email: staff.email,
        expiresAt,
        sentAt: sendNotification ? new Date() : null,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://duotify-catering-scheduling-production.up.railway.app";
    const inviteUrl = `${baseUrl}/invite/${token}`;

    // Send LINE notification if enabled
    if (sendNotification && staff.lineUserId && staff.lineNotify) {
      const message = `🎉 帳號註冊邀請\n\n${staff.name} 您好！\n\n請點擊以下連結完成帳號註冊，註冊後即可使用排班系統：\n\n${inviteUrl}\n\n⏰ 連結有效期限：${expiresAt.toLocaleDateString("zh-TW")}\n\n如有問題請聯繫管理員。`;

      try {
        await fetch(`${baseUrl}/api/line/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: staff.lineUserId,
            message,
          }),
        });
      } catch (lineError) {
        console.error("Failed to send LINE notification:", lineError);
      }
    }

    return NextResponse.json({
      message: "邀請已發送",
      inviteUrl,
      token: inviteToken.token,
      expiresAt: inviteToken.expiresAt.toISOString(),
      sentViaLine: sendNotification && !!staff.lineUserId,
    });
  } catch (error) {
    console.error("Error sending invite:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "發送邀請失敗" }, { status: 500 });
  }
}

/**
 * GET /api/v1/invite?token=xxx
 * Validate invite token (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "token 為必填" }, { status: 400 });
    }

    const inviteToken = await prisma.inviteToken.findUnique({
      where: { token },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            userId: true,
          },
        },
      },
    });

    if (!inviteToken) {
      return NextResponse.json({ error: "無效的邀請連結" }, { status: 404 });
    }

    // Check if already used
    if (inviteToken.usedAt) {
      return NextResponse.json(
        { error: "此邀請連結已使用", used: true },
        { status: 400 }
      );
    }

    // Check if staff already has account
    if (inviteToken.staff.userId) {
      return NextResponse.json(
        { error: "此員工已有登入帳號", hasAccount: true },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > new Date(inviteToken.expiresAt)) {
      return NextResponse.json(
        { error: "邀請連結已過期", expired: true },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      staffId: inviteToken.staffId,
      staffName: inviteToken.staff.name,
      staffPhone: inviteToken.staff.phone,
      staffEmail: inviteToken.staff.email,
      expiresAt: inviteToken.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Error validating invite:", error);
    return NextResponse.json({ error: "驗證失敗" }, { status: 500 });
  }
}

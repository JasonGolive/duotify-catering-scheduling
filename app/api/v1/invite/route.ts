import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";

/**
 * POST /api/v1/invite
 * Send LINE binding invitation to staff
 * (Simple version - no Clerk registration required)
 */
export async function POST(request: NextRequest) {
  try {
    await requireManager();

    const body = await request.json();
    const { staffId } = body as { staffId: string };

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
        lineUserId: true,
        lineNotify: true,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "找不到員工資料" }, { status: 404 });
    }

    // Check if already bound LINE
    if (staff.lineUserId) {
      return NextResponse.json(
        { error: "此員工已綁定 LINE 帳號", alreadyBound: true },
        { status: 400 }
      );
    }

    // 無法發送通知給尚未綁定的員工 - 需要員工主動加好友並綁定
    // 這裡只是回傳綁定指引
    return NextResponse.json({
      success: true,
      message: "請通知員工加入 LINE 好友並完成綁定",
      instructions: {
        step1: "請員工加入北歐餐桌到府私廚 LINE 官方帳號",
        step2: `員工加入後，輸入：綁定 ${staff.phone}`,
        step3: "綁定成功後即可收到排班通知",
      },
      staffName: staff.name,
      staffPhone: staff.phone,
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

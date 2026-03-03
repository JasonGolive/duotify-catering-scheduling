import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

/**
 * POST /api/v1/invite/complete
 * Complete the invite process after Clerk registration
 * Links the Clerk user to the staff record
 */
export async function POST(request: NextRequest) {
  try {
    // Get current Clerk user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body as { token: string };

    if (!token) {
      return NextResponse.json({ error: "token 為必填" }, { status: 400 });
    }

    // Find the invite token
    const inviteToken = await prisma.inviteToken.findUnique({
      where: { token },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
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
        { error: "此邀請連結已使用" },
        { status: 400 }
      );
    }

    // Check if staff already has account
    if (inviteToken.staff.userId) {
      return NextResponse.json(
        { error: "此員工已有登入帳號" },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > new Date(inviteToken.expiresAt)) {
      return NextResponse.json(
        { error: "邀請連結已過期" },
        { status: 410 }
      );
    }

    // Check if this Clerk user is already linked to another staff
    const existingStaff = await prisma.staff.findUnique({
      where: { userId },
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: "此帳號已綁定其他員工" },
        { status: 400 }
      );
    }

    // Transaction: Update staff, create user record, mark token as used
    const result = await prisma.$transaction(async (tx) => {
      // Create or update User record
      const user = await tx.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          email: inviteToken.email || `staff_${inviteToken.staffId}@temp.local`,
          role: "STAFF",
        },
      });

      // Link staff to user
      const staff = await tx.staff.update({
        where: { id: inviteToken.staffId },
        data: { userId },
      });

      // Mark token as used
      await tx.inviteToken.update({
        where: { id: inviteToken.id },
        data: { usedAt: new Date() },
      });

      return { user, staff };
    });

    return NextResponse.json({
      message: "帳號綁定成功！",
      staffId: result.staff.id,
      staffName: result.staff.name,
    });
  } catch (error) {
    console.error("Error completing invite:", error);
    return NextResponse.json({ error: "綁定失敗" }, { status: 500 });
  }
}

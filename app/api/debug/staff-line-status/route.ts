import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/debug/staff-line-status
 * 檢查員工 LINE 綁定狀態（僅用於偵錯）
 */
export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        lineUserId: true,
        lineNotify: true,
        status: true,
      },
      orderBy: { name: "asc" },
    });

    const summary = {
      total: staff.length,
      bound: staff.filter(s => s.lineUserId).length,
      unbound: staff.filter(s => !s.lineUserId).length,
      notifyEnabled: staff.filter(s => s.lineNotify).length,
      staff: staff.map(s => ({
        name: s.name,
        phone: s.phone,
        status: s.status,
        lineUserId: s.lineUserId ? `${s.lineUserId.substring(0, 8)}...` : null,
        lineBound: !!s.lineUserId,
        lineNotify: s.lineNotify,
      })),
      env: {
        lineTokenConfigured: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || "not set",
      },
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error checking staff LINE status:", error);
    return NextResponse.json(
      { error: "查詢失敗" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteParams = {
  params: Promise<{ token: string }>;
};

// POST /api/v1/staff/availability-edit/[token]/complete - Mark as completed
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;

    const availabilityToken = await prisma.availabilityToken.findUnique({
      where: { token },
      include: {
        staff: { select: { id: true, name: true } },
      },
    });

    if (!availabilityToken) {
      return NextResponse.json({ error: "無效的連結" }, { status: 404 });
    }

    if (new Date() > new Date(availabilityToken.expiresAt)) {
      return NextResponse.json({ error: "連結已過期" }, { status: 410 });
    }

    // Update completedAt
    const updated = await prisma.availabilityToken.update({
      where: { token },
      data: { completedAt: new Date() },
    });

    // Send notification to admin (optional - could be LINE or other)
    // This could also trigger a notification to let admin know someone completed

    return NextResponse.json({
      message: "已完成填寫",
      completedAt: updated.completedAt?.toISOString(),
    });
  } catch (error) {
    console.error("Error completing availability:", error);
    return NextResponse.json({ error: "完成失敗" }, { status: 500 });
  }
}

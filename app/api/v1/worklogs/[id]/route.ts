import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// GET: 取得單筆打工記錄
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { id } = await params;
    const workLog = await prisma.workLog.findUnique({
      where: { id },
      include: {
        staff: { select: { id: true, name: true } },
        event: { select: { id: true, name: true } },
      },
    });

    if (!workLog) {
      return NextResponse.json({ error: "找不到打工記錄" }, { status: 404 });
    }

    return NextResponse.json({
      id: workLog.id,
      staffId: workLog.staffId,
      staffName: workLog.staff.name,
      date: workLog.date.toISOString().split("T")[0],
      startTime: workLog.startTime,
      endTime: workLog.endTime,
      hours: Number(workLog.hours),
      eventId: workLog.eventId,
      eventName: workLog.event?.name || null,
      baseSalary: Number(workLog.baseSalary),
      overtimePay: Number(workLog.overtimePay),
      allowance: Number(workLog.allowance),
      totalSalary: Number(workLog.totalSalary),
      source: workLog.source,
      notes: workLog.notes,
    });
  } catch (error) {
    console.error("Error fetching work log:", error);
    return NextResponse.json({ error: "取得打工記錄失敗" }, { status: 500 });
  }
}

// PATCH: 更新打工記錄（可調整加班費）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.workLog.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "找不到打工記錄" }, { status: 404 });
    }

    // 允許調整的欄位
    const updateData: Record<string, unknown> = {};
    
    if (body.overtimePay !== undefined) {
      updateData.overtimePay = body.overtimePay;
    }
    if (body.allowance !== undefined) {
      updateData.allowance = body.allowance;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    // 重新計算總薪資
    const baseSalary = Number(existing.baseSalary);
    const overtimePay = body.overtimePay !== undefined ? Number(body.overtimePay) : Number(existing.overtimePay);
    const allowance = body.allowance !== undefined ? Number(body.allowance) : Number(existing.allowance);
    updateData.totalSalary = baseSalary + overtimePay + allowance;

    const workLog = await prisma.workLog.update({
      where: { id },
      data: updateData,
      include: {
        staff: { select: { name: true } },
      },
    });

    return NextResponse.json({
      id: workLog.id,
      staffId: workLog.staffId,
      staffName: workLog.staff.name,
      date: workLog.date.toISOString().split("T")[0],
      startTime: workLog.startTime,
      endTime: workLog.endTime,
      hours: Number(workLog.hours),
      baseSalary: Number(workLog.baseSalary),
      overtimePay: Number(workLog.overtimePay),
      allowance: Number(workLog.allowance),
      totalSalary: Number(workLog.totalSalary),
      source: workLog.source,
      notes: workLog.notes,
    });
  } catch (error) {
    console.error("Error updating work log:", error);
    return NextResponse.json({ error: "更新打工記錄失敗" }, { status: 500 });
  }
}

// DELETE: 刪除打工記錄
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.workLog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting work log:", error);
    return NextResponse.json({ error: "刪除打工記錄失敗" }, { status: 500 });
  }
}

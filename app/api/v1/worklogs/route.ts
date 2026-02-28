import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { calculateSalary, SALARY_CONFIG } from "@/lib/validations/worklog";

// GET: 取得打工記錄列表
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const staffId = searchParams.get("staffId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};
    
    if (staffId) {
      where.staffId = staffId;
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        (where.date as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.date as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const workLogs = await prisma.workLog.findMany({
      where,
      include: {
        staff: {
          select: { id: true, name: true },
        },
        event: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
    });

    return NextResponse.json(
      workLogs.map((log) => ({
        id: log.id,
        staffId: log.staffId,
        staffName: log.staff.name,
        date: log.date.toISOString().split("T")[0],
        startTime: log.startTime,
        endTime: log.endTime,
        hours: Number(log.hours),
        eventId: log.eventId,
        eventName: log.event?.name || null,
        baseSalary: Number(log.baseSalary),
        overtimePay: Number(log.overtimePay),
        allowance: Number(log.allowance),
        totalSalary: Number(log.totalSalary),
        source: log.source,
        notes: log.notes,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching work logs:", error);
    return NextResponse.json({ error: "取得打工記錄失敗" }, { status: 500 });
  }
}

// POST: 新增打工記錄
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const body = await request.json();
    const {
      staffId,
      date,
      startTime,
      endTime,
      allowance = 0,
      overtimeRate = SALARY_CONFIG.DEFAULT_OVERTIME_RATE,
      notes,
      source = "MANUAL",
    } = body;

    // 取得員工資料
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { perEventSalary: true },
    });

    if (!staff) {
      return NextResponse.json({ error: "找不到員工" }, { status: 404 });
    }

    const baseSalary = Number(staff.perEventSalary) || 0;
    const salaryCalc = calculateSalary(startTime, endTime, baseSalary, allowance, overtimeRate);

    const workLog = await prisma.workLog.create({
      data: {
        staffId,
        date: new Date(date),
        startTime,
        endTime,
        hours: salaryCalc.hours,
        baseSalary,
        overtimePay: salaryCalc.overtimePay,
        allowance,
        totalSalary: salaryCalc.totalSalary,
        source,
        notes: notes || null,
      },
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
    console.error("Error creating work log:", error);
    return NextResponse.json({ error: "新增打工記錄失敗" }, { status: 500 });
  }
}

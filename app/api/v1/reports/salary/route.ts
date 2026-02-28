import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// GET: 薪資報表
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const staffId = searchParams.get("staffId");
    const groupBy = searchParams.get("groupBy") || "staff"; // staff, date, month

    // 建立查詢條件
    const where: Record<string, unknown> = {};
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        (where.date as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.date as Record<string, Date>).lte = new Date(endDate);
      }
    }
    
    if (staffId) {
      where.staffId = staffId;
    }

    // 取得打工記錄
    const workLogs = await prisma.workLog.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            skill: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    // 轉換 Decimal 為數字
    const logs = workLogs.map((log) => ({
      id: log.id,
      staffId: log.staffId,
      staffName: log.staff.name,
      staffSkill: log.staff.skill,
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
    }));

    // 依照 groupBy 分組
    let grouped: Record<string, typeof logs> = {};
    
    if (groupBy === "staff") {
      for (const log of logs) {
        const key = log.staffId;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(log);
      }
    } else if (groupBy === "date") {
      for (const log of logs) {
        const key = log.date;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(log);
      }
    } else if (groupBy === "month") {
      for (const log of logs) {
        const key = log.date.substring(0, 7); // YYYY-MM
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(log);
      }
    }

    // 計算統計
    const summaryByGroup = Object.entries(grouped).map(([key, items]) => {
      const totalHours = items.reduce((sum, i) => sum + i.hours, 0);
      const totalBaseSalary = items.reduce((sum, i) => sum + i.baseSalary, 0);
      const totalOvertimePay = items.reduce((sum, i) => sum + i.overtimePay, 0);
      const totalAllowance = items.reduce((sum, i) => sum + i.allowance, 0);
      const totalSalary = items.reduce((sum, i) => sum + i.totalSalary, 0);
      
      return {
        key,
        label: groupBy === "staff" ? items[0]?.staffName : key,
        count: items.length,
        totalHours: Math.round(totalHours * 10) / 10,
        totalBaseSalary,
        totalOvertimePay,
        totalAllowance,
        totalSalary,
        items,
      };
    });

    // 總計
    const grandTotal = {
      count: logs.length,
      totalHours: Math.round(logs.reduce((sum, i) => sum + i.hours, 0) * 10) / 10,
      totalBaseSalary: logs.reduce((sum, i) => sum + i.baseSalary, 0),
      totalOvertimePay: logs.reduce((sum, i) => sum + i.overtimePay, 0),
      totalAllowance: logs.reduce((sum, i) => sum + i.allowance, 0),
      totalSalary: logs.reduce((sum, i) => sum + i.totalSalary, 0),
    };

    return NextResponse.json({
      groupBy,
      groups: summaryByGroup,
      grandTotal,
      dateRange: {
        start: startDate || null,
        end: endDate || null,
      },
    });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json({ error: "取得報表失敗" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import {
  calculateSalary,
  SALARY_CONFIG,
} from "@/lib/validations/worklog";

// POST: 預覽或確認匯入打卡資料
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const body = await request.json();
    const { rows, confirm = false, overtimeRate = SALARY_CONFIG.DEFAULT_OVERTIME_RATE } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "請提供匯入資料" }, { status: 400 });
    }

    // 取得所有員工 for name matching
    const staffList = await prisma.staff.findMany({
      select: { id: true, name: true, perEventSalary: true },
    });
    const staffMap = new Map(staffList.map((s) => [s.name, s]));

    // 收集所有日期，預先查詢活動和排班
    const dates = new Set<string>();
    for (const row of rows) {
      const dateRaw = row.date || row["日期"] || "";
      const date = normalizeDate(dateRaw);
      if (date) dates.add(date);
    }

    // 查詢這些日期的活動（含排班資料）
    const events = await prisma.event.findMany({
      where: {
        date: {
          in: Array.from(dates).map((d) => new Date(d)),
        },
      },
      select: {
        id: true,
        name: true,
        date: true,
        assemblyTime: true,
        eventStaff: {
          select: {
            staffId: true,
            salary: true,
          },
        },
      },
    });

    // 建立日期+員工 -> 活動的映射
    const eventMap = new Map<string, {
      eventId: string;
      eventName: string;
      assemblyTime: string | null;
      assignedSalary: number | null;
    }>();
    
    for (const event of events) {
      const dateStr = event.date.toISOString().split("T")[0];
      for (const es of event.eventStaff) {
        const key = `${dateStr}_${es.staffId}`;
        eventMap.set(key, {
          eventId: event.id,
          eventName: event.name,
          assemblyTime: event.assemblyTime,
          assignedSalary: es.salary ? Number(es.salary) : null,
        });
      }
    }

    // 處理每一筆資料
    const results: Array<{
      row: number;
      staffName: string;
      staffId?: string;
      date: string;
      eventId?: string;
      eventName?: string;
      assemblyTime: string;
      clockIn: string;
      clockOut: string;
      hours: number;
      baseSalary: number;
      overtimeMinutes: number;
      overtimePay: number;
      allowance: number;
      totalSalary: number;
      error?: string;
      warning?: string;
      notes?: string;
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const staffName = String(row.staffName || row["員工姓名"] || "").trim();
      const dateRaw = row.date || row["日期"] || "";
      const clockIn = normalizeTime(row.clockIn || row["上班時間"] || row["打卡上班"] || "");
      const clockOut = normalizeTime(row.clockOut || row["下班時間"] || row["打卡下班"] || "");
      const allowance = Number(row.allowance || row["補助"] || row["雜費"] || 0);
      const rowOvertimeRate = Number(row.overtimeRate || row["加班費率"] || overtimeRate);
      const notes = row.notes || row["備註"] || "";

      const date = normalizeDate(dateRaw);

      // 驗證員工
      if (!staffName) {
        results.push({
          row: i + 1, staffName: "", date, assemblyTime: "", clockIn, clockOut,
          hours: 0, baseSalary: 0, overtimeMinutes: 0, overtimePay: 0, allowance: 0, totalSalary: 0,
          error: "缺少員工姓名",
        });
        continue;
      }

      const staff = staffMap.get(staffName);
      if (!staff) {
        results.push({
          row: i + 1, staffName, date, assemblyTime: "", clockIn, clockOut,
          hours: 0, baseSalary: 0, overtimeMinutes: 0, overtimePay: 0, allowance: 0, totalSalary: 0,
          error: `找不到員工: ${staffName}`,
        });
        continue;
      }

      // 驗證日期
      if (!date || !isValidDate(date)) {
        results.push({
          row: i + 1, staffName, staffId: staff.id, date, assemblyTime: "", clockIn, clockOut,
          hours: 0, baseSalary: 0, overtimeMinutes: 0, overtimePay: 0, allowance: 0, totalSalary: 0,
          error: `日期格式錯誤: ${dateRaw}`,
        });
        continue;
      }

      // 驗證時間
      if (!isValidTime(clockOut)) {
        results.push({
          row: i + 1, staffName, staffId: staff.id, date, assemblyTime: "", clockIn, clockOut,
          hours: 0, baseSalary: 0, overtimeMinutes: 0, overtimePay: 0, allowance: 0, totalSalary: 0,
          error: `下班時間格式錯誤: ${clockOut}`,
        });
        continue;
      }

      // 查找對應的活動排班
      const key = `${date}_${staff.id}`;
      const eventInfo = eventMap.get(key);
      
      let assemblyTime = "";
      let eventId: string | undefined;
      let eventName: string | undefined;
      let baseSalary = Number(staff.perEventSalary) || 0;
      let warning: string | undefined;

      if (eventInfo) {
        eventId = eventInfo.eventId;
        eventName = eventInfo.eventName;
        assemblyTime = eventInfo.assemblyTime || "";
        // 如果排班有指定薪資，使用排班薪資
        if (eventInfo.assignedSalary) {
          baseSalary = eventInfo.assignedSalary;
        }
      } else {
        warning = "找不到對應的活動排班，請確認是否已排班";
      }

      // 如果沒有集合時間，使用打卡上班時間
      const startTime = assemblyTime || clockIn;
      if (!startTime || !isValidTime(startTime)) {
        results.push({
          row: i + 1, staffName, staffId: staff.id, date, eventId, eventName,
          assemblyTime, clockIn, clockOut,
          hours: 0, baseSalary: 0, overtimeMinutes: 0, overtimePay: 0, allowance: 0, totalSalary: 0,
          error: "缺少集合時間（活動未設定集合時間且無上班打卡時間）",
        });
        continue;
      }

      // 計算薪資：下班時間 - 集合時間
      const salaryCalc = calculateSalary(startTime, clockOut, baseSalary, allowance, rowOvertimeRate);

      results.push({
        row: i + 1,
        staffName,
        staffId: staff.id,
        date,
        eventId,
        eventName,
        assemblyTime: startTime,
        clockIn,
        clockOut,
        hours: salaryCalc.hours,
        baseSalary,
        overtimeMinutes: salaryCalc.overtimeMinutes,
        overtimePay: salaryCalc.overtimePay,
        allowance,
        totalSalary: salaryCalc.totalSalary,
        warning,
        notes,
      });
    }

    // 統計
    const validRows = results.filter((r) => !r.error);
    const errorRows = results.filter((r) => r.error);
    const warningRows = results.filter((r) => r.warning && !r.error);
    const totalSalary = validRows.reduce((sum, r) => sum + r.totalSalary, 0);

    // 如果是確認匯入
    if (confirm) {
      if (errorRows.length > 0) {
        return NextResponse.json(
          { error: "存在錯誤資料，請先修正", results, summary: { valid: validRows.length, errors: errorRows.length } },
          { status: 400 }
        );
      }

      // 建立 WorkLog 記錄
      const workLogs = await prisma.$transaction(
        validRows.map((r) =>
          prisma.workLog.create({
            data: {
              staffId: r.staffId!,
              date: new Date(r.date),
              startTime: r.assemblyTime,
              endTime: r.clockOut,
              hours: r.hours,
              eventId: r.eventId || null,
              baseSalary: r.baseSalary,
              overtimePay: r.overtimePay,
              allowance: r.allowance,
              totalSalary: r.totalSalary,
              source: "IMPORT",
              notes: r.notes || null,
            },
          })
        )
      );

      return NextResponse.json({
        success: true,
        imported: workLogs.length,
        totalSalary,
      });
    }

    // 預覽模式
    return NextResponse.json({
      preview: true,
      results,
      summary: {
        total: results.length,
        valid: validRows.length,
        errors: errorRows.length,
        warnings: warningRows.length,
        totalSalary,
      },
      config: {
        baseHours: SALARY_CONFIG.BASE_HOURS,
        overtimeInterval: SALARY_CONFIG.OVERTIME_INTERVAL,
        overtimeRate,
      },
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "匯入失敗" }, { status: 500 });
  }
}

// Helper functions
function normalizeTime(time: string): string {
  if (!time) return "";
  const cleaned = String(time).trim();
  
  if (/^\d{1,2}:\d{2}$/.test(cleaned)) {
    const [h, m] = cleaned.split(":");
    return `${h.padStart(2, "0")}:${m}`;
  }
  
  // Excel 時間序列
  const num = parseFloat(cleaned);
  if (!isNaN(num) && num >= 0 && num < 1) {
    const totalMinutes = Math.round(num * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  
  return cleaned;
}

function normalizeDate(date: string): string {
  if (!date) return "";
  const cleaned = String(date).trim();
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }
  
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(cleaned)) {
    const [y, m, d] = cleaned.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  
  // Excel 序列日期
  const num = parseFloat(cleaned);
  if (!isNaN(num) && num > 40000 && num < 60000) {
    const date = new Date((num - 25569) * 86400 * 1000);
    return date.toISOString().split("T")[0];
  }
  
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }
  
  return cleaned;
}

function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

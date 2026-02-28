import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import {
  calculateMinutes,
  calculateHours,
  calculateSalary,
  SALARY_CONFIG,
} from "@/lib/validations/worklog";

// POST: 預覽或確認匯入
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

    // 處理每一筆資料
    const results: Array<{
      row: number;
      staffName: string;
      staffId?: string;
      date: string;
      startTime: string;
      endTime: string;
      hours: number;
      baseSalary: number;
      overtimeMinutes: number;
      overtimePay: number;
      allowance: number;
      totalSalary: number;
      error?: string;
      notes?: string;
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const staffName = String(row.staffName || row["員工姓名"] || "").trim();
      const dateRaw = row.date || row["日期"] || "";
      const startTime = normalizeTime(row.startTime || row["集合時間"] || row["上班時間"] || "");
      const endTime = normalizeTime(row.endTime || row["下班時間"] || "");
      const allowance = Number(row.allowance || row["補助"] || row["雜費"] || 0);
      const rowOvertimeRate = Number(row.overtimeRate || row["加班費率"] || overtimeRate);
      const notes = row.notes || row["備註"] || "";

      // 轉換日期格式
      const date = normalizeDate(dateRaw);

      // 驗證
      if (!staffName) {
        results.push({
          row: i + 1,
          staffName: "",
          date,
          startTime,
          endTime,
          hours: 0,
          baseSalary: 0,
          overtimeMinutes: 0,
          overtimePay: 0,
          allowance: 0,
          totalSalary: 0,
          error: "缺少員工姓名",
        });
        continue;
      }

      const staff = staffMap.get(staffName);
      if (!staff) {
        results.push({
          row: i + 1,
          staffName,
          date,
          startTime,
          endTime,
          hours: 0,
          baseSalary: 0,
          overtimeMinutes: 0,
          overtimePay: 0,
          allowance: 0,
          totalSalary: 0,
          error: `找不到員工: ${staffName}`,
        });
        continue;
      }

      if (!date || !isValidDate(date)) {
        results.push({
          row: i + 1,
          staffName,
          staffId: staff.id,
          date,
          startTime,
          endTime,
          hours: 0,
          baseSalary: 0,
          overtimeMinutes: 0,
          overtimePay: 0,
          allowance: 0,
          totalSalary: 0,
          error: `日期格式錯誤: ${dateRaw}`,
        });
        continue;
      }

      if (!isValidTime(startTime) || !isValidTime(endTime)) {
        results.push({
          row: i + 1,
          staffName,
          staffId: staff.id,
          date,
          startTime,
          endTime,
          hours: 0,
          baseSalary: 0,
          overtimeMinutes: 0,
          overtimePay: 0,
          allowance: 0,
          totalSalary: 0,
          error: `時間格式錯誤: ${startTime} - ${endTime}`,
        });
        continue;
      }

      // 計算薪資
      const baseSalary = Number(staff.perEventSalary) || 0;
      const salaryCalc = calculateSalary(startTime, endTime, baseSalary, allowance, rowOvertimeRate);

      results.push({
        row: i + 1,
        staffName,
        staffId: staff.id,
        date,
        startTime,
        endTime,
        hours: salaryCalc.hours,
        baseSalary,
        overtimeMinutes: salaryCalc.overtimeMinutes,
        overtimePay: salaryCalc.overtimePay,
        allowance,
        totalSalary: salaryCalc.totalSalary,
        notes,
      });
    }

    // 統計
    const validRows = results.filter((r) => !r.error);
    const errorRows = results.filter((r) => r.error);
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
              startTime: r.startTime,
              endTime: r.endTime,
              hours: r.hours,
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
  // 處理各種時間格式
  const cleaned = String(time).trim();
  
  // 已經是 HH:mm 格式
  if (/^\d{1,2}:\d{2}$/.test(cleaned)) {
    const [h, m] = cleaned.split(":");
    return `${h.padStart(2, "0")}:${m}`;
  }
  
  // 處理 Excel 時間序列 (0-1 之間的小數)
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
  
  // 已經是 YYYY-MM-DD 格式
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }
  
  // 處理 YYYY/MM/DD 或 MM/DD/YYYY
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(cleaned)) {
    const [y, m, d] = cleaned.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  
  // 處理 Excel 序列日期
  const num = parseFloat(cleaned);
  if (!isNaN(num) && num > 40000 && num < 60000) {
    const date = new Date((num - 25569) * 86400 * 1000);
    return date.toISOString().split("T")[0];
  }
  
  // 嘗試解析
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

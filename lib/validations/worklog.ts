import { z } from "zod";

// 薪資計算設定
export const SALARY_CONFIG = {
  BASE_HOURS: 4, // 基本時數（4小時內發基本薪資）
  OVERTIME_INTERVAL: 10, // 加班計算間隔（分鐘）
  DEFAULT_OVERTIME_RATE: 50, // 預設每10分鐘加班費
};

// WorkLog validation schemas
export const workLogSchema = z.object({
  staffId: z.string().min(1, "員工 ID 為必填"),
  date: z.string().min(1, "日期為必填"),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "時間格式不正確 (HH:mm)"),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "時間格式不正確 (HH:mm)"),
  eventId: z.string().optional().nullable(),
  baseSalary: z.number().min(0, "基本薪資不能為負數"),
  overtimePay: z.number().min(0, "加班費不能為負數").default(0),
  allowance: z.number().min(0, "補助不能為負數").default(0),
  notes: z.string().optional().nullable(),
  source: z.enum(["IMPORT", "MANUAL", "SYSTEM"]).default("MANUAL"),
});

export const createWorkLogSchema = workLogSchema;
export const updateWorkLogSchema = workLogSchema.partial();

// 匯入資料格式
export const importRowSchema = z.object({
  staffName: z.string().min(1, "員工姓名為必填"),
  date: z.string().min(1, "日期為必填"),
  startTime: z.string().min(1, "集合時間為必填"),
  endTime: z.string().min(1, "下班時間為必填"),
  allowance: z.number().default(0), // 雜費/補助
  overtimeRate: z.number().default(SALARY_CONFIG.DEFAULT_OVERTIME_RATE), // 可調整的加班費率
  notes: z.string().optional(),
});

export type WorkLogInput = z.infer<typeof workLogSchema>;
export type ImportRowInput = z.infer<typeof importRowSchema>;

// 計算工時（分鐘）
export function calculateMinutes(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  
  let startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;
  
  // 處理跨夜情況
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  
  return endMinutes - startMinutes;
}

// 計算小時（四捨五入到小數一位）
export function calculateHours(minutes: number): number {
  return Math.round(minutes / 6) / 10; // 6分鐘 = 0.1小時
}

// 計算薪資
export function calculateSalary(
  startTime: string,
  endTime: string,
  baseSalary: number,
  allowance: number = 0,
  overtimeRate: number = SALARY_CONFIG.DEFAULT_OVERTIME_RATE
): {
  hours: number;
  overtimeMinutes: number;
  overtimePay: number;
  totalSalary: number;
} {
  const totalMinutes = calculateMinutes(startTime, endTime);
  const hours = calculateHours(totalMinutes);
  const baseMinutes = SALARY_CONFIG.BASE_HOURS * 60; // 240分鐘
  
  let overtimeMinutes = 0;
  let overtimePay = 0;
  
  if (totalMinutes > baseMinutes) {
    overtimeMinutes = totalMinutes - baseMinutes;
    // 每10分鐘計算一次加班費
    const overtimeIntervals = Math.floor(overtimeMinutes / SALARY_CONFIG.OVERTIME_INTERVAL);
    overtimePay = overtimeIntervals * overtimeRate;
  }
  
  const totalSalary = baseSalary + overtimePay + allowance;
  
  return {
    hours,
    overtimeMinutes,
    overtimePay,
    totalSalary,
  };
}

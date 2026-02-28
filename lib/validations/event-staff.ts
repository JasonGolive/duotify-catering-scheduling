import { z } from "zod";

// 出勤狀態
export const attendanceStatusEnum = z.enum([
  "SCHEDULED",
  "CONFIRMED", 
  "ATTENDED",
  "LATE",
  "ABSENT",
  "CANCELLED",
]);

// 工作角色（使用 Staff 的 Skill）
export const workRoleEnum = z.enum(["FRONT", "HOT", "DECK"]);

// EventStaff validation schemas
export const eventStaffSchema = z.object({
  staffId: z.string().min(1, "員工 ID 為必填"),
  role: workRoleEnum,
  salary: z.number().min(0, "薪資不能為負數"),
  attendanceStatus: attendanceStatusEnum.optional(),
  actualHours: z.number().min(0).max(24).optional().nullable(),
  adjustedSalary: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createEventStaffSchema = eventStaffSchema.extend({
  attendanceStatus: attendanceStatusEnum.default("SCHEDULED"),
});

export const updateEventStaffSchema = z.object({
  role: workRoleEnum.optional(),
  salary: z.number().min(0).optional(),
  attendanceStatus: attendanceStatusEnum.optional(),
  actualHours: z.number().min(0).max(24).optional().nullable(),
  adjustedSalary: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type EventStaffInput = z.infer<typeof eventStaffSchema>;
export type CreateEventStaffInput = z.infer<typeof createEventStaffSchema>;
export type UpdateEventStaffInput = z.infer<typeof updateEventStaffSchema>;

// 出勤狀態標籤（中文）
export const attendanceStatusLabels: Record<string, string> = {
  SCHEDULED: "已排班",
  CONFIRMED: "已確認",
  ATTENDED: "已出勤",
  LATE: "遲到",
  ABSENT: "缺勤",
  CANCELLED: "取消",
};

// 工作角色標籤（中文）
export const workRoleLabels: Record<string, string> = {
  FRONT: "外場",
  HOT: "熱台",
  DECK: "皆可",
};

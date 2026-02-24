import { z } from "zod";

// Event validation schemas
export const eventSchema = z.object({
  name: z
    .string()
    .min(1, "活動名稱為必填")
    .max(200, "活動名稱不能超過 200 個字元"),
  
  date: z.string().min(1, "日期為必填"),
  
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "時間格式不正確 (HH:mm)")
    .optional()
    .nullable(),
  
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "時間格式不正確 (HH:mm)")
    .optional()
    .nullable(),
  
  location: z
    .string()
    .min(1, "地點為必填")
    .max(200, "地點不能超過 200 個字元"),
  
  address: z.string().optional().nullable(),
  
  expectedGuests: z
    .number()
    .int("人數必須為整數")
    .positive("人數必須為正數")
    .max(10000, "人數不能超過 10,000")
    .optional()
    .nullable(),
  
  contactName: z
    .string()
    .max(100, "聯絡人姓名不能超過 100 個字元")
    .optional()
    .nullable(),
  
  contactPhone: z
    .string()
    .max(20, "電話號碼不能超過 20 個字元")
    .optional()
    .nullable(),
  
  eventType: z.enum(["WEDDING", "YEAREND", "SPRING", "BIRTHDAY", "CORPORATE", "OTHER"]),
  
  notes: z.string().optional().nullable(),
  
  status: z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

export const createEventSchema = eventSchema.extend({
  eventType: z.enum(["WEDDING", "YEAREND", "SPRING", "BIRTHDAY", "CORPORATE", "OTHER"]).default("OTHER"),
  status: z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("PENDING"),
});

export const updateEventSchema = eventSchema.partial();

export type EventInput = z.infer<typeof eventSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

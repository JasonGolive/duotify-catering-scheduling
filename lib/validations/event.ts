import { z } from "zod";

// 支付方式
export const paymentMethodEnum = z.enum(["TRANSFER", "CASH", "HOTEL_PAID", "OTHER"]);

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
  
  // 場地
  venueId: z.string().optional().nullable(),
  location: z
    .string()
    .min(1, "地點為必填")
    .max(200, "地點不能超過 200 個字元"),
  address: z.string().optional().nullable(),
  
  // 訂餐人數
  adultsCount: z
    .number()
    .int("人數必須為整數")
    .min(0, "人數不能為負數")
    .max(10000, "人數不能超過 10,000")
    .optional()
    .nullable(),
  childrenCount: z
    .number()
    .int("人數必須為整數")
    .min(0, "人數不能為負數")
    .max(10000, "人數不能超過 10,000")
    .optional()
    .nullable(),
  vegetarianCount: z
    .number()
    .int("人數必須為整數")
    .min(0, "人數不能為負數")
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
  
  // 金額
  totalAmount: z.number().min(0, "金額不能為負數").optional().nullable(),
  
  // 訂金
  depositAmount: z.number().min(0, "金額不能為負數").optional().nullable(),
  depositMethod: paymentMethodEnum.optional().nullable(),
  depositDate: z.string().optional().nullable(),
  
  // 尾款
  balanceAmount: z.number().min(0, "金額不能為負數").optional().nullable(),
  balanceMethod: paymentMethodEnum.optional().nullable(),
  balanceDate: z.string().optional().nullable(),
  
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

// Venue validation schemas
export const venueSchema = z.object({
  name: z
    .string()
    .min(1, "場地名稱為必填")
    .max(200, "場地名稱不能超過 200 個字元"),
  address: z.string().optional().nullable(),
  contactName: z.string().max(100).optional().nullable(),
  contactPhone: z.string().max(20).optional().nullable(),
  equipment: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateVenueSchema = venueSchema.partial();

export type VenueInput = z.infer<typeof venueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;

// Staff Availability validation schemas
export const staffAvailabilitySchema = z.object({
  staffId: z.string().min(1, "員工 ID 為必填"),
  date: z.string().min(1, "日期為必填"),
  available: z.boolean().default(true),
  reason: z.string().max(200).optional().nullable(),
});

export type StaffAvailabilityInput = z.infer<typeof staffAvailabilitySchema>;

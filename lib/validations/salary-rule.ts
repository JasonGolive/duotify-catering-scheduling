import { z } from "zod";

// Condition schema for salary rules
export const salaryRuleConditionSchema = z.object({
  dayOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0=Sunday, 6=Saturday
  holiday: z.boolean().optional(),
  timeRange: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    end: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  }).optional(),
  eventType: z.array(z.string()).optional(),
  minHours: z.number().positive().optional(),
  isDriver: z.boolean().optional(),
}).passthrough(); // Allow additional custom conditions

export const salaryRuleSchema = z.object({
  name: z
    .string()
    .min(1, "規則名稱為必填")
    .max(100, "規則名稱不能超過 100 字元"),
  
  type: z.enum(["PERCENTAGE", "FIXED"], {
    message: "類型必須是 PERCENTAGE 或 FIXED",
  }),
  
  value: z
    .number()
    .nonnegative("金額/百分比不能為負數"),
  
  condition: salaryRuleConditionSchema,
  
  isActive: z.boolean().default(true),
  
  priority: z.number().int().default(0),
});

// For creating a new salary rule
export const createSalaryRuleSchema = salaryRuleSchema;

// For updating salary rule (all fields optional)
export const updateSalaryRuleSchema = salaryRuleSchema.partial();

// Type inference
export type SalaryRuleInput = z.infer<typeof salaryRuleSchema>;
export type CreateSalaryRuleInput = z.infer<typeof createSalaryRuleSchema>;
export type UpdateSalaryRuleInput = z.infer<typeof updateSalaryRuleSchema>;
export type SalaryRuleCondition = z.infer<typeof salaryRuleConditionSchema>;

// Salary calculation request schema
export const calculateSalarySchema = z.object({
  staffId: z.string().min(1, "員工 ID 為必填"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必須是 YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必須是 YYYY-MM-DD"),
});

export type CalculateSalaryInput = z.infer<typeof calculateSalarySchema>;

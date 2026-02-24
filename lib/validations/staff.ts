import { z } from "zod";

// Phone number validation and normalization
const phoneRegex = /^[\d\s\-+()]+$/;

export const staffSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(phoneRegex, "Phone number contains invalid characters")
    .transform((val) => val.replace(/[\s\-+()]/g, "")), // Normalize: remove formatting
  
  skill: z.enum(["FRONT", "HOT", "DECK"], {
    message: "Skill must be FRONT, HOT, or DECK",
  }),
  
  perEventSalary: z
    .number()
    .positive("Salary must be positive")
    .max(1000000, "Salary cannot exceed NT$1,000,000"),
  
  notes: z
    .string()
    .optional()
    .nullable(),
  
  status: z.enum(["ACTIVE", "INACTIVE"], {
    message: "Status must be ACTIVE or INACTIVE",
  }),
});

// For creating a new staff member (status defaults to ACTIVE if not provided)
export const createStaffSchema = staffSchema.extend({
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  skill: z.enum(["FRONT", "HOT", "DECK"]).default("FRONT"),
});

// For updating staff (all fields optional except id)
export const updateStaffSchema = staffSchema.partial();

// Type inference
export type StaffInput = z.infer<typeof staffSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

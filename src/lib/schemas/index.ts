import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const MissionSchemaBase = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description needs to be detailed"),
  price_per_minute: z.number().positive(),
  task_type: z
    .string()
    .min(1)
    .transform((value) => value.toLowerCase())
    .pipe(z.enum(["manipulation", "navigation", "inspection", "other", "kitchen_manipulation", "warehouse_navigation", "aerial_inspection"])),
  environment_type: z
    .string()
    .min(1)
    .transform((value) => value.toLowerCase())
    .pipe(z.enum(["indoor", "outdoor", "mixed", "any"])),
  required_resolution: z.string().min(2).max(64).optional(),
  required_fps: z.number().int().positive().max(240).optional(),
  min_duration_seconds: z.number().int().positive().optional(),
  max_duration_seconds: z.number().int().positive().optional(),
  webhook_url: z.string().url().optional().or(z.literal("")),
  webhook_secret: z.string().optional().or(z.literal("")),
  license_type: z.enum(["EXCLUSIVE", "NON_EXCLUSIVE", "TIME_LIMITED", "RESEARCH_ONLY"]),
})

export const MissionSchema = MissionSchemaBase.superRefine((data, ctx) => {
  if (
    data.min_duration_seconds !== undefined &&
    data.max_duration_seconds !== undefined &&
    data.min_duration_seconds > data.max_duration_seconds
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "min_duration_seconds cannot be greater than max_duration_seconds",
      path: ["min_duration_seconds"],
    });
  }
});

export const MissionUpdateSchema = MissionSchemaBase.pick({
  title: true,
  description: true,
  price_per_minute: true,
  license_type: true,
  task_type: true,
  environment_type: true,
  required_resolution: true,
  required_fps: true,
  min_duration_seconds: true,
  max_duration_seconds: true,
  webhook_url: true,
  webhook_secret: true,
}).partial().superRefine((data, ctx) => {
  if (
    data.min_duration_seconds !== undefined &&
    data.max_duration_seconds !== undefined &&
    data.min_duration_seconds > data.max_duration_seconds
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "min_duration_seconds cannot be greater than max_duration_seconds",
      path: ["min_duration_seconds"],
    });
  }
});

export const ReviewSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
  accepted_minutes: z.number().nonnegative().optional(),
  rejection_reason: z.string().optional(),
});

export const ApiKeySchema = z.object({
  name: z.string().min(1, "Key name is required"),
  company_id: z.string().uuid().optional(),
});

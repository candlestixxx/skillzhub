import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const MissionSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description needs to be detailed"),
  price_per_minute: z.number().positive(),
  task_type: z.string(),
  environment_type: z.string(),
  webhook_url: z.string().url().optional().or(z.literal("")),
  webhook_secret: z.string().optional().or(z.literal("")),
  license_type: z.enum(["EXCLUSIVE", "NON_EXCLUSIVE", "TIME_LIMITED", "RESEARCH_ONLY"]),
});

export const ReviewSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
  accepted_minutes: z.number().nonnegative().optional(),
  rejection_reason: z.string().optional(),
});

export const ApiKeySchema = z.object({
  name: z.string().min(1, "Key name is required"),
});

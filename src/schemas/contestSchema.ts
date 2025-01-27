import { z } from "zod";
import type { ContestSettings, ContestStatus } from "../types/index";

// Use the existing ContestStatus type
const contestStatusSchema = z.enum([
  "pending",
  "active",
  "completed",
  "cancelled",
]) satisfies z.ZodType<ContestStatus>;

// Use the existing ContestSettings type
const contestSettingsSchema = z.object({
  difficulty: z.enum([
    "guppy",
    "tadpole",
    "squid",
    "dolphin",
    "shark",
    "whale",
  ]),
  min_trades: z.number().min(1),
  max_participants: z.number().min(2),
  min_participants: z.number().min(2),
  token_types: z.array(z.string()),
  rules: z.array(z.string()),
}) satisfies z.ZodType<ContestSettings>;

// Schema for form validation
export const contestFormSchema = z.object({
  name: z.string().min(1, "Contest name is required"),
  description: z.string().min(1, "Description is required"),
  entry_fee: z.string().regex(/^\d*\.?\d*$/, "Must be a valid number"),
  prize_pool: z.string(),
  current_prize_pool: z.string().optional(),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  entry_deadline: z.string().optional(),
  allowed_buckets: z.array(z.number()).min(1, "Select at least one bucket"),
  participant_count: z.number(),
  last_entry_time: z.string().optional(),
  status: contestStatusSchema,
  cancelled_at: z.string().optional(),
  cancellation_reason: z.string().optional(),
  settings: contestSettingsSchema,
});

export type ContestFormData = z.infer<typeof contestFormSchema>;

import { z } from "zod";
import { REQUEST_STATUSES, REQUEST_PRIORITIES, ACTIVITY_TYPES } from "@/db/schema";

export const requestFormSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  requester: z.string().optional(),
  openedAt: z.string().min(1, "Data de abertura é obrigatória"),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  status: z.enum(REQUEST_STATUSES),
  priority: z.enum(REQUEST_PRIORITIES),
  notes: z.string().optional(),
});

export type RequestFormInput = z.infer<typeof requestFormSchema>;

const timeEntryBase = z.object({
  requestId: z.coerce.number().int().positive(),
  date: z.string().min(1, "Data é obrigatória"),
  activityType: z.enum(ACTIVITY_TYPES),
  description: z.string().optional(),
  startTime: z.string().optional().or(z.literal("")),
  endTime: z.string().optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().positive().optional(),
});

export const timeEntryFormSchema = timeEntryBase.superRefine((data, ctx) => {
  const hasRange = !!data.startTime && !!data.endTime;
  const hasDirectDuration = !!data.durationMinutes && data.durationMinutes > 0;

  if (!hasRange && !hasDirectDuration) {
    ctx.addIssue({
      code: "custom",
      message: "Informe horário inicial/final OU a duração direta.",
      path: ["durationMinutes"],
    });
  }
  if (hasRange) {
    const [sh, sm] = data.startTime!.split(":").map(Number);
    const [eh, em] = data.endTime!.split(":").map(Number);
    if (eh * 60 + em <= sh * 60 + sm) {
      ctx.addIssue({
        code: "custom",
        message: "A hora final deve ser posterior à hora inicial.",
        path: ["endTime"],
      });
    }
  }
});

export type TimeEntryFormInput = z.infer<typeof timeEntryBase>;

export const contractFormSchema = z.object({
  hoursPart: z.coerce.number().int().nonnegative(),
  minutesPart: z.coerce.number().int().min(0).max(59),
  closingDay: z.coerce.number().int().min(1).max(31),
  monthlyValueCents: z.coerce.number().int().nonnegative().optional(),
  overtimeHourValueCents: z.coerce.number().int().nonnegative().optional(),
});

export const clientFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const newClientFormSchema = clientFormSchema.extend({
  hoursPart: z.coerce.number().int().nonnegative(),
  minutesPart: z.coerce.number().int().min(0).max(59),
  closingDay: z.coerce.number().int().min(1).max(31),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  monthlyValueCents: z.coerce.number().int().nonnegative().optional(),
  overtimeHourValueCents: z.coerce.number().int().nonnegative().optional(),
});

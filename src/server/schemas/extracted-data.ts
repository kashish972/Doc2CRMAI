import { z } from "zod";

export const extractedDataSchema = z.object({
  fullName: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  company: z.string().default(""),
  documentType: z.string().default(""),
  amount: z.number().nullable().default(null),
  currency: z.string().default("USD"),
  date: z.string().default(""),
  notes: z.string().default(""),
  tags: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0),
});

export type ExtractedData = z.infer<typeof extractedDataSchema>;

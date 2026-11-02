import { z } from "zod";
import { companyInputSchema } from "./company";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

export const chatRequestSchema = z.object({
  publicId: z.string().uuid(),
  profile: companyInputSchema,
  messages: z.array(chatMessageSchema).min(1).max(40),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

import { z } from "zod";

export const UserStateSchema = z
  .enum(["我有点慌", "我不知道该怎么选", "钱的事让我压力很大", "我想慢慢想，不急", ""])
  .default("");

export const ProblemCategorySchema = z
  .enum(["账单/欠费", "吃饭/出行/日常花销", "工作/时间安排", "其他/说不清", ""])
  .default("");

export const DecisionContextSchema = z.object({
  state: UserStateSchema,
  category: ProblemCategorySchema,
  language: z.string().default("zh"),
  mode: z.enum(["text", "voice"]).default("text"),
});

export const DecisionRequestSchema = z.object({
  text: z.string().min(1, "text is required").max(4000, "text too long"),
  context: DecisionContextSchema,
});

export const DecisionCardSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  items: z.array(z.string()).optional(),
});

export const DecisionResponseSchema = z.object({
  cards: z.array(DecisionCardSchema).min(1),
});

export type DecisionRequest = z.infer<typeof DecisionRequestSchema>;
export type DecisionResponse = z.infer<typeof DecisionResponseSchema>;

// 模型输出（包含分类与置信度）
export const ModelOutputSchema = z.object({
  decision_type: z.enum(["urgent_bill", "daily_spending", "time_work", "unclear"]),
  confidence: z.number().min(0).max(1),
  cards: z.array(DecisionCardSchema).min(1),
});

export type ModelOutput = z.infer<typeof ModelOutputSchema>;
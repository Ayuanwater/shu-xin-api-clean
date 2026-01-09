import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("Missing OPENAI_API_KEY");
}

// 默认模型：先用稳定便宜的，跑通后你再在 Vercel 里改
export const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

export const openai = new OpenAI({ apiKey });
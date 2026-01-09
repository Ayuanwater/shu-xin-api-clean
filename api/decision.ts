import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleDecision } from "../lib/audit";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // ====== CORS 关键部分（必须有）======
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 处理浏览器的预检请求
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  // ====== CORS 结束 ======

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const result = await handleDecision(req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error("Decision API error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      fallback: true,
    });
  }
}
fix: add CORS headers

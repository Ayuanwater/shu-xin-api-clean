import { openai, MODEL } from "../lib/openai.js";
import {
  DecisionRequestSchema,
  DecisionResponseSchema,
  ModelOutputSchema,
  type DecisionRequest,
  type DecisionResponse,
} from "../lib/schemas.js";
import { fallbackResponse } from "../lib/fallback.js";
import { softenLanguage } from "../lib/audit.js";

function safeJsonParse(text: string): unknown | null {
  const trimmed = text.trim();

  // 1) 直接 parse
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2) 尝试截取第一个 JSON 对象（模型偶尔会多吐解释）
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function clampText(s: string, max = 2000): string {
  const cleaned = s.replace(/[\u0000-\u001F\u007F]/g, " ").trim();
  return cleaned.length > max ? cleaned.slice(0, max) : cleaned;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    const parsed = DecisionRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Bad Request", detail: parsed.error.flatten() });
      return;
    }

    const request: DecisionRequest = {
      ...parsed.data,
      text: clampText(parsed.data.text, 2000),
    };

    const system = `
你是“决策辅助”助手：不替用户做最终决定，只帮用户把情况捋清楚。
你必须输出严格 JSON，不要输出任何多余文本。
你要避免：命令式口吻、价值排序、长期画像、要求用户提供隐私细节。
输出字段：
- decision_type: "urgent_bill" | "daily_spending" | "time_work" | "unclear"
- confidence: 0~1（越确定越高）
- cards: 3~4 张卡片，每张：title（必填），content（可选），items（可选 string[]）
语言：中文。
`;

    const user = `
用户状态：${request.context.state}
事情分类：${request.context.category}
用户描述：${request.text}

请给出 3-4 张“思考建议卡片”，用于理清现状，但不要替我做最终决定。
`;

    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    const json = safeJsonParse(raw);

    // 校验模型输出：类型 + 置信度 + cards
    const modelOut = ModelOutputSchema.safeParse(json);

    let resp: DecisionResponse;

    // fallback 条件：解析失败 or 低置信度
    if (!modelOut.success || modelOut.data.confidence < 0.6) {
      resp = fallbackResponse(request);
    } else {
      // 只返回 cards（再做一次结构校验）
      const candidate = { cards: modelOut.data.cards };
      const ok = DecisionResponseSchema.safeParse(candidate);
      resp = ok.success ? ok.data : fallbackResponse(request);
    }

    // 语气软化（避免“你应该/你必须”）
    resp = softenLanguage(resp);

    res.status(200).json(resp);
  } catch (err) {
    // 异常兜底：不暴露错误细节，返回温和 fallback
    res.status(200).json({
      cards: [
        { title: "系统有点忙", content: "我暂时没法给出完整建议，但我们可以先做一步最小的整理。" },
        { title: "三句话模板", items: ["我最担心的是：___", "最晚必须在___前处理", "我目前能用的资源是：___"] },
        { title: "你不需要立刻决定", content: "先把信息写清楚，再回来问我，我们一起慢慢捋。" },
      ],
    });
  }
}
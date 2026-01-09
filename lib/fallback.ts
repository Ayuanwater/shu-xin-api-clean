import type { DecisionRequest, DecisionResponse } from "./schemas.js";

export function fallbackResponse(req: DecisionRequest): DecisionResponse {
  const { text, context } = req;
  const state = context.state || "不太确定";
  const category = context.category || "其他/说不清";

  return {
    cards: [
      {
        title: "我听到的是",
        content: `你刚才说：“${text.slice(0, 200)}${text.length > 200 ? "…" : ""}”。我理解你现在感觉「${state}」，事情大概属于「${category}」。`,
      },
      {
        title: "先把问题拆成三块",
        items: [
          "这件事最晚什么时候必须处理？（截止时间）",
          "现在最卡住的是信息不足、钱不足，还是情绪压力太大？",
          "如果只能先做一步，最小可行的一步是什么？",
        ],
      },
      {
        title: "一个温和的下一步",
        content:
          "如果你现在压力很大，可以先暂停 2 分钟：喝口水、做 3 次慢呼吸，然后只做“收集信息/写下选项”这一步，不急着做最终决定。",
      },
    ],
  };
}
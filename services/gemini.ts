
import { DivinationData } from "../types";
import { HEXAGRAM_NAMES } from "../constants";

/**
 * 使用 DeepSeek 模型进行周易六爻解析
 * 注意：此处根据用户要求切换至 DeepSeek 接口
 */
export const interpretDivination = async (data: DivinationData) => {
  const originalHex = data.throws.map(t => (t.lineType === 'yang' || t.lineType === 'old_yang' ? '1' : '0')).join('');
  const changedHex = data.throws.map(t => {
    if (t.lineType === 'old_yang') return '0';
    if (t.lineType === 'old_yin') return '1';
    return t.lineType === 'yang' ? '1' : '0';
  }).join('');

  const originalName = HEXAGRAM_NAMES[originalHex] || '未知卦';
  const changedName = HEXAGRAM_NAMES[changedHex] || '未知卦';

  const prompt = `你是一位精通《周易》六爻、传统易理与现代心理学的解卦宗师。
  
用户咨询：${data.type}
具体问题：${data.question}

起卦详情：
- 本卦：${originalName} (${originalHex})
- 变卦：${changedName} (${changedHex})
- 六爻详情（由下至上）：
${data.throws.map((t, i) => `  第${i + 1}爻: ${t.lineType === 'old_yang' ? '老阳(动)' : t.lineType === 'old_yin' ? '老阴(动)' : t.lineType === 'yang' ? '少阳' : '少阴'}`).join('\n')}

请按以下结构提供深度解析：
### 1. 卦象全解
解析本卦与变卦的整体吉凶，阐述当前态势。
### 2. 动爻玄机
重点分析动爻对咨询问题的具体预示。
### 3. 行动建议
根据易理，针对 "${data.question}" 给出具体的行动指南。
### 4. 易经寄语
一句短语总结应对之道。`;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是一位专业的易经占卜师，语言庄重、玄妙且富有洞察力。" },
          { role: "user", content: prompt }
        ],
        stream: false,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`AI 服务感应中断 (Code: ${response.status})，请稍后再试。`);
    }

    const json = await response.json();
    return json.choices[0].message.content;
  } catch (error: any) {
    console.error("DeepSeek Service Error:", error);
    throw new Error("天地感应阻塞，请检查网络或 API 配置。");
  }
};

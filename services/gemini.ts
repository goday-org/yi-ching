import { DivinationData } from "../types";

import { getAccessToken } from "./auth";

/**
 * 使用后台 API 进行周易六爻解析，隐藏 API KEY 和 Prompt 保证安全
 */
export const interpretDivination = async (
  data: DivinationData, 
  onUpdate?: (text: string) => void,
  onStart?: () => void
) => {
  try {
    const token = await getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch("/api/divine", {
      method: "POST",
      headers,
      body: JSON.stringify({ data })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `AI 服务感应中断 (Code: ${response.status})，请稍后再试。`);
    }

    if (onStart) onStart();

    if (!response.body) {
      throw new Error("天地无感，虚空无语。");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let resultText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // 最后一行可能不完整（比如正在传输中的 JSON），保留到下个 chunk 处理
      buffer = lines.pop() || "";

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // 匹配 data: 开头的行，并提取后面的内容
        // SSE 规范允许 data:后面没有空格，也可能有多个空格
        const match = line.match(/^data:\s*(.*)$/);
        if (match) {
          const jsonStr = match[1].trim();
          
          if (!jsonStr || jsonStr === '[DONE]') continue;
          
          try {
            const json = JSON.parse(jsonStr);
            const content = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (content) {
              resultText += content;
              if (onUpdate) onUpdate(resultText);
            }
          } catch (e) {
            // 忽略由于分块导致的、暂时无法解析为完整 JSON 的行
            console.warn("Skipping partial/invalid JSON chunk:", jsonStr);
          }
        }
      }
    }
    
    return resultText;
  } catch (error: any) {
    console.error("API Service Error:", error);
    throw new Error(error.message || "天地感应阻塞，请检查网络或配置。");
  }
};

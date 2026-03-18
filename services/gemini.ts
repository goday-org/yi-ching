import { DivinationData } from "../types";

import { getAccessToken } from "./auth";

/**
 * 使用后台 API 进行周易六爻解析，隐藏 API KEY 和 Prompt 保证安全
 */
export const interpretDivination = async (data: DivinationData, onUpdate?: (text: string) => void) => {
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
      // 最后一行可能不完整，保留到下个 chunk
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.replace('data: ', '').trim();
            if (jsonStr === '[DONE]') break;
            const json = JSON.parse(jsonStr);
            const content = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (content) {
              resultText += content;
              if (onUpdate) onUpdate(resultText);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
    
    // 处理最后可能剩下的 buffer
    if (buffer.startsWith('data: ')) {
      try {
        const jsonStr = buffer.replace('data: ', '').trim();
        const json = JSON.parse(jsonStr);
        const content = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (content) {
          resultText += content;
          if (onUpdate) onUpdate(resultText);
        }
      } catch (e) {}
    }
    
    return resultText;
  } catch (error: any) {
    console.error("API Service Error:", error);
    throw new Error(error.message || "天地感应阻塞，请检查网络或配置。");
  }
};

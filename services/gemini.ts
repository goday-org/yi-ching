import { DivinationData } from "../types";
import { getAccessToken } from "./auth";

/**
 * 使用后台 API 进行周易六爻解析，隐藏 API KEY 和 Prompt 保证安全
 */
export const interpretDivination = async (
  data: DivinationData, 
  onUpdate?: (chunk: string) => void,
  onStart?: () => void
) => {
  try {
    const token = await getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "text/event-stream",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch("/api/divine", {
      method: "POST",
      headers,
      body: JSON.stringify({ data })
    });

    if (onStart) onStart();

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `AI 服务感应中断 (Code: ${response.status})，请稍后再试。`);
    }

    if (!response.body) {
      throw new Error("天地无感，虚空无语。");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let resultText = "";
    let lineBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      lineBuffer += decoder.decode(value, { stream: true });
      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        
        const dataStr = trimmed.slice(6);
        if (dataStr === "[DONE]") continue;

        try {
          const json = JSON.parse(dataStr);
          
          // 如果后端传回了错误信息字段 'e'
          if (json.e) {
            throw new Error(json.e);
          }

          const chunk = json.t || ""; // AI 内容字段 't'
          if (chunk) {
            resultText += chunk;
            if (onUpdate) onUpdate(chunk); // 仅传回增量
          }
        } catch (e) {
          // 如果是我们手动抛出的错误，继续抛出
          if (e instanceof Error && (e.message.includes('未授权') || e.message.includes('次数已用尽') || e.message.includes('异常') || e.message.includes('感应') || e.message.includes('精神不振'))) {
            throw e;
          }
          // 其他解析错误可能是行未读全，忽略
        }
      }
    }

    return resultText;
  } catch (error: any) {
    console.error("API Service Error:", error);
    throw new Error(error.message || "天地感应阻塞，请检查网络或配置。");
  }
};

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
    const decoder = new TextDecoder("utf-8");
    let resultText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // 增量解码纯文本流
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        resultText += chunk;
        if (onUpdate) onUpdate(resultText);
      }
    }
    
    // 如果存在未处理完毕的数据（正常情况下 stream: true 已经处理完善）
    const tail = decoder.decode();
    if (tail) {
      resultText += tail;
      if (onUpdate) onUpdate(resultText);
    }

    return resultText;
  } catch (error: any) {
    console.error("API Service Error:", error);
    throw new Error(error.message || "天地感应阻塞，请检查网络或配置。");
  }
};

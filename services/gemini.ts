import { DivinationData } from "../types";

import { getAccessToken } from "./auth";

/**
 * 使用后台 API 进行周易六爻解析，隐藏 API KEY 和 Prompt 保证安全
 */
export const interpretDivination = async (data: DivinationData) => {
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
      // 仅发送原始卜卦数据，由后端 Vercel API 隐藏并处理 Prompt
      body: JSON.stringify({ data })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `AI 服务感应中断 (Code: ${response.status})，请稍后再试。`);
    }

    const { result, error } = await response.json();
    
    if (error) {
       throw new Error(error);
    }
    
    return result;
  } catch (error: any) {
    console.error("API Service Error:", error);
    throw new Error(error.message || "天地感应阻塞，请检查网络或配置。");
  }
};

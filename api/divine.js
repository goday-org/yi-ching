export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // 优先使用 VERCEL 设置的 DEEPSEEK_API_KEY，如果没有则兼容读取原来 VITE 环境变量名（部署时如果配了也会存放在 process.env 中）
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: '服务端未配置 API Key' });
    }

    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "Pro/zai-org/GLM-5",
        messages: [
          { role: "system", content: "你是一位专业的易经占卜师，语言庄重、玄妙且富有洞察力。" },
          { role: "user", content: prompt }
        ],
        stream: false,
        temperature: 0.7,
        enable_thinking: false,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `大模型请求异常: ${response.status} - ${errorText}` });
    }

    const json = await response.json();
    return res.status(200).json({ result: json.choices[0].message.content });
  } catch (err) {
    console.error("Vercel Serverless Function Error:", err);
    return res.status(500).json({ error: "服务器内部错误，感应阻塞。" });
  }
}

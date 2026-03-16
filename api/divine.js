export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // 优先使用 VERCEL 设置的 ARK 环境变量（火山引擎）
    const apiKey = process.env.ARK_API_KEY || process.env.VITE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: '服务端未配置 API Key' });
    }

    // 火山方舟（Volcengine Ark）兼容 OpenAI 接口风格
    const response = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        // 需在对应的 VERCEL 环境变量中设置火山引擎具体的 Endpoint ID 或者对应的模型名称
        model: process.env.ARK_MODEL_ID || "doubao-pro-32k",
        messages: [
          { role: "system", content: "你是一位专业的易经占卜师，语言庄重、玄妙且富有洞察力。" },
          { role: "user", content: prompt }
        ],
        stream: false,
        temperature: 0.7,
        thinking: { type: "disabled" }
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

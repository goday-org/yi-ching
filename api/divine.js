export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // 优先使用 VERCEL 设置的 GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: '服务端未配置 API Key' });
    }

    // Google Gemini API 接入点
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: "你是一位专业的易经占卜师，语言庄重、玄妙且富有洞察力。" }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `大模型请求异常: ${response.status} - ${errorText}` });
    }

    const json = await response.json();
    const resultText = json.candidates?.[0]?.content?.parts?.[0]?.text || "暂无结果";
    return res.status(200).json({ result: resultText });
  } catch (err) {
    console.error("Vercel Serverless Function Error:", err);
    return res.status(500).json({ error: "服务器内部错误，感应阻塞。" });
  }
}

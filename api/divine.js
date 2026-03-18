import { createClient } from '@supabase/supabase-js';

// 易经 64 卦基础名录
const HEXAGRAM_NAMES = {
  "111111": "乾为天", "000000": "坤为地", "010001": "水雷屯", "100010": "山水蒙", "111010": "水天需", "010111": "天水讼", "010000": "地水师", "000010": "水地比", "111011": "风天小畜", "110111": "天泽履", "111000": "地天泰", "000111": "天地否", "101111": "天火同人", "111101": "火天大有", "000100": "地山谦", "001000": "雷地豫", "100110": "泽雷随", "011001": "山风蛊", "110000": "地泽临", "000011": "风地观", "100101": "火雷噬嗑", "101001": "山火贲", "000001": "山地剥", "100000": "地雷复", "100111": "天雷无妄", "111001": "山天大畜", "100001": "山雷颐", "011110": "泽风大过", "010010": "坎为水", "101101": "离为火", "001110": "泽山咸", "011100": "雷风恒", "001111": "天山遁", "111100": "雷天大壮", "000101": "火地晋", "101000": "地火明夷", "101011": "风火家人", "110101": "火泽睽", "001010": "水山蹇", "010100": "雷水解", "110001": "山泽损", "100011": "风雷益", "111110": "泽天夬", "011111": "天风姤", "000110": "泽地萃", "011000": "地风升", "010110": "泽水困", "011010": "水风井", "101110": "泽火革", "011101": "火风鼎", "100100": "震为雷", "001001": "艮为山", "001011": "风山渐", "110100": "雷泽归妹", "101100": "雷火丰", "001101": "火山旅", "011011": "巽为风", "110110": "兑为泽", "010011": "风水涣", "110010": "水泽节", "110011": "风泽中孚", "001100": "雷山小过", "101010": "水火既济", "010101": "火水未济"
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // --- 立即响应策略 (Early Response) ---
  // 发送 Headers 和 Padding，防止 Vercel 超时 (ERR_TIMED_OUT)
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // 立即写出建立连接的消息和 Padding 冲刷代理缓存
  res.write(": connection established\n\n");
  res.write(": " + " ".repeat(2048) + "\n\n");
  if (res.flush) res.flush();

  const { data } = req.body;

  try {
    if (!data || !data.throws || data.throws.length !== 6) {
      res.write(`data: ${JSON.stringify({ e: '卦象数据异常' })}\n\n`);
      return res.end();
    }

    // 1. JWT 鉴权
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.write(`data: ${JSON.stringify({ e: '未授权，请先登录' })}\n\n`);
      return res.end();
    }
    const token = authHeader.split(' ')[1];

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      res.write(`data: ${JSON.stringify({ e: '服务端配置异常' })}\n\n`);
      return res.end();
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      res.write(`data: ${JSON.stringify({ e: '认证失效，请重新登录' })}\n\n`);
      return res.end();
    }

    // 2. 次数限制校验
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      res.write(`data: ${JSON.stringify({ e: '无法获取用户档案' })}\n\n`);
      return res.end();
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('divination_records')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString());

    const used = count || 0;
    const totalAllowed = profile.daily_limit + profile.extra_uses;

    if (used >= totalAllowed) {
      res.write(`data: ${JSON.stringify({ e: '今日起卦次数已用尽，天道忌盈' })}\n\n`);
      return res.end();
    }

    // 3. 执行 AI 解卜
    const originalHex = data.throws.map(t => (t.lineType === 'yang' || t.lineType === 'old_yang' ? '1' : '0')).join('');
    const changedHex = data.throws.map(t => {
      if (t.lineType === 'old_yang') return '0';
      if (t.lineType === 'old_yin') return '1';
      return t.lineType === 'yang' ? '1' : '0';
    }).join('');

    const originalName = HEXAGRAM_NAMES[originalHex] || '未知卦';
    const changedName = HEXAGRAM_NAMES[changedHex] || '未知卦';

    const finalPrompt = `
用户咨询领域：${data.type}
用户求占事项：${data.question}

卦象分析报告：
- 本卦：${originalName} (${originalHex})
- 变卦：${changedName} (${changedHex})
- 逐爻信息（从初爻至上爻排布）：
${data.throws.map((t, i) => `  第${i + 1}爻: ${t.lineType === 'old_yang' ? '老阳(动爻)' : t.lineType === 'old_yin' ? '老阴(动爻)' : t.lineType === 'yang' ? '少阳' : '少阴'}`).join('\n')}

你的任务：
基于上述排盘信息，围绕求测的核心问题进行解答。答案体例必须遵照极简、严肃、隐秘的东方禅意排版进行，言语须像大师批文一般直指南心：
### 〇一 · 卦象全解
解析本卦与变卦的气运总断，判断吉凶及目前的无形磁场态势。
### 〇二 · 动爻玄机
精准解读发生“动”的爻位（如有），揭示事物转化的关键变化契机；若无动爻，则断六爻静象。
### 〇三 · 行动建议
针对求测事件，结合五行生克与卦理，给出具有指导价值的实质性策略。
### 〇四 · 极简箴言
以一句不超过五字的半白话诗意短句总结全盘应对策略，不准加句号。
`;

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;
    if (!apiKey) {
      res.write(`data: ${JSON.stringify({ e: '服务端 API Key 未配置' })}\n\n`);
      return res.end();
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: "你是一位隐脉相传的顶级周易玄学宗师，语言不落俗套，文辞高深玄奥、直指问题本质。回答严格按照提供的段落输出，去除所有多余寒暄。" }]
        },
        contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
        generationConfig: { temperature: 0.7 }
      })
    });

    if (!response.ok) {
      res.write(`data: ${JSON.stringify({ e: `大师精神不振 (Code: ${response.status})` })}\n\n`);
      return res.end();
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let aiBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      aiBuffer += decoder.decode(value, { stream: true });
      const lines = aiBuffer.split('\n');
      aiBuffer = lines.pop() || "";

      for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        
        const jsonStr = trimmed.replace(/^data:\s*/, "");
        if (!jsonStr || jsonStr === '[DONE]') continue;
        
        try {
          const json = JSON.parse(jsonStr);
          const content = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (content) {
            res.write(`data: ${JSON.stringify({ t: content })}\n\n`);
            if (res.flush) res.flush();
          }
        } catch (e) {}
      }
    }
    
    res.end();

  } catch (err) {
    console.error("Vercel Serverless Function Error:", err);
    res.write(`data: ${JSON.stringify({ e: '感应阻塞，请稍后再试' })}\n\n`);
    res.end();
  }
}

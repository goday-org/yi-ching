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
  // 使用 writeHead 强制立即写出，防止 Vercel/中间代理缓冲 Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  // 立即写出 4KB Padding，确保穿透所有中间代理的缓冲区 (如 Cloudflare, Vercel Edge)
  res.write(": connection established\n");
  res.write(": " + " ".repeat(4096) + "\n\n");
  if (res.flush) res.flush();

  const { data } = req.body;

  try {
    if (!data || !data.throws || data.throws.length !== 6) {
      res.write(`data: ${JSON.stringify({ e: '卦象数据异常' })}\n\n`);
      return res.end();
    }

    // 1. 获取基础配置
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.write(`data: ${JSON.stringify({ e: '未授权，请先登录' })}\n\n`);
      return res.end();
    }
    const token = authHeader.split(' ')[1];

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;

    if (!supabaseUrl || !supabaseKey || !apiKey) {
      res.write(`data: ${JSON.stringify({ e: '服务端配置异常' })}\n\n`);
      return res.end();
    }

    // A. 立即发出 AI 请求 (并行主线程)
    const originalHex = data.throws.map(t => (t.lineType === 'yang' || t.lineType === 'old_yang' ? '1' : '0')).join('');
    const changedHex = data.throws.map(t => {
      if (t.lineType === 'old_yang') return '0';
      if (t.lineType === 'old_yin') return '1';
      return t.lineType === 'yang' ? '1' : '0';
    }).join('');

    const originalName = HEXAGRAM_NAMES[originalHex] || '未知卦';
    const changedName = HEXAGRAM_NAMES[changedHex] || '未知卦';

    const finalPrompt = `用户咨询领域：${data.type}\n用户求占事项：${data.question}\n\n卦象分析报告：\n- 本卦：${originalName} (${originalHex})\n- 变卦：${changedName} (${changedHex})\n- 逐爻信息：\n${data.throws.map((t, i) => `  第${i + 1}爻: ${t.lineType.includes('old') ? (t.lineType.includes('yang') ? '老阳(动)' : '老阴(动)') : (t.lineType.includes('yang') ? '少阳' : '少阴')}`).join('\n')}\n\n你的任务：基于上述排盘信息背景，围绕求测的核心问题进行解答。答案体例必须遵照极简、严肃、隐秘的东方禅意排版进行，言语须像大师批文一般直指南心：\n### 〇一 · 卦象全解\n### 〇二 · 动爻玄机\n### 〇三 · 行动建议\n### 〇四 · 极简箴言\n以一句不超过五字的半白话诗意短句总结全盘应对策略，不准加句号。`;

    const aiPromise = fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "你是一位隐脉相传的顶级周易玄学宗师，语言不落俗套，文辞高深玄奥、直指问题本质。回答严格按照提供的段落输出，去除所有多余寒暄。" }] },
        contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
        generationConfig: { temperature: 0.7 }
      })
    });

    const supabase = createClient(supabaseUrl, supabaseKey);

    // B. 后端鉴权与限额校验 (带 6s 硬超时，防止 Lambda 挂起导致 ERR_TIMED_OUT)
    const backendTask = (async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) throw new Error('认证失效，请重新登录');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('divination_records').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', today.toISOString())
      ]);

      if (!profile) throw new Error('无法获取用户档案');
      const used = count || 0;
      if (used >= (profile.daily_limit + profile.extra_uses)) throw new Error('今日起卦次数已用尽，天道忌盈');

      return true;
    })();

    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('感应受阻 (Backend Timeout)')), 6000));

    try {
      await Promise.race([backendTask, timeout]);
    } catch (e) {
      res.write(`data: ${JSON.stringify({ e: e.message })}\n\n`);
      return res.end();
    }

    // C. 处理 AI 响应
    const response = await aiPromise;
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

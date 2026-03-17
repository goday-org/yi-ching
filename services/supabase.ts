import { createClient } from '@supabase/supabase-js';

// 从环境变量读取（Vite 约定使用 VITE_ 前缀）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('缺少 Supabase 环境变量：VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 使用 localStorage 持久化会话
    persistSession: true,
    autoRefreshToken: true,
  },
});

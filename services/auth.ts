import { supabase } from './supabase';
import { UserProfile } from '../types';

/**
 * 注册新用户（用户名 + 密码）
 * 内部将用户名拼接为 username@app.local 格式，对用户不可见
 */
export const signUp = async (username: string, password: string): Promise<UserProfile> => {
  const email = `${username.toLowerCase().trim()}@app.local`;

  // 先检查用户名是否已存在（用 maybeSingle 避免 406 错误）
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.trim())
    .maybeSingle();

  if (existing) {
    throw new Error('该用户名已被使用，请换一个');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username: username.trim() },
    },
  });

  if (error) {
    // 翻译常见错误信息
    if (error.message.includes('already registered')) {
      throw new Error('该用户名已被使用，请换一个');
    }
    throw new Error(`注册失败：${error.message}`);
  }

  if (!data.user) {
    throw new Error('注册失败，请重试');
  }

  // 等待 session 建立 + 触发器创建 profiles 记录
  // 重试最多 5 次，每次间隔递增，防止 RLS 尚未就绪导致查不到
  let profile = null;
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 600 + i * 400));
    profile = await getProfile(data.user.id);
    if (profile) break;
  }

  if (!profile) {
    // 兜底：如果档案确实不存在则手动创建（极少数情况触发器未及时执行）
    const { data: inserted, error: insertErr } = await supabase
      .from('profiles')
      .insert({ id: data.user.id, username: username.trim() })
      .select()
      .single();
    if (insertErr || !inserted) throw new Error('注册成功但用户档案创建失败，请重试');
    profile = inserted as UserProfile;
  }

  return profile;
};

/**
 * 登录
 */
export const signIn = async (username: string, password: string): Promise<UserProfile> => {
  const email = `${username.toLowerCase().trim()}@app.local`;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('用户名或密码错误');
    }
    throw new Error(`登录失败：${error.message}`);
  }

  if (!data.user) throw new Error('登录失败，请重试');

  const profile = await getProfile(data.user.id);
  if (!profile) throw new Error('获取用户信息失败');
  return profile;
};

/**
 * 登出
 */
export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`退出失败：${error.message}`);
};

/**
 * 获取用户档案
 */
export const getProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data as UserProfile;
};

/**
 * 获取当前登录用户及档案（带 1s 超时保护）
 */
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  try {
    // 提升至 5s 超时，确保极高稳定性
    const timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Auth Timeout')), 5000)
    );
    
    const userPromise = supabase.auth.getUser().then(({ data: { user } }) => user);
    
    const user = await Promise.race([userPromise, timeoutPromise]);
    if (!user) return null;
    return getProfile(user.id);
  } catch (err) {
    console.warn('getCurrentUser failed or timed out:', err);
    return null;
  }
};

/**
 * 修改密码
 */
export const updatePassword = async (newPassword: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  if (error) throw new Error(`修改密码失败：${error.message}`);
};

/**
 * 获取当前会话 JWT Token（带超时保护，防止 Supabase 服务不通导致全站卡死）
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    // 获取 Token 也放宽至 5s
    const timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Auth Timeout')), 5000)
    );
    
    const sessionPromise = supabase.auth.getSession().then(({ data }) => data.session?.access_token || null);
    
    return await Promise.race([sessionPromise, timeoutPromise]);
  } catch (err) {
    console.warn('Supabase auth failed or timed out, proceeding as guest');
    return null;
  }
};

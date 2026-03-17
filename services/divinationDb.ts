import { supabase } from './supabase';
import { DivinationData, DivinationRecord, UserProfile } from '../types';

/**
 * 查询用户今日已卜卦次数
 */
export const getTodayUsageCount = async (userId: string): Promise<number> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('divination_records')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  if (error) throw new Error('查询次数失败');
  return count || 0;
};

/**
 * 检查用户今日是否还有可用次数
 * @returns { canDivine: boolean; remaining: number; total: number }
 */
export const checkQuota = async (profile: UserProfile): Promise<{ canDivine: boolean; remaining: number; total: number }> => {
  const used = await getTodayUsageCount(profile.id);
  const total = profile.daily_limit + profile.extra_uses;
  const remaining = Math.max(0, total - used);
  return { canDivine: remaining > 0, remaining, total };
};

/**
 * 保存卜卦记录
 */
export const saveDivinationRecord = async (
  userId: string,
  divinationData: DivinationData,
  hexagram: string,
  result: string
): Promise<DivinationRecord> => {
  const { data, error } = await supabase
    .from('divination_records')
    .insert({
      user_id: userId,
      type: divinationData.type,
      question: divinationData.question,
      hexagram,
      result,
      throws_data: divinationData.throws,
    })
    .select()
    .single();

  if (error) throw new Error(`保存卜卦记录失败：${error.message}`);
  return data as DivinationRecord;
};

/**
 * 获取用户历史卜卦记录（倒序）
 */
export const getUserHistory = async (userId: string, limit = 50): Promise<DivinationRecord[]> => {
  const { data, error } = await supabase
    .from('divination_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error('获取历史记录失败');
  return (data || []) as DivinationRecord[];
};

/** ============ 管理员专用接口 ============ */

/**
 * 获取所有用户列表（管理员）
 */
export const adminGetAllProfiles = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error('获取用户列表失败');
  return (data || []) as UserProfile[];
};

/**
 * 获取各用户今日卜卦次数（管理员）
 */
export const adminGetTodayStats = async (): Promise<{ user_id: string; count: number }[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('divination_records')
    .select('user_id')
    .gte('created_at', today.toISOString());

  if (error) return [];

  // 统计每个用户今日次数
  const countMap: Record<string, number> = {};
  for (const row of (data || [])) {
    countMap[row.user_id] = (countMap[row.user_id] || 0) + 1;
  }
  return Object.entries(countMap).map(([user_id, count]) => ({ user_id, count }));
};

/**
 * 获取全局统计数据（管理员）
 */
export const adminGetStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [userCount, totalRecords, todayRecords] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('divination_records').select('id', { count: 'exact', head: true }),
    supabase.from('divination_records').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
  ]);

  return {
    totalUsers: userCount.count || 0,
    totalDivinations: totalRecords.count || 0,
    todayDivinations: todayRecords.count || 0,
  };
};

/**
 * 给用户增加额外次数（管理员）
 */
export const adminAddExtraUses = async (userId: string, amount: number): Promise<void> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('extra_uses')
    .eq('id', userId)
    .single();

  const newAmount = (profile?.extra_uses || 0) + amount;

  const { error } = await supabase
    .from('profiles')
    .update({ extra_uses: newAmount })
    .eq('id', userId);

  if (error) throw new Error('更新次数失败');
};

/**
 * 更新用户日限额（管理员）
 */
export const adminUpdateDailyLimit = async (userId: string, limit: number): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ daily_limit: limit })
    .eq('id', userId);

  if (error) throw new Error('更新日限额失败');
};

/**
 * 重置用户额外次数为 0（管理员）
 */
export const adminResetExtraUses = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ extra_uses: 0 })
    .eq('id', userId);

  if (error) throw new Error('重置次数失败');
};

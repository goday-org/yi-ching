import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../services/supabase';
import {
  adminGetAllProfiles,
  adminGetTodayStats,
  adminGetStats,
  adminAddExtraUses,
  adminUpdateDailyLimit,
  adminResetExtraUses
} from '../services/divinationDb';

interface AdminPageProps {
  onBack: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onBack }) => {
  const [profiles, setProfiles] = useState<(UserProfile & { todayCount: number })[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalDivinations: 0, todayDivinations: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allProfiles, todayStats, globalStats] = await Promise.all([
        adminGetAllProfiles(),
        adminGetTodayStats(),
        adminGetStats()
      ]);

      const todayMap = new Map(todayStats.map(s => [s.user_id, s.count]));
      
      const merged = allProfiles.map(p => ({
        ...p,
        todayCount: todayMap.get(p.id) || 0
      }));

      setProfiles(merged);
      setStats(globalStats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddUses = async (userId: string, amount: number) => {
    setActionLoading(`add-${userId}`);
    try {
      await adminAddExtraUses(userId, amount);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetUses = async (userId: string) => {
    if (!window.confirm('确认重置该用户的额外次数为 0 吗？')) return;
    setActionLoading(`reset-${userId}`);
    try {
      await adminResetExtraUses(userId);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateLimit = async (userId: string, targetLimit: number) => {
    setActionLoading(`limit-${userId}`);
    try {
      await adminUpdateDailyLimit(userId, targetLimit);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`警告：完全删除用户 [${username}] 及其所有历史记录，不可恢复！确认操作？`)) return;
    
    setActionLoading(`del-${userId}`);
    try {
      // 通过 Edge Function 或直接用 Service Role Key 删除
      // 我们用 supabase.auth.admin 删除，但客户端没权限
      // 折中方案：先在 profiles 处理（如果有 service role可以配Edge Function）
      // 这里调用 supabase API 时如果没有权限会报错
      const { error } = await supabase.functions.invoke('delete-user', { body: { user_id: userId } });
      if (error) {
          // 由于没有部署 edge function，我们用直接删除 profile 来级联如果能删的话。
          // 但 RLS 防止了用户删除，并且 auth.users 只能用 service role删。
          // 我们可以指导用户自己提供 service role 或 后端提供接口
          alert('需要部署 Edge Function(带有 service_role Key) 才能删除 Auth User，或者通过 Supabase 后台手动删除');
      }
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col h-full animate-in fade-in duration-700 mt-12 md:mt-4">
      {/* 标题 */}
      <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8">
        <p className="text-[#8B1D1D] dark:text-[#A32626] text-xs tracking-[0.4em] uppercase mb-2 font-bold">天 机 阁</p>
        <h2 className="text-4xl md:text-5xl font-black font-serif tracking-[0.2em] text-[#111111] dark:text-[#EFEFEF]">
          后台管理
        </h2>
      </div>

      <div className="overflow-y-auto pr-2 flex-1 custom-scrollbar pb-8 space-y-8">
        {loading && profiles.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border border-black/20 dark:border-white/20 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-[#8B1D1D] font-serif text-center py-12">{error}</p>
        ) : (
          <>
            {/* 统计指标 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-panel p-6 flex flex-col items-center">
                <span className="text-3xl font-serif font-bold text-[#111111] dark:text-[#EFEFEF]">{stats.totalUsers}</span>
                <span className="text-xs text-black/50 dark:text-white/50 tracking-widest mt-2">总门徒</span>
              </div>
              <div className="glass-panel p-6 flex flex-col items-center">
                <span className="text-3xl font-serif font-bold text-[#111111] dark:text-[#EFEFEF]">{stats.todayDivinations}</span>
                <span className="text-xs text-black/50 dark:text-white/50 tracking-widest mt-2">今日起卦</span>
              </div>
              <div className="glass-panel p-6 flex flex-col items-center">
                <span className="text-3xl font-serif font-bold text-[#111111] dark:text-[#EFEFEF]">{stats.totalDivinations}</span>
                <span className="text-xs text-black/50 dark:text-white/50 tracking-widest mt-2">累计起卦</span>
              </div>
            </div>

            {/* 用户列表 */}
            <div className="glass-panel overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/50 text-xs tracking-widest uppercase">
                  <tr>
                    <th className="font-bold px-6 py-4">用户名</th>
                    <th className="font-bold px-6 py-4">注册时间</th>
                    <th className="font-bold px-6 py-4 text-center">今日次数 (用度/限额+额外)</th>
                    <th className="font-bold px-6 py-4 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 dark:divide-white/10">
                  {profiles.map(p => {
                    const totalAllowed = p.daily_limit + p.extra_uses;
                    const isExhausted = p.todayCount >= totalAllowed;
                    
                    return (
                      <tr key={p.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#111111] dark:text-[#EFEFEF]">{p.username}</span>
                            {p.is_admin && <span className="text-[10px] bg-yellow-500/20 text-yellow-700 px-1.5 py-0.5 rounded uppercase font-bold">Admin</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-black/70 dark:text-white/70">{formatDate(p.created_at)}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`font-bold ${isExhausted ? 'text-[#8B1D1D] dark:text-[#A32626]' : 'text-[#111111] dark:text-[#EFEFEF]'}`}>
                              {p.todayCount} / {totalAllowed}
                            </span>
                            <span className="text-[10px] text-black/40 dark:text-white/40">
                              ({p.daily_limit} + {p.extra_uses})
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              disabled={actionLoading === `add-${p.id}`}
                              onClick={() => handleAddUses(p.id, 1)}
                              className="px-3 py-1 text-xs border border-green-500/30 text-green-700 dark:text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                              title="增加1次额外起卦机会"
                            >
                              +次数
                            </button>
                            <select
                              disabled={actionLoading === `limit-${p.id}`}
                              value={p.daily_limit}
                              onChange={(e) => handleUpdateLimit(p.id, Number(e.target.value))}
                              className="px-2 py-1 text-xs border border-black/20 dark:border-white/20 bg-transparent text-black/70 dark:text-white/70 rounded-none outline-none disabled:opacity-50"
                              title="设置每日限额"
                            >
                              <option value="1">1次/日</option>
                              <option value="3">3次/日</option>
                              <option value="5">5次/日</option>
                              <option value="999">无限</option>
                            </select>
                            <button
                              disabled={actionLoading === `reset-${p.id}`}
                              onClick={() => handleResetUses(p.id)}
                              className="px-3 py-1 text-xs border border-yellow-500/40 text-yellow-700 dark:text-yellow-500 hover:bg-yellow-500/10 transition-colors disabled:opacity-50"
                              title="重置额外次数为0"
                            >
                              清零
                            </button>
                            <button
                              disabled={actionLoading === `del-${p.id}`}
                              onClick={() => handleDeleteUser(p.id, p.username)}
                              className="px-3 py-1 text-xs border border-[#8B1D1D]/40 text-[#8B1D1D] dark:text-[#A32626] hover:bg-[#8B1D1D]/10 transition-colors disabled:opacity-50"
                              title="删除用户"
                            >
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,29,29,0.4); }
      `}</style>
    </div>
  );
};

export default AdminPage;

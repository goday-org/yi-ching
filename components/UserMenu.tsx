import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { signOut } from '../services/auth';

interface UserMenuProps {
  profile: UserProfile;
  remaining: number;
  total: number;
  isDark: boolean;
  onToggleTheme: () => void;
  onSignOut: () => void;
  onViewHistory: () => void;
  onViewAdmin: () => void;
  onChangePassword: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
  profile, remaining, total, isDark, onToggleTheme, onSignOut, onViewHistory, onViewAdmin, onChangePassword
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      onSignOut();
    } catch {
      onSignOut();
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div ref={menuRef} className="absolute top-6 right-6 z-50">
      {/* 触发按钮（头像在右侧） */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-neutral-300/30 dark:border-white/10 text-black/70 dark:text-white/70 transition-all backdrop-blur-md"
      >
        {/* 次数气泡 */}
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full hidden sm:block ${
          remaining > 0
            ? 'bg-green-500/20 text-green-700 dark:text-green-400'
            : 'bg-[#8B1D1D]/20 text-[#8B1D1D] dark:text-[#A32626]'
        }`}>
          {remaining}/{total}
        </span>
        <span className="text-xs font-bold tracking-wide max-w-[80px] truncate hidden sm:block">
          {profile.username}
        </span>
        {/* 头像圆形 */}
        <div className="w-6 h-6 rounded-full bg-[#111111] dark:bg-[#EFEFEF] flex items-center justify-center shrink-0">
          <span className="text-[#F5F5F0] dark:text-[#080808] text-xs font-bold">
            {profile.username.charAt(0).toUpperCase()}
          </span>
        </div>
      </button>

      {/* 下拉菜单（向左展开） */}
      {open && (
        <div className="absolute top-full mt-2 right-0 min-w-[200px] glass-panel rounded-lg py-2 animate-in fade-in zoom-in-95 duration-200 shadow-xl">
          {/* 用户信息头 */}
          <div className="px-4 py-2 border-b border-black/10 dark:border-white/10">
            <p className="text-xs font-bold text-[#111111] dark:text-[#EFEFEF] truncate">{profile.username}</p>
            <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5">
              今日剩余 {remaining} 次 · 共 {total} 次
            </p>
          </div>

          {/* 深色/浅色模式 Toggle Bar */}
          <div className="px-4 py-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs text-black/60 dark:text-white/60 tracking-[0.15em]">
              {isDark ? '深色模式' : '浅色模式'}
            </span>
            <button
              onClick={onToggleTheme}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                isDark ? 'bg-[#111111] dark:bg-[#EFEFEF]' : 'bg-black/20'
              }`}
              aria-label="切换主题"
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-300 ${
                isDark
                  ? 'translate-x-5 bg-[#F5F5F0] dark:bg-[#080808]'
                  : 'translate-x-0 bg-white'
              }`}>
                {isDark ? (
                  // 月亮图标
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-[#111111]">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                  </svg>
                ) : (
                  // 太阳图标
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-yellow-500">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                  </svg>
                )}
              </span>
            </button>
          </div>

          {/* 历史记录 */}
          <button
            onClick={() => { onViewHistory(); setOpen(false); }}
            className="w-full text-left px-4 py-2.5 text-xs tracking-[0.2em] text-black/70 dark:text-white/70 hover:text-[#111111] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
            历史记录
          </button>

          <button
            onClick={() => { onChangePassword(); setOpen(false); }}
            className="w-full text-left px-4 py-2.5 text-xs tracking-[0.2em] text-black/70 dark:text-white/70 hover:text-[#111111] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            修改密码
          </button>

          {profile.is_admin && (
            <button
              onClick={() => { onViewAdmin(); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-xs tracking-[0.2em] text-black/70 dark:text-white/70 hover:text-[#111111] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4.5v15m7.5-7.5h-15"/><circle cx="12" cy="12" r="9"/></svg>
              后台管理
            </button>
          )}

          <div className="border-t border-black/10 dark:border-white/10 mt-1 pt-1">
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full text-left px-4 py-2.5 text-xs tracking-[0.2em] text-[#8B1D1D] dark:text-[#A32626] hover:bg-[#8B1D1D]/5 transition-colors flex items-center gap-2 disabled:opacity-40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              {loading ? '退出中...' : '退出登录'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;

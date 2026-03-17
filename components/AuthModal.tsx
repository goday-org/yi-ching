import React, { useState } from 'react';
import { signIn, signUp } from '../services/auth';
import { UserProfile } from '../types';

interface AuthModalProps {
  onSuccess: (profile: UserProfile) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 基础校验
    if (!username.trim()) return setError('请输入用户名');
    if (username.trim().length < 2) return setError('用户名至少需要 2 个字符');
    if (username.trim().length > 20) return setError('用户名最多 20 个字符');
    if (/[^a-zA-Z0-9\u4e00-\u9fa5_-]/.test(username.trim())) return setError('用户名只能包含字母、数字、中文、下划线和连字符');
    if (password.length < 6) return setError('密码至少需要 6 位');
    if (mode === 'register' && password !== confirmPassword) return setError('两次输入的密码不一致');

    setLoading(true);
    try {
      const profile = mode === 'login'
        ? await signIn(username, password)
        : await signUp(username, password);
      onSuccess(profile);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full flex-1 py-16 animate-in fade-in zoom-in-95 duration-700">
      {/* 标题 */}
      <div className="text-center space-y-3 mb-12">
        <h1 className="text-3xl md:text-5xl font-black tracking-[0.4em] font-serif text-[#111111] dark:text-[#EFEFEF]">
          {mode === 'login' ? '叩问天机' : '拜入师门'}
        </h1>
        <p className="text-black/40 dark:text-white/40 text-xs tracking-[0.4em]">
          {mode === 'login' ? '输入凭证，感应天机' : '创建账号，开启玄机之旅'}
        </p>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col space-y-5">
        <div className="flex flex-col space-y-1">
          <label className="text-xs tracking-[0.3em] text-black/50 dark:text-white/50 font-bold">用 户 名</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="请输入用户名"
            className="premium-input px-4 py-3.5 text-base"
            autoFocus
            disabled={loading}
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-xs tracking-[0.3em] text-black/50 dark:text-white/50 font-bold">密　　码</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="请输入密码（至少 6 位）"
            className="premium-input px-4 py-3.5 text-base"
            disabled={loading}
          />
        </div>

        {mode === 'register' && (
          <div className="flex flex-col space-y-1 animate-in slide-in-from-top-2 duration-300">
            <label className="text-xs tracking-[0.3em] text-black/50 dark:text-white/50 font-bold">确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
              className="premium-input px-4 py-3.5 text-base"
              disabled={loading}
            />
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="border border-[#8B1D1D]/40 bg-[#8B1D1D]/5 px-4 py-3 animate-in fade-in duration-300">
            <p className="text-[#8B1D1D] text-sm font-serif">{error}</p>
          </div>
        )}

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 border border-[#111111] dark:border-[#EFEFEF] bg-transparent text-[#111111] dark:text-[#EFEFEF] hover:bg-[#111111] hover:text-[#F5F5F0] dark:hover:bg-[#EFEFEF] dark:hover:text-[#080808] transition-colors duration-500 font-bold text-sm tracking-[0.5em] uppercase mt-2 disabled:opacity-40"
        >
          {loading ? '感应中...' : (mode === 'login' ? '登 入' : '注 册')}
        </button>
      </form>

      {/* 切换模式 */}
      <div className="mt-8 text-center">
        <button
          onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(null); }}
          className="text-xs text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 tracking-[0.2em] transition-colors underline underline-offset-4"
        >
          {mode === 'login' ? '没有账号？点此注册' : '已有账号？点此登录'}
        </button>
      </div>
    </div>
  );
};

export default AuthModal;

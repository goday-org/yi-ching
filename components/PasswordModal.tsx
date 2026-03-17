import React, { useState } from 'react';
import { updatePassword } from '../services/auth';

interface PasswordModalProps {
  onClose: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('密码长度至少为 6 位');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(newPassword);
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm glass-panel p-8 rounded-3xl animate-in zoom-in-95 duration-300 shadow-2xl border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-serif font-black tracking-widest text-[#111111] dark:text-[#EFEFEF]">修改密码</h2>
          <button onClick={onClose} className="text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="text-sm font-serif tracking-widest text-green-600 dark:text-green-400">密码修改成功</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.3em] text-black/40 dark:text-white/40 mb-2 ml-1">新密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full premium-input px-4 py-3 text-sm"
                  placeholder="请输入新密码"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.3em] text-black/40 dark:text-white/40 mb-2 ml-1">确认新密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full premium-input px-4 py-3 text-sm"
                  placeholder="请再次输入新密码"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-[#8B1D1D] dark:text-[#A32626] font-serif tracking-wide text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 border border-[#111111] dark:border-[#EFEFEF] bg-[#111111] dark:bg-[#EFEFEF] text-[#F5F5F0] dark:text-[#080808] hover:bg-transparent hover:text-[#111111] dark:hover:text-[#EFEFEF] transition-all duration-300 font-bold text-xs tracking-[0.4em] uppercase disabled:opacity-50"
            >
              {loading ? '提交中...' : '确认修改'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PasswordModal;

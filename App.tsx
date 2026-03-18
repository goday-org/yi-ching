import React, { useState, useEffect } from 'react';
import { AppStep, DivinationType, DivinationData, ThrowResult, UserProfile } from './types';
import { DIVINATION_TYPES, HEXAGRAM_NAMES } from './constants';
import Compass from './components/Compass';
import CoinThrower from './components/CoinThrower';
import PwaPrompt from './components/PwaPrompt';
import { interpretDivination } from './services/gemini';
import AuthModal from './components/AuthModal';
import UserMenu from './components/UserMenu';
import HistoryPage from './components/HistoryPage';
import AdminPage from './components/AdminPage';
import PasswordModal from './components/PasswordModal';
import { getCurrentUser } from './services/auth';
import { checkQuota, saveDivinationRecord } from './services/divinationDb';

const App: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [quota, setQuota] = useState({ canDivine: false, remaining: 0, total: 0 });

  const [step, setStep] = useState<AppStep>(AppStep.LANDING);
  const [formData, setFormData] = useState<{ type: DivinationType; question: string }>({
    type: '感情问题',
    question: '',
  });
  const [divinationData, setDivinationData] = useState<DivinationData | null>(null);
  const [resultText, setResultText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [streaming, setStreaming] = useState<boolean>(false);
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const initAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setProfile(user);
          const q = await checkQuota(user);
          setQuota(q);
          setStep(AppStep.LANDING);
        } else {
          setStep(AppStep.AUTH);
        }
      } catch (e) {
        setStep(AppStep.AUTH);
      } finally {
        setAuthLoading(false);
      }
    };
    initAuth();
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const refreshQuota = async () => {
    if (profile) {
      const q = await checkQuota(profile);
      setQuota(q);
    }
  };

  const handleAuthSuccess = async (userProfile: UserProfile) => {
    setProfile(userProfile);
    const q = await checkQuota(userProfile);
    setQuota(q);
    setStep(AppStep.LANDING);
  };

  const handleSignOut = () => {
    setProfile(null);
    setStep(AppStep.AUTH);
  };

  const startDivination = async () => {
    if (!profile) {
      setStep(AppStep.AUTH);
      return;
    }
    
    // 强制刷新一次限额
    if (profile) {
      const q = await checkQuota(profile);
      setQuota(q);
      if (!q.canDivine) {
        setError("今日起卦次数已用尽，请明日再来。");
        // 5秒后清除错误自动恢复 UI
        setTimeout(() => setError(null), 5000);
        return;
      }
    }
    
    setStep(AppStep.INPUT);
    setFormData({ type: '感情问题', question: '' });
    setError(null);
  };

  const handleInputConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim()) return;
    setStep(AppStep.DIVINATION);
  };

  const streamingRef = React.useRef<boolean>(false);
  const typingTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const charQueueRef = React.useRef<string[]>([]);
  
  const handleDivinationComplete = async (throws: ThrowResult[]) => {
    const data: DivinationData = { ...formData, throws };
    setDivinationData(data);
    setLoading(true);
    setStreaming(false);
    setIsAiResponding(false);
    setError(null);
    setResultText(""); 
    setStep(AppStep.RESULT); 
    
    let receivedAny = false;
    try {
      const hex = data.throws.map(t => (t.lineType === 'yang' || t.lineType === 'old_yang' ? '1' : '0')).join('');
      const hexName = HEXAGRAM_NAMES[hex] || "未知卦";
      
      charQueueRef.current = [];
      const result = await interpretDivination(data, 
        (chunk) => {
          receivedAny = true;
          setIsAiResponding(true);
          charQueueRef.current.push(...chunk.split(""));
        },
        () => {
          setLoading(false);
          setStreaming(true);
          streamingRef.current = true;

          if (typingTimerRef.current) clearInterval(typingTimerRef.current);
          typingTimerRef.current = setInterval(() => {
            if (charQueueRef.current.length > 0) {
              const nextChar = charQueueRef.current.shift();
              setResultText(prev => prev + (nextChar || ""));
            } else if (!streamingRef.current) {
              if (typingTimerRef.current) clearInterval(typingTimerRef.current);
              typingTimerRef.current = null;
            }
          }, 50); 
        }
      );
      
      streamingRef.current = false;
      setStreaming(false);

      // 如果流结束了但一直没开始过（receivedAny 为 false），说明连第一个字都没读到
      if (!receivedAny) {
        setResultText("### ！！！感应中断\n大师正在凝神感应，但天地正气波动剧烈，请屏息片刻后再次尝试。");
        setLoading(false);
      }
      
      if (profile && result) {
        saveDivinationRecord(profile.id, data, hexName, result).then(() => {
          refreshQuota();
        }).catch(err => console.error("Save record error:", err));
      }
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : "连接天地失败，请重试";
      // 如果已经进入结果页，直接把错误显示在纸上
      if (step === AppStep.RESULT) {
        setResultText(prev => prev + "\n\n### ！！！感应中断\n" + errMsg);
      } else {
        setError(errMsg);
      }
      setLoading(false);
      setStreaming(false);
      setIsAiResponding(false);
    }
  };

  const reset = () => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    setStep(AppStep.LANDING);
    setFormData({ type: '感情问题', question: '' });
    setDivinationData(null);
    setResultText('');
    setIsAiResponding(false);
    setError(null);
  };

  const goBack = () => {
    if (step === AppStep.INPUT) {
      setStep(AppStep.LANDING);
    } else if (step === AppStep.DIVINATION) {
      setStep(AppStep.INPUT);
      setDivinationData(null);
    } else if (step === AppStep.RESULT) {
      reset();
    } else if (step === AppStep.HISTORY || step === AppStep.ADMIN) {
      setStep(AppStep.LANDING);
    }
    setError(null);
  };

  const getOriginalHexName = () => {
    if (!divinationData) return "";
    const hex = divinationData.throws.map(t => (t.lineType === 'yang' || t.lineType === 'old_yang' ? '1' : '0')).join('');
    return HEXAGRAM_NAMES[hex] || "未知卦";
  };

  const resultScrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streaming && resultScrollRef.current) {
      resultScrollRef.current.scrollTop = resultScrollRef.current.scrollHeight;
    }
  }, [resultText, streaming]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)]">
        <div className="w-8 h-8 border border-black/20 dark:border-white/20 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-8">
      <div className="max-w-4xl w-full glass-panel rounded-[2.5rem] p-8 md:p-14 relative flex flex-col items-center min-h-[85vh] transition-all duration-1000 ease-out">
        
        {/* 用户菜单（已登录时在右侧，含主题切换） */}
        {profile && step !== AppStep.AUTH && (
          <UserMenu 
            profile={profile}
            remaining={quota.remaining}
            total={quota.total}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onSignOut={handleSignOut}
            onViewHistory={() => setStep(AppStep.HISTORY)}
            onViewAdmin={() => setStep(AppStep.ADMIN)}
            onChangePassword={() => setShowPasswordModal(true)}
          />
        )}

        {/* 未登录时在右侧显示主题切换按钮 */}
        {(!profile || step === AppStep.AUTH) && (
          <button
            onClick={toggleTheme}
            className="absolute top-6 right-6 z-50 p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/60 dark:text-white/60 hover:text-[#111111] dark:hover:text-white transition-all backdrop-blur-md border border-neutral-300/30 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30"
            aria-label="切换主题"
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            )}
          </button>
        )}

        {/* 返回按钮 (统一位置：左上角，与头像平齐) */}
        {(step === AppStep.INPUT || step === AppStep.DIVINATION || step === AppStep.RESULT || step === AppStep.HISTORY || step === AppStep.ADMIN) && (
          <button 
            onClick={goBack}
            className="absolute top-6 left-6 z-50 p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/60 dark:text-white/60 hover:text-[#111111] dark:hover:text-white transition-all backdrop-blur-md border border-neutral-300/30 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30"
            aria-label="返回"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
        )}

        {/* 极简装饰 */}
        <div className="absolute top-10 left-10 w-4 h-4 rounded-full border border-black/10 dark:border-white/10 hidden md:block"></div>
        <div className="absolute bottom-10 right-10 w-4 h-4 rounded-full border border-black/10 dark:border-white/10 hidden md:block"></div>

        {/* Auth 鉴权页 */}
        {step === AppStep.AUTH && (
          <AuthModal onSuccess={handleAuthSuccess} />
        )}

        {/* Landing 首页 */}
        {step === AppStep.LANDING && (
          <div className="flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in-95 duration-[1200ms] ease-out w-full h-full my-auto flex-1 pb-10">
            <div className="text-center space-y-4 md:space-y-6 mt-10 md:mt-4">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-[0.4em] md:tracking-[0.6em] font-serif mt-4 text-[#111111] dark:text-[#EFEFEF]">
                周易算卦
              </h1>
              <div className="flex items-center justify-center gap-3 sm:gap-6 text-black/50 dark:text-white/50 tracking-[0.2em] sm:tracking-[0.4em] font-light text-[10px] sm:text-xs md:text-sm uppercase px-4 whitespace-nowrap">
                <span className="h-px w-6 sm:w-12 bg-black/10 dark:bg-white/10 hidden sm:block"></span>
                <p>大道至简 · 意念合一</p>
                <span className="h-px w-6 sm:w-12 bg-black/10 dark:bg-white/10 hidden sm:block"></span>
              </div>
            </div>
            
            <div className="transform transition-all duration-1000 relative">
              <Compass />
            </div>

            {error && (
              <div className="absolute bottom-32 -translate-y-full px-6 py-3 border border-[#8B1D1D]/40 bg-[#8B1D1D]/5 animate-in fade-in duration-300">
                <p className="text-[#8B1D1D] dark:text-[#A32626] font-serif text-sm font-bold tracking-[0.1em]">{error}</p>
              </div>
            )}
            
            <button
              onClick={startDivination}
              className="px-16 py-4 border border-[#111111] dark:border-[#EFEFEF] bg-transparent text-[#111111] dark:text-[#EFEFEF] hover:bg-[#111111] hover:text-[#F5F5F0] dark:hover:bg-[#EFEFEF] dark:hover:text-[#080808] transition-colors duration-500 font-bold text-sm tracking-[0.5em] uppercase"
            >
              感应天机
            </button>
          </div>
        )}

        {/* Input 表单 */}
        {step === AppStep.INPUT && (
          <form onSubmit={handleInputConfirm} className="w-full max-w-lg flex flex-col space-y-10 animate-in slide-in-from-bottom-8 fade-in duration-1000 ease-out pt-20 md:pt-16 flex-1">
            <div className="text-center space-y-6 mb-8">
              <h2 className="text-3xl md:text-5xl font-black font-serif tracking-[0.2em] text-[#111111] dark:text-[#EFEFEF]">诚心叩问</h2>
              <p className="text-black/50 dark:text-white/50 text-sm font-light tracking-[0.3em]">摒除杂念 · 意象自现</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {DIVINATION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type as DivinationType })}
                  className={`py-3.5 border transition-all duration-300 text-sm font-serif tracking-widest ${
                    formData.type === type 
                      ? 'bg-[#111111] text-[#F5F5F0] border-[#111111] dark:bg-[#EFEFEF] dark:text-[#080808] dark:border-[#EFEFEF] shadow-lg' 
                      : 'bg-transparent text-black/60 dark:text-white/60 border-black/10 dark:border-white/10 hover:border-black/50 dark:hover:border-white/50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <textarea
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="请详述您的困惑（如：近期事业路口的抉择）"
              className="w-full h-48 premium-input p-6 font-serif leading-relaxed text-lg resize-none placeholder:text-black/30 dark:placeholder:text-white/30 bg-transparent border-black/20 dark:border-white/20 text-[#111111] dark:text-[#EFEFEF]"
              required
            />

            <button
              type="submit"
              className="w-full py-4 border border-[#111111] dark:border-[#EFEFEF] bg-transparent text-[#111111] dark:text-[#EFEFEF] hover:bg-[#111111] hover:text-[#F5F5F0] dark:hover:bg-[#EFEFEF] dark:hover:text-[#080808] transition-colors duration-500 font-bold text-sm tracking-[0.5em] uppercase mt-6"
            >
              起 卦
            </button>
          </form>
        )}

        {/* Divination 摇卦 */}
        {step === AppStep.DIVINATION && (
          <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-1000 pt-8 flex-1">
            {!loading && !error ? (
              <CoinThrower onComplete={handleDivinationComplete} />
            ) : loading ? (
              <div className="flex flex-col items-center justify-center space-y-10 py-24 text-center">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 border border-black/20 dark:border-white/20 animate-spin-slow"></div>
                  <div className="absolute inset-2 border border-black/60 dark:border-white/60 animate-[spin_3s_linear_infinite_reverse]"></div>
                  <span className="text-[#8B1D1D] dark:text-[#A32626] font-serif text-2xl">推</span>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl md:text-2xl font-bold font-serif tracking-[0.3em] text-[#111111] dark:text-[#EFEFEF]">静候天机</h3>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center space-y-8 py-20 px-4 text-center max-w-md">
                <div className="w-16 h-16 border border-[#8B1D1D] flex items-center justify-center text-[#8B1D1D]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </div>
                <p className="text-[#8B1D1D] font-serif leading-relaxed text-lg">{error}</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep(AppStep.LANDING)}
                    className="px-8 py-3.5 border border-black/20 dark:border-white/20 text-xs font-bold tracking-widest hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    返回首页
                  </button>
                  <button 
                    onClick={() => divinationData && handleDivinationComplete(divinationData.throws)}
                    className="px-8 py-3.5 border border-[#111111] dark:border-[#EFEFEF] font-bold text-xs tracking-widest hover:bg-[#111111] hover:text-[#F5F5F0] dark:hover:bg-[#EFEFEF] dark:hover:text-[#080808] transition-colors"
                  >
                    重新尝试
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Result 结果页 */}
        {step === AppStep.RESULT && (
          <div className="w-full flex flex-col h-full animate-in fade-in zoom-in-95 duration-1000 ease-out mt-12 md:mt-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-black/10 dark:border-white/10 pb-6 mb-8 gap-6 md:gap-0">
              <div className="animate-in fade-in duration-700">
                <p className="text-[#8B1D1D] dark:text-[#A32626] text-xs tracking-[0.4em] uppercase mb-2 font-bold">得 卦</p>
                <h2 className="text-5xl md:text-6xl font-black font-serif tracking-[0.2em] relative inline-block text-[#111111] dark:text-[#EFEFEF]">
                  {getOriginalHexName()}
                </h2>
              </div>
              <button 
                onClick={reset} 
                className="px-8 py-3 border border-[#111111] dark:border-[#EFEFEF] bg-transparent text-[#111111] dark:text-[#EFEFEF] hover:bg-[#111111] hover:text-[#F5F5F0] dark:hover:bg-[#EFEFEF] dark:hover:text-[#080808] transition-colors duration-500 text-xs font-bold tracking-[0.5em] shrink-0 animate-in fade-in duration-1000"
              >
                谢 卦
              </button>
            </div>
            
            <div 
              ref={resultScrollRef}
              className="overflow-y-auto pr-4 space-y-8 custom-scrollbar pb-12 flex-1 scroll-smooth"
            >
              <div className="bg-black/5 dark:bg-white/5 p-8 border border-black/10 dark:border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <p className="text-black/50 dark:text-white/50 text-xs tracking-widest mb-4 font-bold border-b border-black/10 dark:border-white/10 pb-2 inline-block">所问之事</p>
                <div className="italic text-[#111111] dark:text-[#EFEFEF] font-serif text-lg leading-relaxed">
                  “{formData.question}”
                </div>
              </div>

              <div className="prose prose-invert prose-premium max-w-none">
                {(loading || (streaming && !isAiResponding)) && (
                  <div className="flex flex-col items-center justify-center py-10 animate-in fade-in duration-1000">
                    <div className="relative w-32 h-32 mb-8 bagua-breath">
                       <svg viewBox="0 0 100 100" className="w-full h-full bagua-loader opacity-20 dark:opacity-30 stroke-current text-black dark:text-white fill-none" strokeWidth="1">
                         <circle cx="50" cy="50" r="48" />
                         <path d="M50 2 L50 98 M2 50 L98 50 M16 16 L84 84 M16 84 L84 16" />
                         <circle cx="50" cy="50" r="15" />
                         {/* 简单的八卦占位符图形 */}
                         <rect x="40" y="5" width="20" height="3" fill="currentColor" />
                         <rect x="40" y="92" width="20" height="3" fill="currentColor" />
                         <rect x="5" y="40" width="3" height="20" fill="currentColor" />
                         <rect x="92" y="40" width="3" height="20" fill="currentColor" />
                       </svg>
                       <div className="absolute inset-0 flex items-center justify-center">
                         <span className="text-xl font-serif text-[#8B1D1D] dark:text-[#A32626] zen-text-fade">感</span>
                       </div>
                    </div>
                    <p className="text-sm text-black/40 dark:text-white/40 font-serif tracking-[0.3em] zen-text-fade flex items-center justify-center">
                      大师正在凝神感应，请屏息以待
                      <span className="inline-flex ml-1 tracking-normal">
                        <span className="loading-dot">.</span>
                        <span className="loading-dot">.</span>
                        <span className="loading-dot">.</span>
                      </span>
                    </p>
                  </div>
                )}
                {resultText.split('\n').map((line, i, arr) => {
                  const isHeader = line.startsWith('#');
                  const cleanLine = line.replace(/#/g, '').trim();
                  const isLastLine = i === arr.length - 1;
                  
                  if (!cleanLine && !isLastLine) return <div key={i} className="h-4"></div>;
                  if (!cleanLine && isLastLine && resultText !== "") return null;
                  
                  return isHeader ? (
                    <h3 key={i} className="text-xl md:text-2xl font-serif font-bold mb-4 mt-10 animate-in fade-in duration-500">
                      {cleanLine}
                    </h3>
                  ) : cleanLine ? (
                    <p key={i} className="text-[#333333] dark:text-[rgba(239,239,239,0.85)] text-base md:text-lg leading-loose mb-4 text-justify font-sans font-light tracking-wide inline-block w-full">
                      <span className="animate-in fade-in duration-300">{cleanLine}</span>
                      {isLastLine && (streaming || charQueueRef.current.length > 0) && (
                        <span className="inline-block w-1.5 h-5 ml-1 align-middle bg-[#8B1D1D] dark:bg-[#A32626] animate-pulse"></span>
                      )}
                    </p>
                  ) : null;
                })}
                {/* 仅在接收完成后展示天道忌盈的结语 */}
                {!streaming && resultText.length > 0 && (
                  <div className="mt-16 pt-8 border-t border-black/10 dark:border-white/10 flex flex-col items-center animate-in fade-in duration-1000">
                    <div className="w-1 px-8 h-px bg-[#8B1D1D] mb-6"></div>
                    <p className="text-xs text-black/40 dark:text-white/40 font-serif tracking-[0.4em] uppercase">
                      无往不复 · 天道忌盈
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* History 历史页 */}
        {step === AppStep.HISTORY && profile && (
          <HistoryPage profile={profile} onBack={() => setStep(AppStep.LANDING)} />
        )}

        {/* Admin 后台页 */}
        {step === AppStep.ADMIN && profile?.is_admin && (
          <AdminPage onBack={() => setStep(AppStep.LANDING)} />
        )}

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 29, 29, 0.4); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139, 29, 29, 0.8); }
      `}</style>
      <PwaPrompt />
      {showPasswordModal && <PasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
};

export default App;

import React, { useState } from 'react';
import { AppStep, DivinationType, DivinationData, ThrowResult } from './types';
import { DIVINATION_TYPES, HEXAGRAM_NAMES } from './constants';
import Compass from './components/Compass';
import CoinThrower from './components/CoinThrower';
import { interpretDivination } from './services/gemini';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.LANDING);
  const [formData, setFormData] = useState<{ type: DivinationType; question: string }>({
    type: '感情问题',
    question: '',
  });
  const [divinationData, setDivinationData] = useState<DivinationData | null>(null);
  const [resultText, setResultText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startDivination = () => {
    setStep(AppStep.INPUT);
    setError(null);
  };

  const handleInputConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim()) return;
    setStep(AppStep.DIVINATION);
  };

  const handleDivinationComplete = async (throws: ThrowResult[]) => {
    const data: DivinationData = { ...formData, throws };
    setDivinationData(data);
    setLoading(true);
    setError(null);
    
    try {
      const result = await interpretDivination(data);
      setResultText(result || "大师目前繁忙，未能给出批复。");
      setStep(AppStep.RESULT);
    } catch (err) {
      setError(err instanceof Error ? err.message : "连接天地失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(AppStep.LANDING);
    setFormData({ type: '感情问题', question: '' });
    setDivinationData(null);
    setResultText('');
    setError(null);
  };

  const goBack = () => {
    if (step === AppStep.INPUT) setStep(AppStep.LANDING);
    else if (step === AppStep.DIVINATION) setStep(AppStep.INPUT);
    setError(null);
  };

  const getOriginalHexName = () => {
    if (!divinationData) return "";
    const hex = divinationData.throws.map(t => (t.lineType === 'yang' || t.lineType === 'old_yang' ? '1' : '0')).join('');
    return HEXAGRAM_NAMES[hex] || "未知卦";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-8">
      <div className="max-w-4xl w-full glass-panel rounded-[2.5rem] p-8 md:p-14 relative flex flex-col items-center min-h-[85vh] border border-white/5 transition-all duration-700">
        
        {(step === AppStep.INPUT || step === AppStep.DIVINATION || step === AppStep.RESULT) && (
          <button 
            onClick={goBack}
            className="absolute top-6 left-6 z-50 p-3 rounded-full bg-white/5 hover:bg-white/10 text-gold-300 transition-all backdrop-blur-md border border-white/10 hover:border-gold-500/30"
            aria-label="返回"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
        )}

        {/* Ambient Glow Effects */}
        <div className="absolute -top-[20%] -left-[10%] w-96 h-96 bg-gold-700/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-96 h-96 bg-sky-900/10 rounded-full blur-[100px] pointer-events-none"></div>

        {step === AppStep.LANDING && (
          <div className="flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in-95 duration-1000 w-full h-full my-auto flex-1">
            <div className="text-center space-y-4">
              <h1 className="text-5xl md:text-7xl font-black gold-text-gradient tracking-[0.4em] md:tracking-[0.6em] drop-shadow-2xl font-serif">
                周易算卦
              </h1>
              <div className="flex items-center justify-center gap-4 text-gold-500/60 tracking-[0.3em] font-light text-xs md:text-sm uppercase">
                <span className="h-px w-8 bg-gold-700/30"></span>
                <p>AI 深度易理驱动</p>
                <span className="h-px w-8 bg-gold-700/30"></span>
              </div>
            </div>
            
            <div onClick={startDivination} className="cursor-pointer transform hover:scale-[1.03] transition-all duration-700 hover:drop-shadow-[0_0_40px_rgba(212,175,55,0.3)]">
              <Compass />
            </div>
            
            <button
              onClick={startDivination}
              className="px-14 py-4 gold-btn rounded-full text-obsidian font-bold text-lg tracking-[0.4em] uppercase"
            >
              感应天机
            </button>
          </div>
        )}

        {step === AppStep.INPUT && (
          <form onSubmit={handleInputConfirm} className="w-full max-w-lg flex flex-col space-y-8 animate-in slide-in-from-bottom-8 duration-700 pt-16 flex-1">
            <div className="text-center space-y-4 mb-4">
              <h2 className="text-3xl md:text-4xl font-bold gold-text-gradient font-serif tracking-[0.2em]">诚心叩问</h2>
              <p className="text-gold-300/60 text-sm font-light tracking-widest">心诚则灵 · 意念合一</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {DIVINATION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type as DivinationType })}
                  className={`py-3.5 rounded-xl border transition-all duration-300 text-sm font-serif tracking-widest ${
                    formData.type === type 
                      ? 'bg-gold-500/10 border-gold-500 text-gold-300 shadow-[0_0_20px_rgba(212,175,55,0.15)]' 
                      : 'bg-obsidian/30 text-slate-400 border-white/5 hover:border-gold-500/30 hover:text-gold-100 hover:bg-gold-500/5'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <textarea
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="请详述您的困惑（如：近期事业变动，应当如何抉择？）"
              className="w-full h-44 premium-input rounded-2xl p-6 font-serif leading-relaxed text-lg resize-none placeholder:text-slate-600"
              required
            />

            <button
              type="submit"
              className="w-full py-4.5 gold-btn rounded-xl font-bold text-obsidian text-lg tracking-[0.3em] mt-4"
            >
              确认 · 进入起卦
            </button>
          </form>
        )}

        {step === AppStep.DIVINATION && (
          <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-1000 pt-8 flex-1">
            {!loading && !error ? (
              <CoinThrower onComplete={handleDivinationComplete} />
            ) : loading ? (
              <div className="flex flex-col items-center justify-center space-y-10 py-24 text-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 border-[1px] border-gold-500/20 rounded-full"></div>
                  <div className="absolute inset-2 border-[1px] border-gold-500/40 rounded-full border-t-transparent animate-spin-slow"></div>
                  <div className="absolute inset-4 border-[2px] border-gold-500 rounded-full border-b-transparent animate-spin"></div>
                  <div className="absolute inset-0 rounded-full bg-gold-500/5 blur-xl animate-pulse-glow"></div>
                  <span className="text-gold-300 font-serif text-2xl animate-pulse">易</span>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl md:text-2xl font-bold gold-text-gradient font-serif tracking-[0.3em]">正在推演天机</h3>
                  <p className="text-gold-300/40 italic font-serif text-sm tracking-widest">交汇阴阳 · 洞悉因果...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center space-y-8 py-20 px-4 text-center max-w-md">
                <div className="w-20 h-20 rounded-full bg-red-900/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <p className="text-red-200/70 font-serif leading-relaxed text-lg">{error}</p>
                <button 
                  onClick={() => divinationData && handleDivinationComplete(divinationData.throws)}
                  className="px-8 py-3.5 bg-obsidian/50 border border-gold-500/40 text-gold-300 font-bold rounded-full hover:bg-gold-500/10 transition-all tracking-widest"
                >
                  重新尝试感应
                </button>
              </div>
            ) : null}
          </div>
        )}

        {step === AppStep.RESULT && (
          <div className="w-full flex flex-col h-full animate-in fade-in zoom-in-95 duration-1000 mt-12 md:mt-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gold-500/20 pb-6 mb-8 gap-6 md:gap-0">
              <div>
                <p className="text-gold-300/60 text-xs tracking-[0.4em] uppercase mb-2 font-light">得卦</p>
                <h2 className="text-4xl md:text-5xl font-black gold-text-gradient font-serif tracking-[0.2em] relative inline-block">
                  {getOriginalHexName()}
                  <span className="absolute -inset-4 bg-gold-500/10 blur-xl -z-10 rounded-full pointer-events-none"></span>
                </h2>
              </div>
              <button 
                onClick={reset} 
                className="px-8 py-3 bg-obsidian/40 border border-gold-500/30 hover:border-gold-500 hover:bg-gold-500/10 rounded-full text-gold-300 text-sm font-bold transition-all tracking-widest shrink-0 shadow-lg"
              >
                谢卦 · 重开
              </button>
            </div>
            
            <div className="overflow-y-auto pr-4 space-y-8 custom-scrollbar pb-12 flex-1">
              <div className="bg-obsidian/40 rounded-2xl p-6 md:p-8 border border-gold-500/10 shadow-inner">
                <p className="text-gold-300/40 text-xs tracking-widest mb-3 uppercase">所问之事</p>
                <div className="italic text-slate-200 font-serif text-lg leading-relaxed mix-blend-plus-lighter">
                  “{formData.question}”
                </div>
              </div>

              <div className="prose prose-invert prose-premium max-w-none">
                {resultText.split('\n').map((line, i) => {
                  const isHeader = line.startsWith('#');
                  const cleanLine = line.replace(/#/g, '').trim();
                  if (!cleanLine) return <div key={i} className="h-4"></div>;
                  
                  return isHeader ? (
                    <h3 key={i} className="text-xl md:text-2xl font-serif text-gold-300 font-bold mb-4 mt-8 border-l-4 border-gold-500 pl-4 py-1 bg-gold-500/5 pr-4 rounded-r-lg inline-block">
                      {cleanLine}
                    </h3>
                  ) : (
                    <p key={i} className="text-slate-300 text-base md:text-lg leading-loose mb-4 text-justify font-sans font-light tracking-wide">
                      {cleanLine}
                    </p>
                  );
                })}
              </div>

              <div className="mt-16 pt-8 border-t border-gold-500/10 flex flex-col items-center opacity-60">
                <div className="w-1 px-8 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent mb-6"></div>
                <p className="text-xs text-gold-300/50 font-serif tracking-[0.3em] uppercase">
                  天机不可尽泄 · 命运皆在己手
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212, 175, 55, 0.4); }
      `}</style>
    </div>
  );
};

export default App;

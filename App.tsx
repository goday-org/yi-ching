
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full glass-panel rounded-[2.5rem] shadow-2xl p-6 sm:p-12 relative overflow-hidden flex flex-col items-center min-h-[80vh]">
        
        {(step === AppStep.INPUT || step === AppStep.DIVINATION) && (
          <button 
            onClick={goBack}
            className="absolute top-6 left-6 z-50 p-2 rounded-full bg-white/5 hover:bg-white/10 text-amber-200 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
        )}

        <div className="absolute -top-32 -left-32 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]"></div>

        {step === AppStep.LANDING && (
          <div className="flex flex-col items-center justify-center space-y-10 animate-in fade-in duration-1000 w-full">
            <div className="text-center space-y-3">
              <h1 className="text-4xl sm:text-6xl font-black bg-gradient-to-b from-amber-100 to-amber-600 bg-clip-text text-transparent tracking-[0.4em] drop-shadow-xl font-serif">
                周易算卦
              </h1>
              <p className="text-amber-500/60 tracking-[0.3em] font-light text-xs sm:text-sm italic">DeepSeek 深度易理驱动</p>
            </div>
            
            <div onClick={startDivination} className="cursor-pointer transform hover:scale-[1.02] transition-transform duration-700">
              <Compass />
            </div>
            
            <button
              onClick={startDivination}
              className="px-12 py-4 bg-gradient-to-b from-amber-400 to-amber-700 rounded-full text-slate-900 font-black text-lg tracking-[0.5em] shadow-xl hover:brightness-110 active:scale-95 transition-all"
            >
              开始测算
            </button>
          </div>
        )}

        {step === AppStep.INPUT && (
          <form onSubmit={handleInputConfirm} className="w-full max-w-lg flex flex-col space-y-8 animate-in slide-in-from-bottom-8 duration-700 pt-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-4xl font-bold text-amber-50 font-serif tracking-widest">诚心叩问</h2>
              <p className="text-amber-500/60 text-xs">个人运势、事业前途、情感归宿</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {DIVINATION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type as DivinationType })}
                  className={`py-3 rounded-xl border transition-all text-sm font-serif ${
                    formData.type === type 
                      ? 'bg-amber-500/20 border-amber-500 text-amber-100' 
                      : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <textarea
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="请详述您的困惑（例如：近期事业变动如何应对？）"
              className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-6 text-amber-50 focus:outline-none focus:border-amber-500/40 transition-all font-serif leading-relaxed"
              required
            />

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-b from-amber-400 to-amber-700 text-slate-900 font-black rounded-xl shadow-xl hover:brightness-110 active:scale-[0.98] transition-all text-lg tracking-[0.2em]"
            >
              确认 · 进入起卦
            </button>
          </form>
        )}

        {step === AppStep.DIVINATION && (
          <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-1000 pt-10">
            {!loading && !error ? (
              <CoinThrower onComplete={handleDivinationComplete} />
            ) : loading ? (
              <div className="flex flex-col items-center justify-center space-y-8 py-20 text-center">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 border-2 border-amber-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-2 border-amber-400 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl sm:text-2xl font-bold text-amber-100 font-serif tracking-widest">DeepSeek 正在推演天机</h3>
                  <p className="text-slate-500 italic font-serif text-sm">大数据易理深度解析中...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center space-y-6 py-20 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <p className="text-slate-400 font-serif leading-relaxed max-w-xs">{error}</p>
                <button 
                  onClick={() => divinationData && handleDivinationComplete(divinationData.throws)}
                  className="px-8 py-3 bg-amber-500 text-slate-900 font-bold rounded-full hover:bg-amber-400 transition-all"
                >
                  重新尝试感应
                </button>
              </div>
            ) : null}
          </div>
        )}

        {step === AppStep.RESULT && (
          <div className="w-full flex flex-col space-y-6 animate-in fade-in duration-1000 pt-4">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <div>
                <h2 className="text-2xl sm:text-4xl font-black text-amber-200 font-serif tracking-widest">
                  {getOriginalHexName()}
                </h2>
                <p className="text-slate-500 text-[10px] tracking-widest uppercase mt-1">DeepSeek AI 智脑解析</p>
              </div>
              <button 
                onClick={reset} 
                className="px-6 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 text-xs font-bold transition-all"
              >
                再起一卦
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[55vh] pr-2 space-y-6 custom-scrollbar pb-10">
              <div className="bg-white/5 rounded-2xl p-4 sm:p-6 border border-white/5 italic text-amber-50/70 font-serif text-sm sm:text-base leading-relaxed">
                “{formData.question}”
              </div>

              <div className="prose prose-invert max-w-none prose-amber">
                {resultText.split('\n').map((line, i) => {
                  const isHeader = line.startsWith('#');
                  const cleanLine = line.replace(/#/g, '').trim();
                  if (!cleanLine) return <div key={i} className="h-2"></div>;
                  
                  return isHeader ? (
                    <h3 key={i} className="text-lg sm:text-xl font-serif text-amber-500 font-bold mb-3 mt-6 border-l-3 border-amber-600 pl-3">
                      {cleanLine}
                    </h3>
                  ) : (
                    <p key={i} className="text-slate-300 text-sm sm:text-base leading-relaxed mb-3 text-justify">
                      {cleanLine}
                    </p>
                  );
                })}
              </div>

              <div className="pt-6 border-t border-white/5 text-center">
                <p className="text-[10px] text-slate-600 font-serif">
                  结果仅供人生参考 · 运势掌握在自己手中
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(245, 158, 11, 0.15); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;

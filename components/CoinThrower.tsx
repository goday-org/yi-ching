import React, { useState, useCallback } from 'react';
import { ThrowResult } from '../types';

interface CoinThrowerProps {
  onComplete: (results: ThrowResult[]) => void;
}

const CoinThrower: React.FC<CoinThrowerProps> = ({ onComplete }) => {
  const [throws, setThrows] = useState<ThrowResult[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentCoins, setCurrentCoins] = useState<number[]>([1, 1, 1]);

  const handleThrow = useCallback(() => {
    if (throws.length >= 6 || isSpinning) return;
    setIsSpinning(true);
    
    setTimeout(() => {
      // 1 表示“乾隆通宝”字样面 (Yin, 2点), 0 表示满文面 (Yang, 3点)
      const newCoins = [
        Math.random() > 0.5 ? 1 : 0,
        Math.random() > 0.5 ? 1 : 0,
        Math.random() > 0.5 ? 1 : 0
      ];
      setCurrentCoins(newCoins);
      
      const charCount = newCoins.reduce((a, b) => a + b, 0); // 计算“字”的数量
      let lineType: ThrowResult['lineType'] = 'yang';
      
      // 易理逻辑修正：
      // 3个字 = 2+2+2 = 6点 -> 老阴 (Old Yin)
      // 2个字 = 2+2+3 = 7点 -> 少阳 (Yang)
      // 1个字 = 2+3+3 = 8点 -> 少阴 (Yin)
      // 0个字 = 3+3+3 = 9点 -> 老阳 (Old Yang)
      if (charCount === 3) lineType = 'old_yin';
      else if (charCount === 2) lineType = 'yang';
      else if (charCount === 1) lineType = 'yin';
      else if (charCount === 0) lineType = 'old_yang';

      const newResult: ThrowResult = { heads: charCount, lineType };
      const updatedThrows = [...throws, newResult];
      setThrows(updatedThrows);
      setIsSpinning(false);

      if (updatedThrows.length === 6) {
        setTimeout(() => onComplete(updatedThrows), 1200);
      }
    }, 1000);
  }, [throws, isSpinning, onComplete]);

  const Coin = ({ isCharSide, spinning, idx }: { isCharSide: boolean; spinning: boolean; idx: number }) => (
    <div 
      className={`relative w-20 h-20 sm:w-28 sm:h-28 transition-all duration-1000 ${spinning ? 'animate-bounce' : 'scale-100'} filter drop-shadow-2xl`}
      style={{ perspective: '1200px' }}
    >
      <div 
        className={`w-full h-full relative preserve-3d transition-transform duration-[1500ms] cubic-bezier(0.2, 0.8, 0.2, 1) ${spinning ? '[transform:rotateY(1440deg)_scale(1.2)]' : (isCharSide ? '[transform:rotateY(0deg)_scale(1)]' : '[transform:rotateY(180deg)_scale(1)]')}`}
        style={{ transitionDelay: spinning ? '0ms' : `${idx * 150}ms` }}
      >
        {/* 字样面 - 阴 */}
        <div className="absolute inset-0 backface-hidden rounded-full shadow-2xl">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <radialGradient id="goldGradChar" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#D4AF37" />
                <stop offset="80%" stopColor="#9E8022" />
                <stop offset="100%" stopColor="#5C4A11" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#goldGradChar)" stroke="#5C4A11" strokeWidth="1" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#5C4A11" strokeWidth="0.5" opacity="0.5" />
            <rect x="35" y="35" width="30" height="30" fill="#0B0F19" stroke="#5C4A11" strokeWidth="1.5" />
            <g fill="#040914" className="font-serif select-none pointer-events-none">
              <text x="50" y="28" textAnchor="middle" fontSize="14" fontWeight="900" opacity="0.9">乾</text>
              <text x="50" y="82" textAnchor="middle" fontSize="14" fontWeight="900" opacity="0.9">隆</text>
              <text x="78" y="55" textAnchor="middle" fontSize="14" fontWeight="900" opacity="0.9">通</text>
              <text x="22" y="55" textAnchor="middle" fontSize="14" fontWeight="900" opacity="0.9">宝</text>
            </g>
          </svg>
        </div>
        {/* 满文面 - 阳 */}
        <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] rounded-full shadow-2xl">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <radialGradient id="goldGradManchu" cx="50%" cy="50%" r="50%">
                 <stop offset="0%" stopColor="#D4AF37" />
                 <stop offset="80%" stopColor="#9E8022" />
                 <stop offset="100%" stopColor="#5C4A11" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#goldGradManchu)" stroke="#5C4A11" strokeWidth="1" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#5C4A11" strokeWidth="0.5" opacity="0.5" />
            <rect x="35" y="35" width="30" height="30" fill="#0B0F19" stroke="#5C4A11" strokeWidth="1.5" />
            <g stroke="#040914" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8">
              <path d="M 25,40 Q 20,50 25,60 M 25,45 L 25,55" />
              <path d="M 75,40 Q 80,50 75,60 M 75,45 L 75,55" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );

  const YaoLabels = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto space-y-14">
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold gold-text-gradient font-serif tracking-widest">
          {throws.length === 6 ? "起卦完成" : YaoLabels[throws.length]}
        </h2>
        <p className="text-neutral-500 dark:text-gold-300/50 text-xs italic font-serif tracking-widest">通达天地 · 诚心感应</p>
      </div>

      <div className="flex justify-center space-x-6 sm:space-x-10 h-32 items-center w-full">
        {currentCoins.map((isCharSide, idx) => (
          <Coin key={idx} idx={idx} isCharSide={!!isCharSide} spinning={isSpinning} />
        ))}
      </div>

      <div className="w-full flex flex-col items-center space-y-12">
        {throws.length < 6 && (
          <button
            onClick={handleThrow}
            disabled={isSpinning}
            className={`w-full sm:w-72 py-4 rounded-xl gold-btn font-black tracking-[0.5em] shadow-xl text-lg 
              ${isSpinning ? 'opacity-50 cursor-not-allowed transform-none' : ''}
            `}
          >
            {isSpinning ? '冥想感应中...' : '起卦投掷'}
          </button>
        )}

        <div className="flex flex-col-reverse w-full max-w-[320px] space-y-5 space-y-reverse pt-8 border-t border-gold-500/10">
          {YaoLabels.map((label, idx) => {
            const t = throws[idx];
            return (
              <div key={idx} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-4 w-full h-8 group">
                <span className={`text-sm font-serif text-right font-bold transition-colors duration-500 ${t ? 'text-gold-700 dark:text-gold-500' : 'text-neutral-400 dark:text-slate-800'}`}>
                  {label}
                </span>
                <div className="flex-1 flex items-center justify-center relative h-full">
                  {!t ? (
                    <div className="w-full h-[1px] bg-neutral-300 dark:bg-slate-800 group-hover:bg-neutral-400 dark:group-hover:bg-slate-700 transition-colors duration-300"></div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-700 ease-out">
                      {t.lineType === 'yang' && (
                        <div className="w-full h-3.5 bg-gradient-to-r from-[#5C4A11] via-[#D4AF37] to-[#5C4A11] rounded shadow-[0_0_15px_rgba(212,175,55,0.4)] border border-[#FDF7E5]/20"></div>
                      )}
                      {t.lineType === 'yin' && (
                        <div className="w-full h-3.5 flex justify-between">
                          <div className="w-[44%] h-full bg-gradient-to-r from-[#5C4A11] via-[#9E8022] to-[#5C4A11] rounded shadow-[0_0_15px_rgba(212,175,55,0.3)] border border-[#FDF7E5]/10"></div>
                          <div className="w-[44%] h-full bg-gradient-to-r from-[#5C4A11] via-[#9E8022] to-[#5C4A11] rounded shadow-[0_0_15px_rgba(212,175,55,0.3)] border border-[#FDF7E5]/10"></div>
                        </div>
                      )}
                      {t.lineType === 'old_yang' && (
                        <div className="w-full h-4 bg-gradient-to-r from-red-900 via-rose-500 to-red-900 rounded shadow-[0_0_25px_rgba(244,63,94,0.5)] border border-rose-500/50"></div>
                      )}
                      {t.lineType === 'old_yin' && (
                        <div className="w-full h-4 flex justify-between">
                          <div className="w-[44%] h-full bg-gradient-to-r from-red-900 via-red-600 to-red-900 rounded shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-rose-500/30"></div>
                          <div className="w-[44%] h-full bg-gradient-to-r from-red-900 via-red-600 to-red-900 rounded shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-rose-500/30"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-gold-700 dark:text-gold-300 font-serif font-bold text-center -ml-2 drop-shadow-md">
                  {t?.lineType === 'old_yang' ? '○' : t?.lineType === 'old_yin' ? '✕' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </div>
  );
};

export default CoinThrower;


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

  const Coin = ({ isCharSide, spinning }: { isCharSide: boolean; spinning: boolean }) => (
    <div 
      className={`relative w-20 h-20 sm:w-28 sm:h-28 transition-all duration-1000 ${spinning ? 'animate-bounce' : 'scale-100'}`}
      style={{ perspective: '1000px' }}
    >
      <div 
        className={`w-full h-full relative transition-transform duration-1000 preserve-3d ${!spinning && isCharSide ? '[transform:rotateY(0deg)]' : '[transform:rotateY(180deg)]'}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* 字样面 - 阴 */}
        <div className="absolute inset-0 backface-hidden rounded-full shadow-2xl">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <radialGradient id="bronzeGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#5c4300" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#bronzeGrad)" stroke="#4a3701" strokeWidth="1" />
            <rect x="35" y="35" width="30" height="30" fill="#0f172a" stroke="#4a3701" strokeWidth="1" />
            <g fill="#2d1f01" className="font-serif select-none pointer-events-none">
              <text x="50" y="28" textAnchor="middle" fontSize="14" fontWeight="900">乾</text>
              <text x="50" y="82" textAnchor="middle" fontSize="14" fontWeight="900">隆</text>
              <text x="78" y="55" textAnchor="middle" fontSize="14" fontWeight="900">通</text>
              <text x="22" y="55" textAnchor="middle" fontSize="14" fontWeight="900">宝</text>
            </g>
          </svg>
        </div>
        {/* 满文面 - 阳 */}
        <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] rounded-full shadow-2xl">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="48" fill="url(#bronzeGrad)" stroke="#4a3701" strokeWidth="1" />
            <rect x="35" y="35" width="30" height="30" fill="#0f172a" stroke="#4a3701" strokeWidth="1" />
            <g stroke="#2d1f01" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6">
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
    <div className="flex flex-col items-center w-full max-w-lg mx-auto space-y-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-amber-100 font-serif tracking-widest">
          {throws.length === 6 ? "起卦完成" : YaoLabels[throws.length]}
        </h2>
        <p className="text-slate-500 text-xs italic font-serif">乾隆通宝 · 诚心感应</p>
      </div>

      <div className="flex justify-center space-x-4 sm:space-x-8 h-32 items-center w-full">
        {currentCoins.map((isCharSide, idx) => (
          <Coin key={idx} isCharSide={!!isCharSide} spinning={isSpinning} />
        ))}
      </div>

      <div className="w-full flex flex-col items-center space-y-10">
        {throws.length < 6 && (
          <button
            onClick={handleThrow}
            disabled={isSpinning}
            className={`relative w-full sm:w-72 py-4 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-700 text-slate-900 font-black tracking-[0.5em] shadow-[0_10px_40px_rgba(180,130,0,0.3)] transform active:scale-95 transition-all
              ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'}
            `}
          >
            {isSpinning ? '冥想感应中...' : '起卦投掷'}
          </button>
        )}

        <div className="flex flex-col-reverse w-full max-w-[320px] space-y-5 space-y-reverse pt-4 border-t border-white/5">
          {YaoLabels.map((label, idx) => {
            const t = throws[idx];
            return (
              <div key={idx} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-4 w-full h-8">
                <span className={`text-sm font-serif text-right font-bold transition-colors ${t ? 'text-amber-500' : 'text-slate-800'}`}>
                  {label}
                </span>
                <div className="flex-1 flex items-center justify-center relative h-full">
                  {!t ? (
                    <div className="w-full h-[1px] bg-slate-800"></div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-500">
                      {t.lineType === 'yang' && (
                        <div className="w-full h-3 bg-gradient-to-r from-[#8B7344] via-[#C5A059] to-[#8B7344] rounded shadow-inner border border-amber-900/20"></div>
                      )}
                      {t.lineType === 'yin' && (
                        <div className="w-full h-3 flex justify-between">
                          <div className="w-[45%] h-full bg-gradient-to-r from-[#8B7344] via-[#C5A059] to-[#8B7344] rounded border border-amber-900/20"></div>
                          <div className="w-[45%] h-full bg-gradient-to-r from-[#8B7344] via-[#C5A059] to-[#8B7344] rounded border border-amber-900/20"></div>
                        </div>
                      )}
                      {t.lineType === 'old_yang' && (
                        <div className="w-full h-3.5 bg-gradient-to-r from-[#6B1A1A] via-[#962525] to-[#6B1A1A] rounded shadow-[0_0_15px_rgba(150,37,37,0.4)] border border-red-900/30"></div>
                      )}
                      {t.lineType === 'old_yin' && (
                        <div className="w-full h-3.5 flex justify-between">
                          <div className="w-[45%] h-full bg-gradient-to-r from-[#6B1A1A] via-[#962525] to-[#6B1A1A] rounded border border-red-900/30"></div>
                          <div className="w-[45%] h-full bg-gradient-to-r from-[#6B1A1A] via-[#962525] to-[#6B1A1A] rounded border border-red-900/30"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-amber-600 font-serif font-bold text-center">
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

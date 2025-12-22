
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
      const newCoins = [
        Math.random() > 0.5 ? 1 : 0,
        Math.random() > 0.5 ? 1 : 0,
        Math.random() > 0.5 ? 1 : 0
      ];
      setCurrentCoins(newCoins);
      
      const headsCount = newCoins.reduce((a, b) => a + b, 0);
      let lineType: ThrowResult['lineType'] = 'yang';
      
      if (headsCount === 3) lineType = 'old_yang';
      else if (headsCount === 2) lineType = 'yin';
      else if (headsCount === 1) lineType = 'yang';
      else if (headsCount === 0) lineType = 'old_yin';

      const newResult: ThrowResult = { heads: headsCount, lineType };
      const updatedThrows = [...throws, newResult];
      setThrows(updatedThrows);
      setIsSpinning(false);

      if (updatedThrows.length === 6) {
        setTimeout(() => onComplete(updatedThrows), 1200);
      }
    }, 1000);
  }, [throws, isSpinning, onComplete]);

  const Coin = ({ isHeads, spinning }: { isHeads: boolean; spinning: boolean }) => (
    <div 
      className={`relative w-16 h-16 sm:w-24 sm:h-24 transition-all duration-1000 ${spinning ? 'animate-bounce' : 'scale-100'}`}
      style={{ perspective: '1000px' }}
    >
      <div 
        className={`w-full h-full relative transition-transform duration-1000 preserve-3d ${!spinning && isHeads ? '[transform:rotateY(0deg)]' : '[transform:rotateY(180deg)]'}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="absolute inset-0 backface-hidden rounded-full shadow-2xl">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <radialGradient id="bronzeGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#5c4300" />
              </radialGradient>
            </defs>
            <path d="M 50,0 A 50,50 0 1,1 50,100 A 50,50 0 1,1 50,0 Z M 38,38 H 62 V 62 H 38 Z" fill="url(#bronzeGrad)" fillRule="evenodd" stroke="#4a3701" strokeWidth="0.5" />
            <g fill="#2d1f01" className="font-serif">
              <text x="50" y="28" textAnchor="middle" fontSize="14" fontWeight="900">乾</text>
              <text x="50" y="82" textAnchor="middle" fontSize="14" fontWeight="900">隆</text>
              <text x="78" y="55" textAnchor="middle" fontSize="14" fontWeight="900">通</text>
              <text x="22" y="55" textAnchor="middle" fontSize="14" fontWeight="900">宝</text>
            </g>
          </svg>
        </div>
        <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] rounded-full shadow-2xl">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M 50,0 A 50,50 0 1,1 50,100 A 50,50 0 1,1 50,0 Z M 38,38 H 62 V 62 H 38 Z" fill="url(#bronzeGrad)" fillRule="evenodd" stroke="#4a3701" strokeWidth="0.5" />
            <g stroke="#2d1f01" strokeWidth="3" fill="none" strokeLinecap="round">
              <path d="M 25,40 Q 20,50 25,60 M 25,45 L 25,55" opacity="0.8" />
              <path d="M 75,40 Q 80,50 75,60 M 75,45 L 75,55" opacity="0.8" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );

  const YaoLabels = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto space-y-8 sm:space-y-12">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-amber-100 font-serif tracking-[0.2em]">
          {throws.length === 6 ? "起卦圆满" : YaoLabels[throws.length]}
        </h2>
        <p className="text-slate-500 text-[10px] sm:text-xs px-4 italic font-serif">屏息凝神 · 意念集中 · 点击按钮投掷</p>
      </div>

      <div className="flex justify-center space-x-6 sm:space-x-12 h-24 sm:h-32 items-center w-full">
        {currentCoins.map((isHeads, idx) => (
          <Coin key={idx} isHeads={!!isHeads} spinning={isSpinning} />
        ))}
      </div>

      <div className="w-full flex flex-col items-center space-y-8">
        {throws.length < 6 && (
          <button
            onClick={handleThrow}
            disabled={isSpinning}
            className={`relative w-full sm:w-64 py-4 rounded-xl bg-gradient-to-b from-amber-500 to-amber-700 text-slate-900 font-black tracking-[0.4em] shadow-xl transform active:scale-95 transition-all
              ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'}
            `}
          >
            {isSpinning ? '摇卦中...' : '起卦投掷'}
          </button>
        )}

        {/* 修复对齐的六爻列表 */}
        <div className="flex flex-col-reverse w-full max-w-sm px-4 space-y-4 space-y-reverse">
          {YaoLabels.map((label, idx) => {
            const t = throws[idx];
            return (
              <div key={idx} className="grid grid-cols-[3.5rem_1fr] items-center gap-4 w-full h-8 group">
                <span className={`text-xs font-serif text-right font-bold transition-colors ${t ? 'text-amber-500' : 'text-slate-700'}`}>
                  {label}
                </span>
                <div className="flex-1 flex items-center justify-center relative h-full">
                  {!t ? (
                    <div className="w-full h-[1px] bg-slate-800 border-t border-dashed border-slate-700/50"></div>
                  ) : (
                    <div className="w-full h-4 flex items-center justify-center animate-in zoom-in-95 duration-500">
                      {/* 少阳 (阳爻) - 古法金 */}
                      {t.lineType === 'yang' && (
                        <div className="w-full h-2.5 bg-gradient-to-r from-[#8B7344] via-[#C5A059] to-[#8B7344] rounded shadow-inner border border-amber-900/20"></div>
                      )}
                      
                      {/* 少阴 (阴爻) - 古法金 */}
                      {t.lineType === 'yin' && (
                        <div className="w-full h-2.5 flex justify-between">
                          <div className="w-[44%] h-full bg-gradient-to-r from-[#8B7344] via-[#C5A059] to-[#8B7344] rounded border border-amber-900/20"></div>
                          <div className="w-[44%] h-full bg-gradient-to-r from-[#8B7344] via-[#C5A059] to-[#8B7344] rounded border border-amber-900/20"></div>
                        </div>
                      )}
                      
                      {/* 老阳 (动爻) - 朱砂红 */}
                      {t.lineType === 'old_yang' && (
                        <div className="w-full h-3 bg-gradient-to-r from-[#6B1A1A] via-[#962525] to-[#6B1A1A] rounded shadow-[0_0_10px_rgba(150,37,37,0.3)] border border-red-900/30 flex items-center justify-center relative">
                          <div className="absolute -right-6 text-amber-500 font-serif text-lg leading-none">○</div>
                        </div>
                      )}
                      
                      {/* 老阴 (动爻) - 朱砂红 */}
                      {t.lineType === 'old_yin' && (
                        <div className="w-full h-3 flex justify-between relative">
                          <div className="w-[44%] h-full bg-gradient-to-r from-[#6B1A1A] via-[#962525] to-[#6B1A1A] rounded border border-red-900/30"></div>
                          <div className="w-[44%] h-full bg-gradient-to-r from-[#6B1A1A] via-[#962525] to-[#6B1A1A] rounded border border-red-900/30"></div>
                          <div className="absolute -right-6 text-amber-500 font-serif text-sm font-bold">✕</div>
                        </div>
                      )}
                    </div>
                  )}
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

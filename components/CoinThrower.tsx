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
    
    // 立即计算新的正反面，但由 css 动画接管表现，不会穿帮
    const newCoins = [
      Math.random() > 0.5 ? 1 : 0,
      Math.random() > 0.5 ? 1 : 0,
      Math.random() > 0.5 ? 1 : 0
    ];
    setCurrentCoins(newCoins);
    
    const charCount = newCoins.reduce((a, b) => a + b, 0); // 计算“字”的数量
    let lineType: ThrowResult['lineType'] = 'yang';
    
    // 易理逻辑修正：
    if (charCount === 3) lineType = 'old_yin';
    else if (charCount === 2) lineType = 'yang';
    else if (charCount === 1) lineType = 'yin';
    else if (charCount === 0) lineType = 'old_yang';

    const newResult: ThrowResult = { heads: charCount, lineType };
    const updatedThrows = [...throws, newResult];
    
    // 等待 1.2 秒抛币动画结束后真正落地计算数据
    setTimeout(() => {
      setThrows(updatedThrows);
      setIsSpinning(false);

      if (updatedThrows.length === 6) {
        setTimeout(() => onComplete(updatedThrows), 1000);
      }
    }, 1200);
  }, [throws, isSpinning, onComplete]);

  const Coin = ({ isCharSide, spinning, idx }: { isCharSide: boolean; spinning: boolean; idx: number }) => {
    return (
      <div 
        className="relative w-16 h-16 sm:w-20 sm:h-20"
        style={{ perspective: '1200px' }}
      >
        <div 
          className={`w-full h-full relative preserve-3d ${spinning ? 'animate-toss' : ''}`}
          style={{ 
            animationDelay: `${idx * 150}ms`,
            transform: !spinning ? `rotateY(${isCharSide ? 0 : 180}deg)` : undefined,
            transition: !spinning ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
          }}
        >
          {/* 字样面 - 阴 */}
          <div className="absolute inset-0 backface-hidden rounded-full border border-black/80 dark:border-white/80 bg-[#F5F5F0] dark:bg-[#080808] flex items-center justify-center shadow-[inset_0px_0px_10px_rgba(0,0,0,0.1)] dark:shadow-[inset_0px_0px_10px_rgba(255,255,255,0.05)]">
              <span className="font-serif text-2xl font-bold text-black dark:text-white drop-shadow-sm">易</span>
          </div>
          {/* 满文面 - 阳 (翻转180度) */}
          <div className="absolute inset-0 backface-hidden rounded-full border border-black/80 dark:border-white/80 bg-black dark:bg-white flex items-center justify-center shadow-[inset_0px_0px_10px_rgba(255,255,255,0.1)] dark:shadow-[inset_0px_0px_10px_rgba(0,0,0,0.1)]" style={{ transform: 'rotateY(180deg)' }}>
              <span className="font-serif text-2xl font-bold text-[#F5F5F0] dark:text-[#080808] drop-shadow-sm">象</span>
          </div>
        </div>
      </div>
    );
  };

  const YaoLabels = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto space-y-14">
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold font-serif tracking-[0.3em] text-[#111111] dark:text-[#EFEFEF]">
          {throws.length === 6 ? "起卦完成" : YaoLabels[throws.length]}
        </h2>
        <p className="text-black/50 dark:text-white/50 text-xs font-serif tracking-[0.4em]">气凝太初 · 感应由心</p>
      </div>

      <div className="flex justify-center space-x-6 sm:space-x-12 h-32 items-center w-full">
        {currentCoins.map((isCharSide, idx) => (
          <Coin key={idx} idx={idx} isCharSide={isCharSide === 1} spinning={isSpinning} />
        ))}
      </div>

      <div className="w-full flex flex-col items-center space-y-12">
        {throws.length < 6 && (
          <button
            onClick={handleThrow}
            disabled={isSpinning}
            className={`w-full sm:w-72 py-4 border border-[#111111] dark:border-[#EFEFEF] bg-transparent text-[#111111] dark:text-[#EFEFEF] hover:bg-[#111111] hover:text-[#F5F5F0] dark:hover:bg-[#EFEFEF] dark:hover:text-[#080808] transition-colors duration-500 font-bold text-sm tracking-[0.5em] uppercase 
              ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isSpinning ? '感 应 ...' : '掷 币'}
          </button>
        )}

        <div className="flex flex-col-reverse w-full max-w-[320px] space-y-6 space-y-reverse pt-8 border-t border-black/10 dark:border-white/10">
          {YaoLabels.map((label, idx) => {
            const t = throws[idx];
            return (
              <div key={idx} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-6 w-full h-8 group">
                <span className={`text-sm font-serif text-right font-bold transition-colors duration-500 ${t ? 'text-[#111111] dark:text-[#EFEFEF]' : 'text-black/30 dark:text-white/30'}`}>
                  {label}
                </span>
                <div className="flex-1 flex items-center justify-center relative h-full">
                  {!t ? (
                    <div className="w-full h-[1px] bg-black/10 dark:bg-white/10"></div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center animate-in zoom-in duration-700 ease-out">
                      {t.lineType === 'yang' && (
                        <div className="w-full h-[14px] bg-[#111111] dark:bg-[#EFEFEF]"></div>
                      )}
                      {t.lineType === 'yin' && (
                        <div className="w-full h-[14px] flex justify-between">
                          <div className="w-[45%] h-full bg-[#111111] dark:bg-[#EFEFEF]"></div>
                          <div className="w-[45%] h-full bg-[#111111] dark:bg-[#EFEFEF]"></div>
                        </div>
                      )}
                      {t.lineType === 'old_yang' && (
                        <div className="w-full h-4 bg-[#8B1D1D] dark:bg-[#A32626]"></div>
                      )}
                      {t.lineType === 'old_yin' && (
                        <div className="w-full h-4 flex justify-between">
                          <div className="w-[45%] h-full bg-[#8B1D1D] dark:bg-[#A32626]"></div>
                          <div className="w-[45%] h-full bg-[#8B1D1D] dark:bg-[#A32626]"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-[#8B1D1D] dark:text-[#A32626] font-serif font-bold text-center -ml-2">
                  {t?.lineType === 'old_yang' ? '○' : t?.lineType === 'old_yin' ? '✕' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes coinToss {
          0% {
            transform: translateY(0) rotateX(0deg) rotateY(0deg) scale(1);
          }
          50% {
            transform: translateY(-160px) rotateX(1080deg) rotateY(180deg) scale(1.1);
          }
          100% {
            transform: translateY(0) rotateX(2160deg) rotateY(360deg) scale(1);
          }
        }
        .animate-toss {
          animation: coinToss 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </div>
  );
};

export default CoinThrower;

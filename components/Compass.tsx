import React from 'react';

const Compass: React.FC = () => {
  return (
    <div className="relative w-80 h-80 md:w-[600px] md:h-[600px] flex items-center justify-center select-none group">
      
      {/* 极简环境背景：仅保留微弱的中心氛围晕染 */}
      <div className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-full blur-[100px] transition-all duration-[2000ms] group-hover:scale-110 ease-out opacity-50"></div>

      {/* 极简几何线构成的“仪”字抽象阵法 */}
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute inset-0 animate-[spin_100s_linear_infinite]">
          <svg viewBox="0 0 600 600" className="w-full h-full opacity-40 dark:opacity-30">
            <circle cx="300" cy="300" r="280" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 8" />
            <circle cx="300" cy="300" r="240" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="300" cy="300" r="140" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 4" />
          </svg>
        </div>

        {/* 交错的正方形，呈现神秘感 */}
        <div className="absolute w-[60%] h-[60%] animate-[spin_80s_linear_infinite_reverse]">
          <div className="w-full h-full border-[0.5px] border-black/40 dark:border-white/40 rotate-45 transform origin-center transition-all duration-1000 group-hover:scale-95 group-hover:border-black/60 dark:group-hover:border-white/60"></div>
        </div>
        <div className="absolute w-[60%] h-[60%] animate-[spin_80s_linear_infinite]">
          <div className="w-full h-full border-[0.5px] border-black/30 dark:border-white/30 transform origin-center transition-all duration-1000 group-hover:scale-90 group-hover:border-black/50 dark:group-hover:border-white/50"></div>
        </div>

        {/* 核心黑曜石/极白圆盘 */}
        <div className="absolute w-[25%] h-[25%] z-20 rounded-full bg-white dark:bg-black border border-black/10 dark:border-white/10 shadow-2xl flex items-center justify-center transition-transform duration-[1500ms] cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-110">
           <div className="w-[85%] h-[85%] rounded-full border border-black/5 dark:border-white/5 flex flex-col items-center justify-center">
              <span className="text-sm font-serif tracking-[1em] text-black/50 dark:text-white/50 mb-1 ml-4">易</span>
              <span className="text-4xl font-serif text-[#8B1D1D] dark:text-[#A32626]">象</span>
           </div>
        </div>

        {/* 指向四方的极细游丝针 */}
        <div className="absolute w-full h-full pointer-events-none z-30 opacity-70">
          <svg viewBox="0 0 600 600" className="w-full h-full">
            <line x1="300" y1="20" x2="300" y2="580" stroke="#8B1D1D" strokeWidth="0.5" strokeDasharray="20 40" opacity="0.6"/>
            <line x1="20" y1="300" x2="580" y2="300" stroke="#8B1D1D" strokeWidth="0.5" strokeDasharray="20 40" opacity="0.6"/>
            <circle cx="300" cy="300" r="3" fill="#8B1D1D" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Compass;

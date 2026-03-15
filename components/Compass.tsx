import React from 'react';

const Compass: React.FC = () => {
  // 六十四卦简名（按八宫顺序排列，确保视觉分布均匀）
  const hexagrams = [
    "乾","姤","遁","否","观","剥","晋","大有",
    "兑","困","萃","咸","蹇","谦","小过","归妹",
    "离","旅","鼎","未济","蒙","涣","讼","同人",
    "震","豫","解","恒","升","井","大过","随",
    "巽","小畜","家人","益","无妄","噬嗑","颐","蛊",
    "坎","节","屯","既济","革","丰","明夷","师",
    "艮","贲","大畜","损","睽","履","中孚","渐",
    "坤","复","临","泰","大壮","夬","需","比"
  ];

  const stemsBranches = ["甲","卯","乙","辰","巽","巳","丙","午","丁","未","坤","申","庚","酉","辛","戌","乾","亥","壬","子","癸","丑","艮","寅"];

  return (
    <div className="relative w-80 h-80 md:w-[600px] md:h-[600px] flex items-center justify-center select-none group">
      {/* 底部扩散金光 */}
      <div className="absolute inset-0 bg-gold-700/20 rounded-full blur-[120px] animate-pulse-glow group-hover:bg-gold-500/40 transition-all duration-[1500ms] ease-out"></div>
      <div className="absolute inset-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] rounded-full opacity-30 pointer-events-none mix-blend-overlay"></div>

      {/* 罗盘容器 */}
      <div className="relative w-full h-full flex items-center justify-center filter drop-shadow-[0_0_30px_rgba(212,175,55,0.2)]">
        
        {/* 最外层：六十四卦环 (旋转最慢) */}
        <div className="absolute inset-0 animate-[spin_120s_linear_infinite]">
          <svg viewBox="0 0 600 600" className="w-full h-full">
            <defs>
              <filter id="goldGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* 底盘 */}
            <circle cx="300" cy="300" r="295" fill="#040914" stroke="#D4AF37" strokeWidth="1.5" strokeOpacity="0.8" />
            <circle cx="300" cy="300" r="260" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.4" />
            
            {/* 六十四卦刻度与文字 */}
            {hexagrams.map((name, i) => {
              const angle = (i * 360) / 64 - 90;
              const rad = (angle * Math.PI) / 180;
              const xText = 300 + 278 * Math.cos(rad);
              const yText = 300 + 278 * Math.sin(rad);
              return (
                <g key={`hex-${i}`}>
                  <line 
                    x1={300 + 260 * Math.cos(rad)} y1={300 + 260 * Math.sin(rad)}
                    x2={300 + 295 * Math.cos(rad)} y2={300 + 295 * Math.sin(rad)}
                    stroke="#D4AF37" strokeWidth="0.5" opacity="0.5"
                  />
                  <text
                    x={xText} y={yText}
                    fill="#F2DF8E" fontSize="10" fontWeight="600"
                    textAnchor="middle" alignmentBaseline="middle"
                    transform={`rotate(${angle + 90}, ${xText}, ${yText})`}
                    className="font-serif opacity-90 tracking-widest"
                  >
                    {name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 中间层：二十四山环 (反向旋转) */}
        <div className="absolute w-[82%] h-[82%] animate-[spin_80s_linear_infinite_reverse]">
          <svg viewBox="0 0 500 500" className="w-full h-full">
            <circle cx="250" cy="250" r="245" fill="#0B0F19" stroke="#9E8022" strokeWidth="1" />
            {stemsBranches.map((name, i) => {
              const angle = (i * 360) / 24 - 90;
              const rad = (angle * Math.PI) / 180;
              const x = 250 + 225 * Math.cos(rad);
              const y = 250 + 225 * Math.sin(rad);
              return (
                <g key={`sb-${i}`}>
                  <line 
                    x1={250 + 205 * Math.cos(rad)} y1={250 + 205 * Math.sin(rad)}
                    x2={250 + 245 * Math.cos(rad)} y2={250 + 245 * Math.sin(rad)}
                    stroke="#D4AF37" strokeWidth="1" opacity="0.4"
                  />
                  <text
                    x={x} y={y}
                    fill="#D4AF37" fontSize="14" fontWeight="bold"
                    textAnchor="middle" alignmentBaseline="middle"
                    transform={`rotate(${angle + 90}, ${x}, ${y})`}
                    className="font-serif"
                    filter="url(#goldGlow)"
                  >
                    {name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 内层：八卦符号环 (旋转较快) */}
        <div className="absolute w-[62%] h-[62%] animate-[spin_50s_linear_infinite]">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle cx="200" cy="200" r="195" fill="#040914" stroke="#D4AF37" strokeWidth="1.5" />
            {[...Array(8)].map((_, i) => {
              const angle = (i * 45) - 90;
              const rad = (angle * Math.PI) / 180;
              const x = 200 + 170 * Math.cos(rad);
              const y = 200 + 170 * Math.sin(rad);
              // 简单的八卦符号
              const trigrams = ["☰","☱","☲","☳","☴","☵","☶","☷"];
              return (
                <text
                  key={`tri-${i}`}
                  x={x} y={y}
                  fill="#FDF7E5" fontSize="36"
                  textAnchor="middle" alignmentBaseline="middle"
                  transform={`rotate(${angle + 90}, ${x}, ${y})`}
                  opacity="0.9"
                >
                  {trigrams[i]}
                </text>
              );
            })}
          </svg>
        </div>

        {/* 核心：天池太极 (持续稳定旋转) */}
        <div className="absolute w-[35%] h-[35%] z-20 shadow-[0_0_80px_rgba(212,175,55,0.5)] rounded-full transition-shadow duration-1000 group-hover:shadow-[0_0_100px_rgba(212,175,55,0.7)]">
          <svg viewBox="0 0 200 200" className="w-full h-full animate-[spin_20s_linear_infinite]">
            <circle cx="100" cy="100" r="98" fill="#0B0F19" stroke="#D4AF37" strokeWidth="3" />
            <path d="M 100,20 A 40,40 0 0 1 100,100 A 40,40 0 0 0 100,180 A 80,80 0 0 0 100,20" fill="#D4AF37" />
            <path d="M 100,20 A 40,40 0 0 1 100,100 A 40,40 0 0 0 100,180 A 80,80 0 0 1 100,20" fill="#040914" />
            <circle cx="100" cy="60" r="12" fill="#040914" />
            <circle cx="100" cy="140" r="12" fill="#D4AF37" />
          </svg>
        </div>

        {/* 罗盘指针（天针） - 不随罗盘旋转，始终指向正北，增加写实感 */}
        <div className="absolute w-full h-full pointer-events-none z-30">
          <svg viewBox="0 0 600 600" className="w-full h-full">
            <line x1="300" y1="50" x2="300" y2="550" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
            <line x1="50" y1="300" x2="550" y2="300" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
            {/* 指针 */}
            <path d="M 300,110 L 304,300 L 296,300 Z" fill="#ef4444" opacity="0.9" />
            <path d="M 300,490 L 304,300 L 296,300 Z" fill="#94a3b8" opacity="0.9" />
            <circle cx="300" cy="300" r="4.5" fill="#D4AF37" />
          </svg>
        </div>
      </div>

      {/* 覆盖在中心的交互文字 */}
      <div className="absolute z-40 flex flex-col items-center justify-center transform cursor-pointer group-hover:scale-110 transition-transform duration-[1200ms] ease-out">
        <div className="w-[110px] h-[110px] rounded-full flex items-center justify-center bg-neutral-100/80 dark:bg-obsidian/70 backdrop-blur-2xl border border-gold-500/50 shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-all duration-700 group-hover:bg-gold-500/10">
           <span className="text-5xl font-black gold-text-gradient font-serif -mt-1 drop-shadow-lg">
             易
           </span>
        </div>
      </div>
    </div>
  );
};

export default Compass;

import React, { useEffect, useState } from 'react';
import { DivinationRecord, UserProfile } from '../types';
import { getUserHistory } from '../services/divinationDb';

interface HistoryPageProps {
  profile: UserProfile;
  onBack: () => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ profile, onBack }) => {
  const [records, setRecords] = useState<DivinationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getUserHistory(profile.id);
        setRecords(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile.id]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}  ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col h-full animate-in fade-in duration-700 mt-12 md:mt-4">
      {/* 标题 */}
      <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8">
        <p className="text-[#8B1D1D] dark:text-[#A32626] text-xs tracking-[0.4em] uppercase mb-2 font-bold">历 史 记 录</p>
        <h2 className="text-4xl md:text-5xl font-black font-serif tracking-[0.2em] text-[#111111] dark:text-[#EFEFEF]">
          {profile.username}
        </h2>
      </div>

      {/* 内容区 */}
      <div className="overflow-y-auto pr-2 flex-1 custom-scrollbar pb-8 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border border-black/20 dark:border-white/20 animate-spin" />
          </div>
        )}
        {error && <p className="text-[#8B1D1D] font-serif text-center py-12">{error}</p>}
        {!loading && !error && records.length === 0 && (
          <div className="text-center py-20">
            <p className="text-black/30 dark:text-white/30 font-serif text-xl tracking-[0.3em]">尚无卜卦记录</p>
          </div>
        )}

        {records.map(record => (
          <div
            key={record.id}
            className="glass-panel rounded-none p-6 cursor-pointer hover:shadow-lg transition-all duration-300"
            onClick={() => setExpanded(expanded === record.id ? null : record.id)}
          >
            {/* 记录头 */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] tracking-[0.3em] text-[#8B1D1D] dark:text-[#A32626] font-bold">{record.type}</span>
                  <span className="text-[10px] tracking-[0.2em] text-black/30 dark:text-white/30">{formatDate(record.created_at)}</span>
                </div>
                <p className="text-sm font-serif text-[#111111] dark:text-[#EFEFEF] truncate">"{record.question}"</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-black font-serif tracking-[0.3em] text-[#111111] dark:text-[#EFEFEF]">{record.hexagram}</p>
                <svg
                  xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" className={`ml-auto mt-1 text-black/30 dark:text-white/30 transition-transform duration-300 ${expanded === record.id ? 'rotate-180' : ''}`}
                >
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </div>
            </div>

            {/* 展开内容 */}
            {expanded === record.id && (
              <div className="mt-5 pt-5 border-t border-black/10 dark:border-white/10 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="prose prose-invert max-w-none space-y-4">
                  {record.result.split('\n').map((line, i) => {
                    const isHeader = line.startsWith('#');
                    const cleanLine = line.replace(/#/g, '').trim();
                    if (!cleanLine) return <div key={i} className="h-2" />;
                    return isHeader ? (
                      <h4 key={i} className="font-serif font-bold text-base tracking-[0.2em] text-[#111111] dark:text-[#EFEFEF] border-l-2 border-[#8B1D1D] pl-3">
                        {cleanLine}
                      </h4>
                    ) : (
                      <p key={i} className="text-sm text-black/70 dark:text-white/70 leading-loose font-sans tracking-wide">
                        {cleanLine}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,29,29,0.4); }
      `}</style>
    </div>
  );
};

export default HistoryPage;

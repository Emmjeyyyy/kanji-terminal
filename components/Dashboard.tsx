import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AppState, KanjiData, UserProgress } from '../types';
import { kanjiList } from '../data/kanji';
import { Activity, BookOpen, AlertCircle, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardProps {
  state: AppState;
  onResolve: () => void;
}

const StatCard = ({ title, value, icon: Icon, color, themeColor }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="border border-current p-2 md:p-3 rounded bg-opacity-10 flex items-center justify-between hover:bg-white/10 transition-colors"
    style={{ backgroundColor: themeColor + '10' }}
  >
    <div>
      <h3 className="text-[17px] md:text-[17px] opacity-90 uppercase tracking-widest font-bold">{title}</h3>
      <p className="text-xl md:text-2xl font-bold mt-1 font-mono">{value}</p>
    </div>
    <Icon className={`w-10 h-10 md:w-12 md:h-12 opacity-90 ${color}`} />
  </motion.div>
);

const PrintStreamX = ({ filled = true, className = "" }: { filled?: boolean, className?: string }) => {
  // Path for a thick X shape
  const d="M 50 40L 75 15 L 85 15 L 85 25 L 60 50L 85 75 L 85 85 L 75 85 L 50 60L 25 85 L 15 85 L 15 75 L 40 50L 15 25 L 15 15 L 25 15Z";
  
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className} 
      style={{ overflow: 'visible' }}
    >
      <path 
        d={d} 
        fill={filled ? "currentColor" : "none"} 
        stroke={filled ? "none" : "currentColor"}
        strokeWidth={filled ? "0" : "1.5"}
      />
    </svg>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ state, onResolve }) => {
  const totalKanji = kanjiList.length;
  const themeColor = state.settings.theme === 'green' ? '#4ade80' : '#fbbf24';
  
  // Learned: Count all kanji that the player has discovered (present in progress)
  const learnedCount = Object.keys(state.progress).length;
  
  const allProgress = Object.values(state.progress) as UserProgress[];

  // Mastered: Global mastery progress (mastered / total DB)
  const graduatedCount = allProgress.filter(p => p.status === 'graduated').length;
  const masteryPercentage = Math.round((graduatedCount / totalKanji) * 100);
  
  // Accuracy: Correct answers / Total attempts (From Daily/Sim only)
  let totalAccCorrect = 0;
  let totalAccAttempts = 0;
  allProgress.forEach(p => {
    const c = p.accCorrect || 0;
    const m = p.accMiss || 0;
    totalAccCorrect += c;
    totalAccAttempts += (c + m);
  });
  const accuracy = totalAccAttempts > 0 ? Math.round((totalAccCorrect / totalAccAttempts) * 100) : 0;

  // Weak Items: Track all kanji answered incorrectly (missCount > 0)
  const weakProgressList = allProgress
    .filter(p => p.missCount > 0)
    .sort((a, b) => b.missCount - a.missCount);
    
  const weakCount = weakProgressList.length;
  const weakKanji = weakProgressList.map(p => kanjiList.find(k => k.id === p.kanjiId)!);

  // Chart Data preparation (Current Calendar Week: Sun-Sat)
  const chartData = [];
  const today = new Date();
  const currentDayIndex = today.getDay(); // 0 = Sun, 6 = Sat
  
  // Calculate start of the week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayIndex);
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateKey = d.toDateString();
    
    chartData.push({
      name: days[i],
      sessions: state.reviewHistory[dateKey] || 0
    });
  }

  return (
    <div className="space-y-2 md:space-y-3 pb-1 overflow-y-auto h-full pr-1 custom-scrollbar flex flex-col">
      <header className="border-b py-[8px] mb-1 shrink-0 flex justify-between items-end" style={{ borderColor: themeColor }}>
        <div className="-translate-y-[10px]">
            <h1 className="text-xl md:text-3xl font-bold uppercase tracking-tighter flex items-center gap-2">
            <Activity className="w-5 h-5 md:w-6 md:h-6" /> 
            Operator Stats
            </h1>
            <p className="text-[10px] md:text-xs opacity-90 font-mono mt-0.5">System Status: ONLINE // Monitoring Learning Progress</p>
        </div>
        <div className="flex -translate-y-[44px] gap-[50px] md:gap-[40px] mb-1.5 opacity-100 mr-[45px]">
          <PrintStreamX filled={true} className="w-3 h-3 md:w-4 md:h-4" />
          <PrintStreamX filled={true} className="w-3 h-3 md:w-4 md:h-4" />
          <PrintStreamX filled={false} className="w-3 h-3 md:w-4 md:h-4" />
          <PrintStreamX filled={false} className="w-3 h-3 md:w-4 md:h-4" />
        </div>

      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 shrink-0">
        <StatCard title="Learned" value={`${learnedCount}/${totalKanji}`} icon={BookOpen} themeColor={themeColor} />
        <StatCard title="Mastered" value={`${masteryPercentage}%`} icon={TrendingUp} themeColor={themeColor} />
        <StatCard title="Accuracy" value={`${accuracy}%`} icon={Activity} themeColor={themeColor} />
        <StatCard title="Weak Items" value={weakCount} icon={AlertCircle} themeColor={themeColor} />
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-4 mt-1">
        <div className="lg:col-span-2 border border-current p-3 rounded flex flex-col min-h-[220px]" style={{ backgroundColor: themeColor + '10' }}>
            <h3 className="text-base md:text-lg mb-2 font-bold border-b pb-1" style={{ borderColor: themeColor }}>Review Frequency (Current Week)</h3>
            <div className="flex-1 w-full min-h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke={themeColor} />
                  <XAxis dataKey="name" stroke={themeColor} tick={{fill: themeColor, fontSize: 12}} />
                  <YAxis stroke={themeColor} tick={{fill: themeColor, fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: themeColor, color: themeColor, fontSize: '12px' }}
                    itemStyle={{ color: themeColor }}
                    cursor={{fill: themeColor, opacity: 0.1}}
                  />
                  <Bar dataKey="sessions" fill={themeColor} fillOpacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
        </div>

        <div className="border border-current p-3 rounded flex flex-col overflow-hidden min-h-[200px]" style={{ backgroundColor: themeColor + '10' }}>
          <div className="flex justify-between items-center border-b pb-1 mb-2" style={{ borderColor: themeColor }}>
            <h3 className="text-base md:text-lg font-bold">Critical Attention</h3>
            {weakKanji.length > 0 && (
                <button 
                  onClick={onResolve}
                  className="flex items-center gap-1.5 px-3 py-1 text-[13px] md:text-xs font-bold uppercase border border-current hover:bg-[var(--theme-color)] hover:text-black transition-all shadow-[0_0_5px_rgba(0,0,0,0.5)] hover:shadow-[0_0_10px_var(--theme-color)] active:scale-95"
                >
                    <Zap size={12} fill="currentColor" /> RESOLVE
                </button>
            )}
          </div>
          {weakKanji.length === 0 ? (
            <div className="flex-1 flex items-center justify-center opacity-75 italic text-xs md:text-[20px]">
              No weak items detected.
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1">
              {weakKanji.map(k => (
                <div key={k.id} className="flex items-center justify-between p-2 border border-current rounded hover:bg-white/5 transition-colors">
                  <span className="text-lg md:text-xl font-bold">{k.char}</span>
                  <div className="text-right">
                    <div className="text-[10px] md:text-xs opacity-90 font-bold">{k.meaning}</div>
                    <div className="text-[10px] font-mono opacity-80">Misses: {state.progress[k.id]?.missCount}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
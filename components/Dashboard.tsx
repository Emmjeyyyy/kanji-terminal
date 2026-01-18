import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AppState, KanjiData } from '../types';
import { kanjiList } from '../data/kanji';
import { Activity, BookOpen, AlertCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardProps {
  state: AppState;
}

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="border border-current p-2 md:p-3 rounded bg-opacity-10 bg-white/5 flex items-center justify-between hover:bg-white/10 transition-colors"
  >
    <div>
      <h3 className="text-[10px] md:text-xs opacity-90 uppercase tracking-widest font-bold">{title}</h3>
      <p className="text-xl md:text-2xl font-bold mt-1 font-mono">{value}</p>
    </div>
    <Icon className={`w-5 h-5 md:w-6 md:h-6 opacity-90 ${color}`} />
  </motion.div>
);

export const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const totalKanji = kanjiList.length;
  const learnedCount = Object.keys(state.progress).length;
  const graduatedCount = Object.values(state.progress).filter(p => p.status === 'graduated').length;
  
  // Calculate accuracy
  let totalCorrect = 0;
  let totalAttempts = 0;
  Object.values(state.progress).forEach(p => {
    totalCorrect += p.correctCount;
    totalAttempts += (p.correctCount + p.missCount);
  });
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  // Chart Data preparation
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  });

  const chartData = last7Days.map(day => ({
    name: day,
    reviews: Math.floor(Math.random() * (learnedCount / 2)) // Mock visual
  }));

  const weakKanjiIds = Object.values(state.progress)
    .filter(p => p.missCount > 2)
    .sort((a, b) => b.missCount - a.missCount)
    .slice(0, 5)
    .map(p => p.kanjiId);
    
  const weakKanji = kanjiList.filter(k => weakKanjiIds.includes(k.id));

  return (
    <div className="space-y-2 md:space-y-3 pb-1 overflow-y-auto h-full pr-1 custom-scrollbar flex flex-col">
      <header className="border-b border-current pb-1 mb-1 shrink-0">
        <h1 className="text-xl md:text-3xl font-bold uppercase tracking-tighter flex items-center gap-2">
          <Activity className="w-5 h-5 md:w-6 md:h-6" /> 
          Operator Stats
        </h1>
        <p className="text-[10px] md:text-xs opacity-90 font-mono mt-0.5">System Status: ONLINE // Monitoring Learning Progress</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 shrink-0">
        <StatCard title="Learned" value={`${learnedCount}/${totalKanji}`} icon={BookOpen} />
        <StatCard title="Mastered" value={graduatedCount} icon={TrendingUp} />
        <StatCard title="Accuracy" value={`${accuracy}%`} icon={Activity} />
        <StatCard title="Weak Items" value={weakKanji.length} icon={AlertCircle} />
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-4 mt-1">
        <div className="lg:col-span-2 border border-current p-3 rounded bg-white/5 flex flex-col min-h-[220px]">
            <h3 className="text-base md:text-lg mb-2 font-bold border-b border-current/30 pb-1">Review Frequency (7 Days)</h3>
            <div className="flex-1 w-full min-h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="currentColor" />
                  <XAxis dataKey="name" stroke="currentColor" tick={{fill: 'currentColor', fontSize: 12}} />
                  <YAxis stroke="currentColor" tick={{fill: 'currentColor', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: 'currentColor', color: 'currentColor', fontSize: '12px' }}
                    itemStyle={{ color: 'currentColor' }}
                    cursor={{fill: 'rgba(255,255,255,0.1)'}}
                  />
                  <Bar dataKey="reviews" fill="currentColor" fillOpacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
        </div>

        <div className="border border-current p-3 rounded bg-white/5 flex flex-col overflow-hidden min-h-[200px]">
          <h3 className="text-base md:text-lg mb-2 font-bold border-b border-current/30 pb-1">Critical Attention</h3>
          {weakKanji.length === 0 ? (
            <div className="flex-1 flex items-center justify-center opacity-75 italic text-xs md:text-sm">
              No weak items detected.
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1">
              {weakKanji.map(k => (
                <div key={k.id} className="flex items-center justify-between p-2 border border-current/30 rounded hover:bg-white/5 transition-colors">
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
"use client";

import React, { FC, useEffect, useState } from 'react';
import { CyberpunkHudHeader } from "@/components/ui/cyberpunk-hud-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, CheckCircle, BookOpen, Quote, ArrowUpRight, Plus, Flame, Target, Trophy, ShieldCheck, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from "@/utils/supabase/client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon?: React.ReactNode;
  description?: string | React.ReactNode;
  valueClassName?: string;
  href?: string;
}

const MetricCard: FC<MetricCardProps> = ({ title, value, unit = '', icon, description, valueClassName, href }) => {
  const content = (
    <Card className={cn(
      "flex-1 transition-all duration-300 border-slate-100",
      href && "hover:border-indigo-200 hover:shadow-md cursor-pointer group"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {href && <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />}
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-black tracking-tight", valueClassName)}>
          {typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) : value}{unit}
        </div>
        {description && <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{description}</p>}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};

interface JournalSliderProps {
  notes: { id: string; title: string; content: string }[];
}

const JournalSlider: FC<JournalSliderProps> = ({ notes }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (notes.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notes.length);
    }, 180000); // 3 minutes rotation
    return () => clearInterval(timer);
  }, [notes.length]);

  if (notes.length === 0) {
    return (
      <Card 
        onClick={() => router.push('/journal')}
        className="col-span-1 md:col-span-2 lg:col-span-4 h-[200px] bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-2xl relative cursor-pointer group hover:shadow-indigo-500/20 transition-all"
      >
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-indigo-400">
            <BookOpen className="h-5 w-5" /> Journal Notes
          </CardTitle>
          <CardDescription className="text-slate-400">Tactical archives</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[100px] text-center">
          <p className="text-lg font-medium text-slate-400">No journal notes saved</p>
          <div className="flex items-center gap-2 mt-2 text-indigo-400 group-hover:text-indigo-300 transition-colors">
            <Plus className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Add New</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeNote = notes[currentIndex];
  // Strip HTML tags for preview
  const plainTextContent = activeNote.content.replace(/<[^>]*>?/gm, '') || "Untitled Report";

  return (
    <Card 
      onClick={() => router.push(`/journal?id=${activeNote.id}`)}
      className="col-span-1 md:col-span-2 lg:col-span-4 h-[200px] overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-2xl relative cursor-pointer group hover:shadow-indigo-500/20 transition-all"
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-indigo-400">
          <BookOpen className="h-5 w-5" /> Journal Notes
        </CardTitle>
        <CardDescription className="text-slate-400">{activeNote.title}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center h-[100px] px-12 text-center">
        <div key={currentIndex} className="animate-in fade-in slide-in-from-right-8 duration-700 ease-in-out">
          <Quote className="h-4 w-4 text-indigo-500/50 mb-2 mx-auto" />
          <p className="text-lg font-medium italic tracking-wide text-slate-200 line-clamp-2">
            "{plainTextContent}"
          </p>
        </div>
      </CardContent>
      {/* Progress dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
        {notes.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 rounded-full transition-all duration-500",
              i === currentIndex ? "w-6 bg-indigo-500" : "w-1.5 bg-slate-700"
            )}
          />
        ))}
      </div>
    </Card>
  );
};

export const OverviewDashboard: FC = () => {
  const supabase = createClient();
  const [routineStats, setRoutineStats] = useState({ coverage: 0, completed: 0, total: 0 });
  const [journalNotes, setJournalNotes] = useState<{ id: string; title: string; content: string }[]>([]);
  const [addictionStats, setAddictionStats] = useState({ longestStreak: 0, activeBattles: 0 });
  const [goalStats, setGoalStats] = useState({ overallProgress: 0, activeGoals: 0 });
  const [victoryData, setVictoryData] = useState<any[]>([]);

  /**
   * Fetches real-time tactical data.
   * Implementation Date: 2026-06-07
   */
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Routine Stats
      const { data: routineData } = await supabase
        .from("daily_routines")
        .select("is_completed")
        .eq("user_id", user.id);

      if (routineData) {
        const total = routineData.length;
        const completed = routineData.filter(item => item.is_completed).length;
        const coverage = total > 0 ? (completed / total) * 100 : 0;
        setRoutineStats({ coverage, completed, total });
      }

      // 2. Fetch Journal Notes for Slider
      const { data: journalData } = await supabase
        .from("journals")
        .select("id, title, content")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      
      if (journalData) {
        setJournalNotes(journalData);
      }

      // 3. Fetch Addiction Stats
      const { data: addictionData } = await supabase
        .from("addictions")
        .select("last_relapse_at")
        .eq("user_id", user.id);

      if (addictionData) {
        const now = new Date();
        let longest = 0;
        addictionData.forEach(a => {
          const diff = now.getTime() - new Date(a.last_relapse_at).getTime();
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          if (days > longest) longest = days;
        });
        setAddictionStats({ longestStreak: longest, activeBattles: addictionData.length });
      }

      // 4. Fetch Goal Stats
      const { data: goalData } = await supabase
        .from("goals")
        .select("progress, status")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (goalData) {
        const activeCount = goalData.length;
        const avgProgress = activeCount > 0 
          ? goalData.reduce((acc, curr) => acc + curr.progress, 0) / activeCount 
          : 0;
        setGoalStats({ overallProgress: avgProgress, activeGoals: activeCount });
      }

      // 5. Fetch Holistic Victory Data (Last 7 Days)
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });

      const startDate = last7Days[0];

      const [
        { data: logs },
        { data: relapses },
        { data: journals }
      ] = await Promise.all([
        supabase.from("daily_routine_logs").select("date, completion_percentage").eq("user_id", user.id).gte("date", startDate),
        supabase.from("relapse_history").select("timestamp").eq("user_id", user.id).gte("timestamp", startDate),
        supabase.from("journals").select("created_at").eq("user_id", user.id).gte("created_at", startDate)
      ]);

      const chartData = last7Days.map(date => {
        const log = logs?.find(l => l.date === date);
        const dayRelapses = relapses?.filter(r => r.timestamp.split('T')[0] === date) || [];
        const dayJournals = journals?.filter(j => j.created_at.split('T')[0] === date) || [];

        // Smart Victory Formula:
        // Base: Routine Completion (0-100)
        // Bonus: +10 for Journaling
        // Penalty: -50 for Relapse
        let routineScore = log?.completion_percentage || 0;
        let bonus = dayJournals.length > 0 ? 10 : 0;
        let penalty = dayRelapses.length > 0 ? -50 : 0;
        
        let totalScore = Math.max(0, Math.min(100, routineScore + bonus + penalty));

        return {
          date: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
          victory: totalScore,
          routine: routineScore,
          journalBonus: bonus,
          relapsePenalty: penalty,
          fullDate: date
        };
      });

      setVictoryData(chartData);
    };

    fetchData();
    
    // Sync routine changes
    const routineChannel = supabase
      .channel('routine-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_routines' }, fetchData)
      .subscribe();

    // Sync journal changes
    const journalChannel = supabase
      .channel('journal-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'journals' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(routineChannel);
      supabase.removeChannel(journalChannel);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-50/50 text-foreground p-4 md:p-8 flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 uppercase italic">
          COMMAND CENTER
        </h1>
        <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-widest text-[10px]">
          <ShieldCheck size={14} />
          <span>Executive Overview // System Status: Active</span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Routine Coverage"
          value={routineStats.coverage}
          unit="%"
          icon={<Activity className="h-4 w-4 text-emerald-500" />}
          description="Tactical Execution"
          valueClassName="text-emerald-500"
          href="/routine"
        />
        <MetricCard
          title="Peak Discipline"
          value={addictionStats.longestStreak}
          unit=" DAYS"
          icon={<Flame className="h-4 w-4 text-orange-500" />}
          description="Unfazed"
          valueClassName="text-orange-500"
          href="/addiction"
        />
        <MetricCard
          title="Mission Progress"
          value={goalStats.overallProgress}
          unit="%"
          icon={<Target className="h-4 w-4 text-indigo-500" />}
          description="Goal Advancement"
          valueClassName="text-indigo-500"
          href="/goals"
        />
        <MetricCard
          title="Active Battles"
          value={addictionStats.activeBattles}
          unit=""
          icon={<Trophy className="h-4 w-4 text-amber-500" />}
          description="Identified Enemies"
          valueClassName="text-amber-500"
          href="/addiction"
        />
        <MetricCard
          title="Pending Tasks"
          value={routineStats.total - routineStats.completed}
          unit=""
          icon={<CheckCircle className="h-4 w-4 text-slate-400" />}
          description="Awaiting Execution"
          valueClassName="text-slate-600"
          href="/routine"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Victory Trend Chart */}
        <Card className="lg:col-span-2 border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <BarChart3 size={14} className="text-indigo-500" />
                  Victory Trend
                </CardTitle>
                <CardDescription className="text-slate-900 font-bold text-lg">Weekly Discipline Analysis</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                Completion %
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 h-[300px]">
            {victoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={victoryData}>
                  <defs>
                    <linearGradient id="colorVictory" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 min-w-[160px]">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Victory Score</span>
                                <span className="text-sm font-black text-indigo-600">{data.victory}%</span>
                              </div>
                              <div className="h-px bg-slate-50 my-1" />
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Routine</span>
                                <span className="text-[10px] font-bold text-slate-600">{data.routine}%</span>
                              </div>
                              {data.journalBonus > 0 && (
                                <div className="flex justify-between items-center gap-4">
                                  <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">Journal Bonus</span>
                                  <span className="text-[10px] font-bold text-emerald-600">+{data.journalBonus}%</span>
                                </div>
                              )}
                              {data.relapsePenalty < 0 && (
                                <div className="flex justify-between items-center gap-4">
                                  <span className="text-[8px] font-bold text-red-500 uppercase tracking-tighter">Relapse Penalty</span>
                                  <span className="text-[10px] font-bold text-red-600">{data.relapsePenalty}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="victory" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorVictory)" 
                    dot={{ r: 4, fill: '#fff', stroke: '#6366f1', strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold uppercase tracking-widest">
                Insufficient Data for Analysis
              </div>
            )}
          </CardContent>
        </Card>

        {/* Journal Slider & Quick Actions */}
        <div className="flex flex-col gap-8">
          <JournalSlider notes={journalNotes} />
          
          <Card className="flex-1 border-slate-100 shadow-sm rounded-3xl bg-white p-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Quick Deployment</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/routine">
                <Button className="w-full h-12 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-900 border border-slate-100 hover:border-indigo-200 shadow-none transition-all group">
                  <Plus className="w-4 h-4 mr-2 text-indigo-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase">New Task</span>
                </Button>
              </Link>
              <Link href="/journal">
                <Button className="w-full h-12 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-900 border border-slate-100 hover:border-emerald-200 shadow-none transition-all group">
                  <BookOpen className="w-4 h-4 mr-2 text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase">New Entry</span>
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  ShieldAlert, 
  Plus, 
  RefreshCcw, 
  History, 
  TrendingUp, 
  Flame, 
  Clock, 
  Calendar, 
  MessageSquare,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Zap,
  MoreVertical,
  X,
  Heart,
  AlertCircle,
  Skull,
  Sword,
  Trophy,
  BarChart3
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "./dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { useToast } from "./use-toast";

import Link from "next/link";
import { Addiction, RelapseRecord } from "../../lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Local component state still uses these for initial mock data, 
// but we'll align them with the database types.

const STORAGE_KEY = "pawn2king_addictions";

const formatDuration = (ms: number) => {
  if (isNaN(ms) || ms < 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return {
    days,
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60
  };
};

const formatDurationString = (ms: number) => {
  const { days, hours, minutes, seconds } = formatDuration(ms);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

export function AddictionTracker() {
  const [addictions, setAddictions] = useState<Addiction[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newAddictionName, setNewAddictionName] = useState("");
  const [relapseModalOpen, setRelapseModalOpen] = useState(false);
  const [activeAddictionId, setActiveAddictionId] = useState<string | null>(null);
  const [selectedBattleId, setSelectedBattleId] = useState<string>("all");
  const [relapseReason, setRelapseReason] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Tick every second for live counters
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: Ensure last_relapse_at exists for older data
        const migrated = parsed.map((a: any) => ({
          ...a,
          last_relapse_at: a.last_relapse_at || a.lastRelapse || new Date().toISOString(),
          history: (a.history || []).map((h: any) => ({
            ...h,
            streak_before_relapse: h.streak_before_relapse || h.streakBeforeRelapse || "0s"
          }))
        }));
        setAddictions(migrated);
      } catch (e) {
        console.error("Failed to load addictions", e);
      }
    }
  }, []);

  useEffect(() => {
    // Always save, even if empty, so deletions persist
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addictions));
  }, [addictions]);

  const kpis = useMemo(() => {
    const totalBattles = addictions.length;
    const totalFailures = addictions.reduce((acc, curr) => acc + (curr.history?.length || 0), 0);
    
    let longestStreakMs = 0;
    addictions.forEach(a => {
      const currentStreak = currentTime.getTime() - new Date(a.last_relapse_at).getTime();
      if (currentStreak > longestStreakMs) longestStreakMs = currentStreak;
      
      a.history?.forEach(h => {
        // h.streak_before_relapse is a string like "2d 4h 10m 5s", need to parse or use timestamps
        // For simplicity, let's just track current longest streak for now or parse historical ones
        // Since we have the history timestamps, we could calculate historical streaks properly
      });
    });

    const activeStreaks = addictions.filter(a => {
      const diff = currentTime.getTime() - new Date(a.last_relapse_at).getTime();
      return diff > 24 * 60 * 60 * 1000; // at least 1 day
    }).length;

    return {
      totalBattles,
      totalFailures,
      longestStreak: formatDurationString(longestStreakMs),
      activeStreaks
    };
  }, [addictions, currentTime]);

  const chartData = useMemo(() => {
    const last30Days = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      let count = 0;
      addictions.forEach(a => {
        if (selectedBattleId !== "all" && a.id !== selectedBattleId) return;
        
        a.history?.forEach(h => {
          if (h.timestamp.split('T')[0] === date) {
            count++;
          }
        });
      });
      return {
        date: date.split('-').slice(1).join('/'), // MM/DD
        relapses: count
      };
    });
  }, [addictions, selectedBattleId]);

  const addAddiction = () => {
    if (!newAddictionName.trim()) return;
    const newAddiction: Addiction = {
      id: Date.now().toString(),
      user_id: "mock-user-id", // Will be replaced by actual auth user id
      name: newAddictionName.trim(),
      last_relapse_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      history: []
    };
    setAddictions(prev => [...prev, newAddiction]);
    setNewAddictionName("");
    setIsAdding(false);
    toast({
      title: "Battle Commenced",
      description: `Tracking started for: ${newAddiction.name}`,
    });
  };

  const deleteAddiction = (id: string) => {
    if (window.confirm("Delete this tracker permanently? History will be lost.")) {
      setAddictions(prev => prev.filter(a => a.id !== id));
      toast({
        title: "Tracker Removed",
        variant: "destructive"
      });
    }
  };

  const handleRelapse = () => {
    if (!activeAddictionId || !relapseReason.trim()) return;
    
    setAddictions(prev => prev.map(a => {
      if (a.id !== activeAddictionId) return a;
      
      const lastRelapseDate = new Date(a.last_relapse_at);
      const diff = currentTime.getTime() - lastRelapseDate.getTime();
      const streakBefore = formatDurationString(diff);

      const record: RelapseRecord = {
        id: Date.now().toString(),
        addiction_id: a.id,
        user_id: a.user_id,
        timestamp: new Date().toISOString(),
        reason: relapseReason.trim(),
        streak_before_relapse: streakBefore,
        created_at: new Date().toISOString()
      };

      return {
        ...a,
        last_relapse_at: new Date().toISOString(),
        history: [record, ...(a.history || [])]
      };
    }));

    setRelapseModalOpen(false);
    setRelapseReason("");
    setActiveAddictionId(null);
    toast({
      title: "Fortress Breached",
      description: "Counter reset. Reflect on the reason and rebuild your discipline.",
      variant: "destructive"
    });
  };

  if (!isMounted) return null;

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] text-slate-900 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2 text-indigo-600">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">War Room // Fortress Status</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-slate-900">ADDICTION TRACKER</h1>
          </div>
          
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-lg">
                NEW BATTLE
                <Plus className="ml-2 w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 rounded-[2rem] p-8 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-800">NAME YOUR ADDICTION</DialogTitle>
              </DialogHeader>
              <div className="py-6">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Identify the enemy</label>
                <Input 
                  placeholder="e.g. Social Media, Sugar, Procrastination" 
                  value={newAddictionName}
                  onChange={e => setNewAddictionName(e.target.value)}
                  className="bg-slate-50 border-slate-200 h-12 rounded-xl focus-visible:ring-indigo-500 text-slate-900"
                  onKeyDown={e => e.key === 'Enter' && addAddiction()}
                />
              </div>
              <DialogFooter>
                <Button onClick={addAddiction} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl">
                  START TRACKING
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Calming Message / Call to Action */}
        <div className="mb-12 bg-white/50 backdrop-blur-sm border border-indigo-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-indigo-500/5 group-hover:rotate-12 transition-transform duration-1000">
            <ShieldCheck className="w-48 h-48" />
          </div>
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2 mb-4 text-indigo-500">
              <Heart className="w-5 h-5 fill-indigo-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest">A Message for the King</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4 leading-snug">
              This is your sanctuary. Be honest, be brave, and remember: <span className="text-indigo-600">every second is a victory.</span>
            </h2>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-6 font-medium">
              King, we know this is one of the hardest battles you will ever face. Be brutally honest with yourself—there is no judgment here, only growth. This tracker is your fortress, a safe and secure sanctuary where you can visualize your victory one second at a time. We are with you in every moment of the struggle. You are not alone.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/addiction/learn-more">
                <Button variant="outline" className="rounded-xl border-indigo-100 text-indigo-600 hover:bg-indigo-50 font-bold px-6 h-12 transition-all">
                  LEARN MORE ABOUT THE SCIENCE
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Secure & Private Archive</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Sword className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Battles</span>
              </div>
              <div className="text-3xl font-black text-slate-900">{kpis.totalBattles}</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Identified Enemies</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                  <Skull className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Relapses</span>
              </div>
              <div className="text-3xl font-black text-slate-900">{kpis.totalFailures}</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Fortress Breaches</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Trophy className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Longest Streak</span>
              </div>
              <div className="text-xl font-black text-slate-900 truncate">{kpis.longestStreak}</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Peak Discipline</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Flame className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Streaks</span>
              </div>
              <div className="text-3xl font-black text-slate-900">{kpis.activeStreaks}</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Wars Being Won</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart Section */}
        <Card className="mb-12 bg-white border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between px-0 pt-0 pb-8 space-y-0">
            <div>
              <div className="flex items-center gap-2 mb-1 text-indigo-600">
                <BarChart3 className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Analytics // Trend Line</span>
              </div>
              <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tight">Relapse Frequency</CardTitle>
            </div>
            <div className="w-48">
              <Select value={selectedBattleId} onValueChange={setSelectedBattleId}>
                <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-10 text-xs font-bold uppercase tracking-widest text-slate-600">
                  <SelectValue placeholder="Filter Battles" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 rounded-xl shadow-xl">
                  <SelectItem value="all" className="text-xs font-bold uppercase tracking-widest py-3">All Battles</SelectItem>
                  {addictions.map(a => (
                    <SelectItem key={a.id} value={a.id} className="text-xs font-bold uppercase tracking-widest py-3">
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ 
                    color: '#4f46e5', 
                    fontSize: '12px', 
                    fontWeight: 800,
                    textTransform: 'uppercase'
                  }}
                  labelStyle={{
                    color: '#94a3b8',
                    fontSize: '10px',
                    fontWeight: 700,
                    marginBottom: '4px',
                    textTransform: 'uppercase'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="relapses" 
                  stroke="#4f46e5" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Addictions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {addictions.map((addiction) => {
            const diff = currentTime.getTime() - new Date(addiction.last_relapse_at).getTime();
            const { days, hours, minutes, seconds } = formatDuration(diff);

            return (
              <div key={addiction.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all group relative shadow-sm">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Flame className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight text-slate-800 uppercase">
                        {addiction.name}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ongoing Streak</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                    onClick={() => deleteAddiction(addiction.id)}
                  >
                    <Trash2 size={20} />
                  </Button>
                </div>

                {/* Counter */}
                <div className="grid grid-cols-4 gap-4 mb-10">
                  {[
                    { label: "DAYS", value: days },
                    { label: "HOURS", value: hours },
                    { label: "MINS", value: minutes },
                    { label: "SECS", value: seconds },
                  ].map((unit, i) => (
                    <div key={i} className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                      <div className="text-3xl font-black text-indigo-600 tabular-nums">{unit.value}</div>
                      <div className="text-[8px] font-black text-slate-400 tracking-widest">{unit.label}</div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={() => {
                      setActiveAddictionId(addiction.id);
                      setRelapseModalOpen(true);
                    }}
                    className="flex-1 h-14 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100 font-black uppercase tracking-widest rounded-2xl transition-all"
                  >
                    I FELL
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="h-14 px-6 border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 font-black rounded-2xl">
                        <History size={20} />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white border-slate-200 rounded-[2rem] p-8 max-w-lg max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-800 uppercase">MISSION ARCHIVES: {addiction.name}</DialogTitle>
                      </DialogHeader>
                      <div className="py-6 space-y-4">
                        {!addiction.history || addiction.history.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 italic">No records found. Keep the streak going!</div>
                        ) : (
                          addiction.history.map((record) => (
                            <div key={record.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2 text-red-600">
                                  <AlertCircle size={14} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Fortress Breach</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                  {new Date(record.timestamp).toLocaleDateString()} {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-slate-700 mb-3">
                                "{record.reason}"
                              </p>
                              <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">
                                Streak Terminated: {record.streak_before_relapse}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            );
          })}

          {addictions.length === 0 && !isAdding && (
            <div className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-white/50">
              <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-6 border border-slate-100 text-slate-200">
                <ShieldCheck size={48} />
              </div>
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Fortress Secured</h3>
              <p className="text-slate-400 mt-2 font-medium">No addictions being tracked. Identify an enemy to begin.</p>
              <Button 
                onClick={() => setIsAdding(true)}
                className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-2xl h-14 px-10 shadow-lg"
              >
                IDENTIFY ENEMY
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Relapse Modal */}
      <Dialog open={relapseModalOpen} onOpenChange={setRelapseModalOpen}>
        <DialogContent className="bg-white border-slate-200 rounded-[2.5rem] p-10 max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-red-600 italic tracking-tighter">DEBRIEF MISSION</DialogTitle>
          </DialogHeader>
          <div className="py-8">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
              <p className="text-xs text-red-700 font-bold leading-relaxed">
                Relapse is not defeat, it's a data point. Identify the trigger to strengthen your discipline for the next cycle.
              </p>
            </div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Why did you fall back?</label>
            <textarea 
              placeholder="Record the reason (e.g. stress, environment, lack of sleep)..." 
              value={relapseReason}
              onChange={e => setRelapseReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 h-32 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-slate-900 font-medium"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="ghost" 
              onClick={() => {
                setRelapseModalOpen(false);
                setRelapseReason("");
                setActiveAddictionId(null);
              }}
              className="flex-1 h-12 rounded-xl text-slate-500 font-bold"
            >
              CANCEL
            </Button>
            <Button 
              onClick={handleRelapse}
              disabled={!relapseReason.trim()}
              className="flex-[2] h-12 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-100"
            >
              RESET COUNTER
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Edit2, Check, X, Calendar as CalendarIcon, Clock, Loader2, Layout, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

interface TodoItem {
  id: string;
  title: string;
  is_completed: boolean;
  updated_at: string;
}

const CONFETTI_COLORS = ["#10b981", "#6366f1", "#ef4444", "#06b6d4", "#8b5cf6"];

export function TodoCard() {
  const supabase = createClient();
  const [items, setItems] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateInfo, setDateInfo] = useState({ date: "", time: "" });
  const [newItemText, setNewItemText] = useState("");
  const [editingId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const lastCheckedDateRef = useRef<string>(new Date().toDateString());

  useEffect(() => {
    fetchTodos();
  }, []);

  /**
   * Fetches all daily routine items for the current user.
   * Implementation Date: 2026-06-07
   * Logic: Includes a daily reset check. If any completed item was updated before today,
   * all items are reset to incomplete for a fresh start to the new day.
   */
  const fetchTodos = async () => {
    setIsLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("daily_routines")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching todos:", error);
    } else {
      const todos = data || [];
      // Daily Reset Logic - 2026-06-07
      // We check if any item marked 'completed' was last updated before the start of today.
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      const needsReset = todos.some(item => 
        item.is_completed && new Date(item.updated_at).getTime() < startOfToday
      );

      if (needsReset) {
        // Log the progress for the day being reset before clearing it
        const resetDate = new Date(todos.find(item => item.is_completed)?.updated_at || now);
        await logDailyProgress(todos, resetDate);

        // King's discipline: Every day is a new battle. Reset all items.
        const { error: resetError } = await supabase
          .from("daily_routines")
          .update({ is_completed: false })
          .eq("user_id", user.id);
        
        if (!resetError) {
          setItems(todos.map(item => ({ ...item, is_completed: false })));
        } else {
          setItems(todos);
        }
      } else {
        setItems(todos);
      }
    }
    setIsLoading(false);
  };

  /**
   * Logs the current completion status to the daily_routine_logs table.
   * This allows us to track 'missed days' on the calendar.
   */
  const logDailyProgress = async (todos: TodoItem[], dateOverride?: Date) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || todos.length === 0) return;

    const targetDate = dateOverride || new Date();
    const dateString = targetDate.toISOString().split('T')[0];
    
    const completedCount = todos.filter(t => t.is_completed).length;
    const percentage = Math.round((completedCount / todos.length) * 100);
    const isFullyCompleted = percentage === 100;

    await supabase
      .from("daily_routine_logs")
      .upsert({
        user_id: user.id,
        date: dateString,
        is_fully_completed: isFullyCompleted,
        completion_percentage: percentage
      }, { onConflict: 'user_id,date' });
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Check if the day has changed since the last tick
      const currentDayString = now.toDateString();
      if (currentDayString !== lastCheckedDateRef.current) {
        lastCheckedDateRef.current = currentDayString;
        // The King never sleeps, but the mission resets at dawn.
        fetchTodos(); 
      }

      const date = now.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const time = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setDateInfo({ date, time });
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleItem = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("daily_routines")
      .update({ is_completed: !currentStatus })
      .eq("id", id);

    if (error) {
      console.error("Error toggling todo:", error);
    } else {
      const updatedItems = items.map((i) => (i.id === id ? { ...i, is_completed: !currentStatus } : i));
      setItems(updatedItems);
      logDailyProgress(updatedItems);
    }
  };

  /**
   * Adds a new tactical objective with a specific category.
   * Implementation Date: 2026-06-07
   */
  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase
      .from("daily_routines")
      .insert([
        {
          title: newItemText.trim(),
          is_completed: false,
          user_id: userData.user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error adding todo:", error);
    } else if (data) {
      setItems((prev) => [...prev, data]);
      setNewItemText("");
      // Reset to general or keep current? Let's keep current for easier batch entry.
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("daily_routines").delete().eq("id", id);

    if (error) {
      console.error("Error deleting todo:", error);
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const startEditing = (id: string, text: string) => {
    setEditingItemId(id);
    setEditingText(text);
  };

  const saveEdit = async () => {
    if (!editingText.trim() || !editingId) return;

    const { error } = await supabase
      .from("daily_routines")
      .update({ title: editingText.trim() })
      .eq("id", editingId);

    if (error) {
      console.error("Error saving edit:", error);
    } else {
      setItems((prev) =>
        prev.map((i) => (i.id === editingId ? { ...i, title: editingText.trim() } : i))
      );
      setEditingItemId(null);
      setEditingText("");
    }
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditingText("");
  };

  const allDone = useMemo(() => items.length > 0 && items.every((i) => i.is_completed), [items]);

  const [celebrating, setCelebrating] = useState(false);
  const wasAllDoneRef = useRef(false);

  useEffect(() => {
    if (allDone && !wasAllDoneRef.current) {
      setCelebrating(true);
      wasAllDoneRef.current = true;
      const t = setTimeout(() => setCelebrating(false), 4000);
      return () => clearTimeout(t);
    }
    if (!allDone) {
      wasAllDoneRef.current = false;
      setCelebrating(false);
    }
  }, [allDone]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-50/50 p-4 md:p-8">
      {/* Hero Header */}
      <div className={cn(
        "mb-8 rounded-3xl p-8 text-white transition-all duration-700 shadow-2xl overflow-hidden relative flex-shrink-0",
        allDone 
          ? "bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400" 
          : "bg-gradient-to-br from-indigo-600 via-blue-500 to-indigo-400"
      )}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <CalendarIcon className="w-4 h-4" />
              <span className="text-sm font-medium tracking-wider uppercase">{dateInfo.date}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
              {allDone ? "DAILY MISSION CONQUERED" : "TACTICAL OBJECTIVES"}
            </h1>
            <p className="text-lg opacity-90 font-medium">
              {allDone ? "You've dominated your routine today, King." : "Stay disciplined. Execute the mission."}
            </p>
          </div>
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center justify-center min-w-[140px] border border-white/10">
            <Clock className="w-6 h-6 mb-2 opacity-80" />
            <span className="text-3xl font-black tracking-widest">{dateInfo.time}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1 opacity-60">System Time</span>
          </div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-black/10 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        {/* Input Section */}
        <div className="lg:col-span-1">
          <Card className="p-6 border-none shadow-xl bg-white h-fit">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
              <Plus className="w-5 h-5 text-indigo-500" />
              Add Objective
            </h2>
            <form onSubmit={addItem} className="space-y-4">
              <Input
                placeholder="Enter new objective..."
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                className="bg-slate-50 border-slate-100 focus-visible:ring-indigo-500 h-12"
              />
              <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold tracking-wide uppercase transition-all shadow-lg shadow-indigo-200">
                Deploy Task
              </Button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-slate-50">
              <div className="flex justify-between text-sm font-bold uppercase tracking-tighter text-slate-400 mb-2">
                <span>Progress Status</span>
                <span>{items.length > 0 ? Math.round((items.filter(i => i.is_completed).length / items.length) * 100) : 0}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-1000",
                    allDone ? "bg-emerald-500" : "bg-indigo-500"
                  )}
                  style={{ width: `${items.length > 0 ? (items.filter(i => i.is_completed).length / items.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <Link href="/calendar" className="mt-6 block group">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group-hover:border-indigo-200 group-hover:bg-indigo-50/30 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-500 shadow-sm transition-colors">
                    <CalendarIcon size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                    Check out the days uve missed
                  </span>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          </Card>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2 min-h-0">
          <Card className="h-full border-none shadow-xl bg-white flex flex-col overflow-hidden">
            <CardHeader className="p-6 pb-2">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <Layout className="w-5 h-5 text-indigo-500" />
                Active Missions
              </h2>
            </CardHeader>
            
            <ScrollArea className="flex-1 p-6 pt-2">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p className="font-bold uppercase tracking-widest text-xs">Accessing Tactical Data...</p>
                </div>
              ) : (
                <div className="space-y-4 pr-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 duration-500",
                        item.is_completed 
                          ? "bg-emerald-50/50 border-emerald-100 opacity-75" 
                          : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md shadow-sm"
                      )}
                    >
                      <button
                        onClick={() => toggleItem(item.id, item.is_completed)}
                        className={cn(
                          "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
                          item.is_completed 
                            ? "bg-emerald-500 border-emerald-500 text-white" 
                            : "border-slate-200 group-hover:border-indigo-400"
                        )}
                      >
                        {item.is_completed && <Check className="w-4 h-4 stroke-[3px]" />}
                      </button>

                      {editingId === item.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            autoFocus
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                            className="h-9 bg-white"
                          />
                          <Button size="icon" variant="ghost" onClick={saveEdit} className="h-9 w-9 text-emerald-600">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={cancelEdit} className="h-9 w-9 text-red-500">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className={cn(
                          "flex-1 text-base transition-all duration-300",
                          item.is_completed ? "text-slate-500 line-through font-medium" : "text-slate-800 font-semibold"
                        )}>
                          {item.title}
                        </span>
                      )}

                      {!item.is_completed && editingId !== item.id && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => startEditing(item.id, item.title)}
                            className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => deleteItem(item.id)}
                            className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {item.is_completed && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => deleteItem(item.id)}
                          className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {items.length === 0 && (
                    <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                      <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                        <Plus className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active missions</p>
                      <p className="text-slate-400 text-sm mt-1">Deploy a new objective to begin.</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
            </Card>
          </div>
        </div>

      {celebrating && <ConfettiOverlay />}
    </div>
  );
}

function ConfettiOverlay() {
  const pieces = Array.from({ length: 50 });
  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map((_, i) => (
        <span
          key={i}
          className="absolute rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-10px",
            width: `${6 + Math.random() * 10}px`,
            height: `${3 + Math.random() * 5}px`,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animation: `confetti-fall ${2.5 + Math.random() * 1.5}s ease-in forwards`,
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

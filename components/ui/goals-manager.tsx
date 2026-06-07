"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Target, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Zap,
  Shield,
  MoreVertical,
  Image as ImageIcon,
  Video,
  Mic,
  FileText,
  Send,
  X,
  ChevronLeft,
  Calendar,
  History,
  MessageSquare
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "./badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "./dropdown-menu";
import { useToast } from "./use-toast";
import { createClient } from "@/utils/supabase/client";
import { ScrollArea } from "./scroll-area";

interface Milestone {
  id: string;
  text: string;
  completed: boolean;
}

interface GoalUpdate {
  id: string;
  content: string;
  created_at: string;
  attachments?: { type: 'image' | 'video' | 'voice' | 'doc'; url: string; name: string }[];
}

interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'Business' | 'Spiritual' | 'Health' | 'Personal';
  priority: 'High' | 'Medium' | 'Low';
  deadline: string;
  milestones: Milestone[];
  progress: number;
  status: 'In Progress' | 'Completed' | 'At Risk';
  created_at: string;
  updates?: GoalUpdate[];
}

export function GoalsManager() {
  const supabase = createClient();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const { toast } = useToast();

  // New Goal State
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: "",
    description: "",
    category: "Personal",
    priority: "Medium",
    milestones: [],
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [newMilestoneText, setNewMilestoneText] = useState("");

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editGoalData, setEditGoalData] = useState<Partial<Goal>>({});

  // Update State
  const [updateText, setUpdateText] = useState("");
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  /**
   * Fetches tactical goals from Supabase.
   * Logic: Syncs local state with the global objectives database.
   * Date: 2026-06-07
   */
  const fetchGoals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching goals:", error);
    } else {
      // Map Supabase fields to local Goal interface
      const mappedGoals = (data || []).map(g => ({
        ...g,
        category: g.category.charAt(0).toUpperCase() + g.category.slice(1),
        status: g.status === 'active' ? 'In Progress' : g.status.charAt(0).toUpperCase() + g.status.slice(1),
        deadline: g.target_date, // Map Supabase target_date to local deadline field
        milestones: g.milestones || [],
        updates: g.updates || []
      }));
      setGoals(mappedGoals);
    }
  };

  const addGoal = async () => {
    if (!newGoal.title) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const goalData = {
      user_id: user.id,
      title: newGoal.title,
      description: newGoal.description || "",
      category: newGoal.category?.toLowerCase() || "personal",
      priority: newGoal.priority || "Medium",
      target_date: newGoal.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      milestones: newGoal.milestones || [],
      progress: 0,
      status: 'active',
      updates: []
    };

    const { error } = await supabase
      .from("goals")
      .insert([goalData])
      .select()
      .single();

    if (error) {
      console.error("Error adding goal:", error.message, error.details, error.hint);
      toast({ title: "Deployment Failed", description: error.message || "Objective could not be locked in.", variant: "destructive" });
    } else {
      fetchGoals();
      setIsAdding(false);
      setNewGoal({ 
        title: "", 
        description: "", 
        category: "Personal", 
        priority: "Medium", 
        milestones: [],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      toast({ title: "Objective Locked In", description: "A new tactical goal has been established." });
    }
  };

  const deleteGoal = async (id: string) => {
    if (window.confirm("Abort this objective? All progress data will be lost.")) {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) {
        console.error("Error deleting goal:", error);
      } else {
        setGoals(prev => prev.filter(g => g.id !== id));
        toast({ title: "Objective Aborted", variant: "destructive" });
      }
    }
  };

  const toggleMilestone = async (goalId: string, milestoneId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newMilestones = goal.milestones.map(m => 
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    const completedCount = newMilestones.filter(m => m.completed).length;
    const progress = Math.round((completedCount / (newMilestones.length || 1)) * 100);
    const status = progress === 100 ? 'completed' : 'active';

    const { error } = await supabase
      .from("goals")
      .update({ milestones: newMilestones, progress, status })
      .eq("id", goalId);

    if (error) {
      console.error("Error updating milestone:", error);
    } else {
      fetchGoals();
    }
  };

  /**
   * Updates goal progress manually via the tactical slider.
   * Implementation Date: 2026-06-07
   */
  const updateProgressManually = async (goalId: string, value: number) => {
    const status = value === 100 ? 'completed' : 'active';
    
    // Optimistic update for smooth UI
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, progress: value, status: status as any } : g));

    const { error } = await supabase
      .from("goals")
      .update({ progress: value, status: status })
      .eq("id", goalId);

    if (error) {
      console.error("Error updating progress:", error);
      toast({ title: "Sync Failed", description: "Progress could not be saved.", variant: "destructive" });
      fetchGoals(); // Revert on error
    }
  };

  const addProgressUpdate = async (goalId: string) => {
    if (!updateText.trim()) return;
    setIsSubmittingUpdate(true);

    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newUpdate: GoalUpdate = {
      id: Date.now().toString(),
      content: updateText,
      created_at: new Date().toISOString(),
      attachments: [] // Media attachment logic would go here
    };

    const { error } = await supabase
      .from("goals")
      .update({ updates: [newUpdate, ...(goal.updates || [])] })
      .eq("id", goalId);

    if (error) {
      console.error("Error adding update:", error);
      toast({ title: "Intel Update Failed", variant: "destructive" });
    } else {
      setUpdateText("");
      fetchGoals();
      toast({ title: "Progress Recorded", description: "New tactical data has been archived." });
    }
    setIsSubmittingUpdate(false);
  };

  /**
   * Updates goal tactical data in Supabase.
   * Implementation Date: 2026-06-07
   */
  const saveGoalEdit = async () => {
    if (!selectedGoalId || !editGoalData.title) return;

    const milestones = editGoalData.milestones || [];
    // Manual progress is the source of truth as per the King's estimation.
    const progress = editGoalData.progress ?? 0;
    const status = progress === 100 ? 'completed' : 'active';

    const { error } = await supabase
      .from("goals")
      .update({
        title: editGoalData.title,
        description: editGoalData.description,
        category: editGoalData.category?.toLowerCase(),
        priority: editGoalData.priority,
        target_date: editGoalData.deadline,
        milestones: milestones,
        progress: progress,
        status: status
      })
      .eq("id", selectedGoalId);

    if (error) {
      console.error("Error updating goal:", error);
      toast({ title: "Sync Failed", description: "Tactical data could not be updated.", variant: "destructive" });
    } else {
      setIsEditing(false);
      fetchGoals();
      toast({ title: "Tactical Update Complete", description: "Strategic objectives have been recalibrated." });
    }
  };

  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  /**
   * Calculates overall strategic progress across all deployed objectives.
   * Logic: Average of all goal progress percentages.
   * Implementation Date: 2026-06-07
   */
  const overallStats = useMemo(() => {
    if (goals.length === 0) return { average: 0, completed: 0, total: 0 };
    const total = goals.length;
    const completed = goals.filter(g => g.progress === 100).length;
    const average = Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / total);
    return { average, completed, total };
  }, [goals]);

  const addMilestoneToNewGoal = () => {
    if (!newMilestoneText.trim()) return;
    setNewGoal(prev => ({
      ...prev,
      milestones: [...(prev.milestones || []), { id: Date.now().toString(), text: newMilestoneText, completed: false }]
    }));
    setNewMilestoneText("");
  };

  /**
   * Logic: The goal detail is now rendered as a fixed full-page experience.
   * This ensures that internal scrollbars are triggered correctly within the "inner cards".
   * Implementation Date: 2026-06-07
   */
  if (selectedGoal) {
    return (
      <div className="fixed inset-0 bg-white text-slate-900 flex flex-col z-[100] animate-in fade-in duration-500">
        {/* Detail Header - Fixed at top */}
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => {
              setSelectedGoalId(null);
              setIsEditing(false);
            }} className="rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              {isEditing ? (
                <Input 
                  value={editGoalData.title || ""}
                  onChange={(e) => setEditGoalData({ ...editGoalData, title: e.target.value })}
                  className="text-2xl font-black tracking-tight text-slate-800 uppercase leading-none h-auto p-0 border-none bg-transparent focus-visible:ring-0 w-[400px]"
                  placeholder="Objective Title"
                />
              ) : (
                <h2 className="text-2xl font-black tracking-tight text-slate-800 uppercase leading-none">{selectedGoal.title}</h2>
              )}
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tactical Analysis // Objective Details</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex bg-slate-100 p-1 rounded-xl">
                  {(['Business', 'Spiritual', 'Health', 'Personal'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setEditGoalData({ ...editGoalData, category: cat })}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        editGoalData.category === cat 
                          ? "bg-white text-indigo-600 shadow-sm" 
                          : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="hidden lg:block h-8 w-px bg-slate-200" />
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={saveGoalEdit}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-xl px-4 md:px-6 h-10 shadow-lg"
                  >
                    SAVE
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 font-black uppercase tracking-widest rounded-xl px-4 md:px-6 h-10"
                  >
                    CANCEL
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {selectedGoal.category}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setEditGoalData({
                      title: selectedGoal.title,
                      description: selectedGoal.description,
                      category: selectedGoal.category,
                      priority: selectedGoal.priority,
                      deadline: selectedGoal.deadline,
                      milestones: selectedGoal.milestones,
                      progress: selectedGoal.progress,
                      status: selectedGoal.status
                    });
                    setIsEditing(true);
                  }}
                  className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl h-10 w-10"
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  deleteGoal(selectedGoal.id);
                  setSelectedGoalId(null);
                }} className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl h-10 w-10">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* Left Column: Sidebar info - Independent Scroll Area */}
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-50 bg-slate-50/10 shrink-0 overflow-y-auto lg:h-full">
            <div className="p-6 md:p-8">
              <section className="mb-8">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tactical Overview</h3>
                {isEditing ? (
                  <textarea 
                    value={editGoalData.description || ""}
                    onChange={(e) => setEditGoalData({ ...editGoalData, description: e.target.value })}
                    className="text-sm text-slate-600 leading-relaxed font-medium w-full min-h-[100px] p-3 bg-white border border-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    placeholder="Objective description..."
                  />
                ) : (
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {selectedGoal.description || "No mission description provided."}
                  </p>
                )}
              </section>

              <section className="mb-8">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Execution Progress</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Current Mastery</p>
                    <span className="text-sm font-black text-indigo-600">{selectedGoal.progress}%</span>
                  </div>
                  <div className="px-1">
                    <Slider
                      value={[selectedGoal.progress]}
                      onValueChange={(vals: number[]) => updateProgressManually(selectedGoal.id, vals[0])}
                      max={100}
                      step={1}
                      className="cursor-pointer"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium leading-relaxed italic">
                    King, on a scale of this bar, how far have you completed this goal? Estimate your territory conquered.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <div className="space-y-3">
                  {(isEditing ? editGoalData.milestones : selectedGoal.milestones)?.map(m => (
                    <div 
                      key={m.id} 
                      onClick={() => {
                        if (isEditing) {
                          const newMs = editGoalData.milestones?.map(item => 
                            item.id === m.id ? { ...item, completed: !item.completed } : item
                          );
                          setEditGoalData({ ...editGoalData, milestones: newMs });
                        } else {
                          toggleMilestone(selectedGoal.id, m.id);
                        }
                      }}
                      className="flex items-center gap-3 cursor-pointer group/ms"
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0",
                        m.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200 bg-white group-hover/ms:border-indigo-400"
                      )}>
                        {m.completed && <CheckCircle2 size={12} />}
                      </div>
                      <span className={cn(
                        "text-xs flex-1 font-medium transition-all",
                        m.completed ? "text-slate-400 line-through" : "text-slate-700"
                      )}>
                        {m.text}
                      </span>
                      {isEditing && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const newMs = editGoalData.milestones?.filter(item => item.id !== m.id);
                            setEditGoalData({ ...editGoalData, milestones: newMs });
                          }}
                          className="opacity-0 group-hover/ms:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                {isEditing && (
                  <div className="mt-4 flex gap-2">
                    <Input 
                      value={newMilestoneText}
                      onChange={(e) => setNewMilestoneText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newMilestoneText.trim()) {
                          const newM = { id: Date.now().toString(), text: newMilestoneText.trim(), completed: false };
                          setEditGoalData({ 
                            ...editGoalData, 
                            milestones: [...(editGoalData.milestones || []), newM] 
                          });
                          setNewMilestoneText("");
                        }
                      }}
                      placeholder="Add milestone..."
                      className="h-9 text-xs rounded-xl"
                    />
                    <Button 
                      size="icon" 
                      className="h-9 w-9 shrink-0 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none"
                      onClick={() => {
                        if (newMilestoneText.trim()) {
                          const newM = { id: Date.now().toString(), text: newMilestoneText.trim(), completed: false };
                          setEditGoalData({ 
                            ...editGoalData, 
                            milestones: [...(editGoalData.milestones || []), newM] 
                          });
                          setNewMilestoneText("");
                        }
                      }}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Logistics</h3>
                <div className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-bold uppercase text-slate-400 mb-2">Priority Level</p>
                        <div className="grid grid-cols-3 gap-2">
                          {(['High', 'Medium', 'Low'] as const).map((p) => (
                            <button
                              key={p}
                              onClick={() => setEditGoalData({ ...editGoalData, priority: p })}
                              className={cn(
                                "px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                                editGoalData.priority === p 
                                  ? "bg-slate-900 text-white border-slate-900" 
                                  : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                              )}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase text-slate-400 mb-2">Target Date</p>
                        <Input 
                          type="date"
                          value={editGoalData.deadline || ""}
                          onChange={(e) => setEditGoalData({ ...editGoalData, deadline: e.target.value })}
                          className="h-9 text-xs rounded-xl"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 text-slate-500">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase text-slate-400">Target Date</p>
                          <p className="text-xs font-black text-slate-700">{selectedGoal.deadline}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                          <History className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase text-slate-400">Status</p>
                          <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{selectedGoal.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase text-slate-400">Priority</p>
                          <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{selectedGoal.priority}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </section>
            </div>
          </ScrollArea>

          {/* Right Column: Progress Feed & Update Input - Independent Scroll Area */}
          <div className="flex-1 flex flex-col bg-white min-h-0 lg:h-full">
            {/* Updates Feed - Scrollable Inner Card */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 md:p-8">
                <div className="max-w-2xl mx-auto space-y-8">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-4">
                    <MessageSquare className="w-4 h-4" />
                    Progress Log // Timeline
                    <div className="h-px flex-1 bg-slate-50" />
                  </h3>

                  <div className="space-y-10">
                    {selectedGoal.updates && selectedGoal.updates.length > 0 ? (
                      selectedGoal.updates.map((update, i) => (
                        <div key={update.id} className="relative pl-8 group">
                          {/* Vertical line connector */}
                          {i !== selectedGoal.updates!.length - 1 && (
                            <div className="absolute left-0 top-8 bottom-[-40px] w-px bg-slate-100" />
                          )}
                          <div className="absolute left-[-4px] top-1 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                          
                          <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                              {new Date(update.created_at).toLocaleString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 group-hover:border-indigo-100 transition-colors">
                              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                {update.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 opacity-40">
                        <History className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">No tactical data recorded</p>
                        <p className="text-xs mt-1 font-medium">Archived logs will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Rich Update Input - Fixed at bottom of the feed area */}
            <div className="p-8 bg-slate-50/30 border-t border-slate-50 shrink-0">
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden focus-within:border-indigo-400 transition-all">
                  <textarea 
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                    placeholder="Log your progress, King. What territory did you conquer today?"
                    className="w-full p-6 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none resize-none min-h-[120px]"
                  />
                  
                  <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white shadow-sm transition-all">
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white shadow-sm transition-all">
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white shadow-sm transition-all">
                        <Mic className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white shadow-sm transition-all">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Button 
                      onClick={() => addProgressUpdate(selectedGoal.id)}
                      disabled={!updateText.trim() || isSubmittingUpdate}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-2xl h-11 px-6 shadow-lg shadow-indigo-100 flex items-center gap-2"
                    >
                      {isSubmittingUpdate ? "SYNCING..." : "ARCHIVE UPDATE"}
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4">
                  Attachment support: Images, Video, Voice Notes, & Tactical Docs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Logic: Removed KPI stats grid to focus strictly on mission deployment and monitoring.
   * Strategic overview is now handled via the executive dashboard.
   * Date: 2026-06-07
   */
  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] text-slate-900 p-4 md:p-8 overflow-y-auto">
      {/* HUD Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2 text-indigo-600">
              <Shield className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Command Center // Strategic Objectives</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter italic text-slate-900">OBJECTIVE CONTROL</h1>
          </div>
          <div className="flex gap-4">
             <Button 
              onClick={() => setIsAdding(!isAdding)}
              className={cn(
                "h-14 px-8 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg",
                isAdding ? "bg-red-600 hover:bg-red-700 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
              )}
            >
              {isAdding ? "CANCEL MISSION" : "NEW OBJECTIVE"}
              <Plus className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Strategic Progress Banner */}
        <div className="bg-indigo-600 rounded-[2.5rem] p-8 mb-12 relative overflow-hidden group shadow-2xl shadow-indigo-200/50 border border-indigo-500">
          {/* Animated Background Element */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/10 to-transparent opacity-50 pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1 w-full">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-white text-2xl font-black italic tracking-tighter uppercase mb-1">Fleet Command // Global Progress</h2>
                  <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-[0.3em]">Aggregate Strategic Mastery</p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-white tracking-tighter italic">{overallStats.average}%</span>
                </div>
              </div>
              <div className="h-4 bg-indigo-700/50 rounded-full overflow-hidden border border-indigo-500/50 p-1">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                  style={{ width: `${overallStats.average}%` }}
                />
              </div>
            </div>

            <div className="flex gap-6 shrink-0 border-l border-indigo-500/50 pl-8 hidden md:flex">
              <div>
                <p className="text-indigo-200 text-[9px] font-black uppercase tracking-widest mb-1">Total Missions</p>
                <p className="text-white text-2xl font-black tracking-tighter">{overallStats.total}</p>
              </div>
              <div>
                <p className="text-indigo-200 text-[9px] font-black uppercase tracking-widest mb-1">Conquered</p>
                <p className="text-emerald-300 text-2xl font-black tracking-tighter">{overallStats.completed}</p>
              </div>
              <div>
                <p className="text-indigo-200 text-[9px] font-black uppercase tracking-widest mb-1">Active</p>
                <p className="text-white text-2xl font-black tracking-tighter">{overallStats.total - overallStats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {isAdding && (
          <div className="bg-white border border-slate-200 shadow-xl rounded-[2.5rem] p-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-500 overflow-x-auto">
            <div className="min-w-[320px]">
              <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-slate-800">
                <Zap className="w-5 h-5 text-indigo-600" />
                DEFINE PARAMETERS
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Objective Title</label>
                    <Input 
                      placeholder="Enter mission name..." 
                      value={newGoal.title}
                      onChange={e => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                      className="bg-slate-50 border-slate-200 h-12 rounded-xl focus-visible:ring-indigo-500 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Tactical Overview</label>
                    <textarea 
                      placeholder="Describe the desired outcome..." 
                      value={newGoal.description}
                      onChange={e => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 h-32 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Classification</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl h-12 px-4 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none text-slate-900 font-bold"
                        value={newGoal.category}
                        onChange={e => setNewGoal(prev => ({ ...prev, category: e.target.value as any }))}
                      >
                        <option value="Personal">Personal</option>
                        <option value="Business">Business</option>
                        <option value="Spiritual">Spiritual</option>
                        <option value="Health">Health</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Priority Level</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl h-12 px-4 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none text-slate-900 font-bold"
                        value={newGoal.priority}
                        onChange={e => setNewGoal(prev => ({ ...prev, priority: e.target.value as any }))}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Target Date (Deadline)</label>
                    <Input 
                      type="date"
                      value={newGoal.deadline}
                      onChange={e => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                      className="bg-slate-50 border-slate-200 h-12 rounded-xl focus-visible:ring-indigo-500 text-slate-900"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col h-full">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Milestone Benchmarks</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl flex-1 p-4 overflow-y-auto mb-4 min-h-[200px]">
                    {newGoal.milestones?.map((m, i) => (
                      <div key={m.id} className="flex items-center gap-3 mb-2 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                        <div className="w-5 h-5 rounded-full border border-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-600 bg-indigo-50">
                          {i + 1}
                        </div>
                        <span className="text-sm flex-1 text-slate-700 font-medium">{m.text}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50"
                          onClick={() => setNewGoal(prev => ({ ...prev, milestones: prev.milestones?.filter(ms => ms.id !== m.id) }))}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <Input 
                        placeholder="Add milestone..." 
                        value={newMilestoneText}
                        onChange={e => setNewMilestoneText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addMilestoneToNewGoal()}
                        className="bg-white border-slate-200 h-10 rounded-lg text-slate-900"
                      />
                      <Button onClick={addMilestoneToNewGoal} className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg h-10 w-10 p-0">
                        <Plus size={18} />
                      </Button>
                    </div>
                  </div>
                  <Button onClick={addGoal} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-100">
                    AUTHORIZE MISSION
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <div 
              key={goal.id} 
              onClick={() => setSelectedGoalId(goal.id)}
              className="bg-white border border-slate-200 rounded-[2.5rem] p-6 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100/50 transition-all group relative shadow-sm cursor-pointer"
            >
              <div className="flex justify-between items-start mb-6">
                <Badge className={cn(
                  "bg-white border px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase",
                  goal.category === 'Business' ? "border-blue-200 text-blue-600 bg-blue-50" :
                  goal.category === 'Spiritual' ? "border-purple-200 text-purple-600 bg-purple-50" :
                  goal.category === 'Health' ? "border-emerald-200 text-emerald-600 bg-emerald-50" :
                  "border-indigo-200 text-indigo-600 bg-indigo-50"
                )}>
                  {goal.category}
                </Badge>
                <div className="flex items-center gap-2">
                   {goal.priority === 'High' && (
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                   )}
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-xl">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border-slate-100 text-slate-900 shadow-xl rounded-xl">
                      <DropdownMenuItem onClick={() => deleteGoal(goal.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Mission
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <h3 className="text-xl font-black tracking-tight mb-2 uppercase text-slate-800 group-hover:text-indigo-600 transition-colors">
                {goal.title}
              </h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-6 min-h-[40px] leading-relaxed">
                {goal.description}
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span>Execution Progress</span>
                  <span className="text-indigo-600">{goal.progress}%</span>
                </div>
                <div className="px-1" onClick={(e) => e.stopPropagation()}>
                  <Slider
                    value={[goal.progress]}
                    onValueChange={(vals: number[]) => updateProgressManually(goal.id, vals[0])}
                    max={100}
                    step={1}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2 mb-8">
                {goal.milestones.slice(0, 3).map(m => (
                  <div 
                    key={m.id} 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMilestone(goal.id, m.id);
                    }}
                    className="flex items-center gap-3 cursor-pointer group/item"
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-lg border flex items-center justify-center transition-all",
                      m.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200 bg-white group-hover/item:border-indigo-400"
                    )}>
                      {m.completed && <CheckCircle2 size={12} />}
                    </div>
                    <span className={cn(
                      "text-xs font-medium transition-all",
                      m.completed ? "text-slate-400 line-through" : "text-slate-700"
                    )}>
                      {m.text}
                    </span>
                  </div>
                ))}
                {goal.milestones.length > 3 && (
                  <p className="text-[10px] text-slate-400 font-black uppercase pl-8 mt-2">
                    + {goal.milestones.length - 3} more benchmarks
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Due: {goal.deadline}</span>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm",
                  goal.status === 'Completed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                )}>
                  {goal.status}
                </div>
              </div>
            </div>
          ))}

          {goals.length === 0 && !isAdding && (
            <div className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-white/50">
              <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-6 border border-slate-100">
                <Target size={48} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">No Objectives Active</h3>
              <p className="text-slate-400 mt-2 font-medium">Deploy your first goal to start tracking progress.</p>
              <Button 
                onClick={() => setIsAdding(true)}
                className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-2xl h-14 px-10 shadow-lg shadow-indigo-100"
              >
                DEPLOY MISSION
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Goal Detail View Overlay - REMOVED MODAL Logic */}
      <style jsx global>{`
        html, body {
          overflow-x: hidden;
        }
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 5px;
          border: 2px solid #f1f5f9;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}

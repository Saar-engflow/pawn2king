"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Sidebar } from "../../components/ui/modern-side-bar";
import { JournalEditor } from "../../components/ui/journal-editor";
import { 
  Search, 
  Plus, 
  Book, 
  Calendar, 
  Clock, 
  Trash2, 
  MoreVertical,
  ChevronRight,
  History,
  ShieldCheck
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "../../components/ui/dropdown-menu";
import { useToast } from "../../components/ui/use-toast";
import { Toaster } from "../../components/ui/toaster";
import { createClient } from "@/utils/supabase/client";

interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function JournalPage() {
  const supabase = createClient();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load journals from Supabase
  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("journals")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching journals:", error);
    } else {
      setJournals(data || []);
    }
    setIsLoading(false);
  };

  const filteredJournals = useMemo(() => {
    return journals
      .filter(j => 
        j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        j.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [journals, searchQuery]);

  const activeJournal = useMemo(() => {
    return journals.find(j => j.id === selectedId) || null;
  }, [journals, selectedId]);

  const createNewJournal = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newJournal = {
      user_id: user.id,
      title: "Untitled Mission Report",
      content: "",
    };

    const { data, error } = await supabase
      .from("journals")
      .insert([newJournal])
      .select()
      .single();

    if (error) {
      console.error("Error creating journal:", error);
      toast({ title: "Deployment Failed", variant: "destructive" });
    } else if (data) {
      setJournals(prev => [data, ...prev]);
      setSelectedId(data.id);
    }
  };

  const updateJournal = async (id: string, updates: Partial<JournalEntry>) => {
    // Optimistic update
    setJournals(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));

    const { error } = await supabase
      .from("journals")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating journal:", error);
      // Revert on error could be added here
    }
  };

  const deleteJournal = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this mission report?")) {
      const { error } = await supabase.from("journals").delete().eq("id", id);
      
      if (error) {
        console.error("Error deleting journal:", error);
      } else {
        setJournals(prev => prev.filter(j => j.id !== id));
        if (selectedId === id) setSelectedId(null);
        toast({
          title: "Report Deleted",
          description: "The journal entry has been permanently removed.",
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 flex overflow-hidden">
        {/* Internal Sidebar - Journal List */}
        <div className="w-80 md:w-96 border-r border-slate-200 flex flex-col bg-white shrink-0">
          <div className="p-6 pb-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">JOURNAL</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Tactical Reflections</p>
              </div>
              <Button 
                onClick={createNewJournal}
                size="icon" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search archives..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 border-none rounded-xl focus-visible:ring-indigo-500 h-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar">
            {filteredJournals.map((journal) => (
              <div
                key={journal.id}
                onClick={() => setSelectedId(journal.id)}
                className={cn(
                  "group relative p-4 mb-2 rounded-2xl cursor-pointer transition-all duration-300",
                  selectedId === journal.id 
                    ? "bg-indigo-50 border-l-4 border-indigo-600 shadow-sm" 
                    : "hover:bg-slate-50 border-l-4 border-transparent"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={cn(
                    "text-sm font-bold truncate pr-6",
                    selectedId === journal.id ? "text-indigo-900" : "text-slate-800"
                  )}>
                    {journal.title}
                  </h3>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-slate-100">
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg"
                          onClick={() => deleteJournal(journal.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div 
                  className="text-xs text-slate-500 line-clamp-2 mb-3"
                  dangerouslySetInnerHTML={{ __html: journal.content.replace(/<[^>]*>?/gm, '') }}
                />
                
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(journal.updated_at)}
                  </div>
                  {selectedId === journal.id && (
                    <div className="flex items-center gap-1 text-indigo-500">
                      <ChevronRight className="w-3 h-3" />
                      Active
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {filteredJournals.length === 0 && (
              <div className="text-center py-20 px-6">
                <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Book className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No records found</p>
                <p className="text-slate-400 text-xs mt-1">Start a new mission report to begin.</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-slate-50 bg-slate-50/30">
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-900 leading-tight">SYSTEM STATUS</p>
                <p className="text-[9px] text-slate-400 font-medium">Archives Secured</p>
              </div>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className={cn(
          "flex-1 flex flex-col bg-slate-50/50 p-4 md:p-8 overflow-y-auto transition-all duration-500",
          selectedId && "fixed inset-0 z-[60] bg-white p-0 md:p-0"
        )}>
          {activeJournal ? (
            <JournalEditor
              key={activeJournal.id}
              title={activeJournal.title}
              onTitleChange={(title) => updateJournal(activeJournal.id, { title })}
              content={activeJournal.content}
              onChange={(content) => updateJournal(activeJournal.id, { content })}
              onBack={() => setSelectedId(null)}
              onSave={() => {
                toast({
                  title: "Mission Report Saved",
                  description: "Your progress has been archived.",
                });
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full scale-150" />
                <div className="relative bg-white w-24 h-24 rounded-3xl shadow-2xl flex items-center justify-center border border-slate-100">
                  <History className="w-10 h-10 text-indigo-500" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">ACCESS ARCHIVES</h2>
              <p className="text-slate-500 max-w-xs mx-auto text-sm">
                Select a mission report from the archives or deploy a new journal to begin your reflection.
              </p>
              <Button 
                onClick={createNewJournal}
                className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-8 shadow-lg shadow-indigo-100"
              >
                Deploy New Report
              </Button>
            </div>
          )}
        </div>
      </main>
      <Toaster />
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

"use client";

import { Sidebar } from "@/components/ui/modern-side-bar";
import { EventManager, Event } from "@/components/ui/event-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Target, Activity } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

export default function CalendarPage() {
  const supabase = createClient();
  const [missedDays, setMissedDays] = useState<string[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", user.id);

    if (!error && data) {
      const formattedEvents: Event[] = data.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        startTime: new Date(e.start_time),
        endTime: new Date(e.end_time),
        color: e.color,
        category: e.category,
        tags: e.tags || [],
      }));
      setEvents(formattedEvents);
    }
  }, [supabase]);

  useEffect(() => {
    const fetchMissedDays = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("id", user.id)
        .single();

      if (!profile) return;

      const { data: logs } = await supabase
        .from("daily_routine_logs")
        .select("date, is_fully_completed")
        .eq("user_id", user.id);

      const fullyCompletedDates = new Set(logs?.filter(l => l.is_fully_completed).map(l => l.date) || []);

      const startDate = new Date(profile.created_at);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const missed: string[] = [];
      const current = new Date(startDate);
      current.setHours(0, 0, 0, 0);

      while (current <= yesterday) {
        const dateStr = current.toISOString().split('T')[0];
        if (!fullyCompletedDates.has(dateStr)) {
          missed.push(dateStr);
        }
        current.setDate(current.getDate() + 1);
      }

      setMissedDays(missed);
    };

    fetchMissedDays();
    fetchEvents();
  }, [fetchEvents]);

  const handleEventCreate = async (event: Omit<Event, "id">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("calendar_events")
      .insert({
        user_id: user.id,
        title: event.title,
        description: event.description,
        start_time: event.startTime.toISOString(),
        end_time: event.endTime.toISOString(),
        color: event.color,
        category: event.category,
        tags: event.tags,
      })
      .select()
      .single();

    if (!error && data) {
      fetchEvents();
    }
  };

  const handleEventUpdate = async (id: string, event: Partial<Event>) => {
    const updateData: any = {};
    if (event.title) updateData.title = event.title;
    if (event.description !== undefined) updateData.description = event.description;
    if (event.startTime) updateData.start_time = event.startTime.toISOString();
    if (event.endTime) updateData.end_time = event.endTime.toISOString();
    if (event.color) updateData.color = event.color;
    if (event.category) updateData.category = event.category;
    if (event.tags) updateData.tags = event.tags;

    const { error } = await supabase
      .from("calendar_events")
      .update(updateData)
      .eq("id", id);

    if (!error) {
      fetchEvents();
    }
  };

  const handleEventDelete = async (id: string) => {
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", id);

    if (!error) {
      fetchEvents();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8">
          <Tabs defaultValue="calendar" className="w-full">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-slate-900 uppercase">MISSION CALENDAR</h1>
                <p className="text-slate-500 font-medium text-sm">Strategic overview of your progress and objectives.</p>
              </div>
              <TabsList className="bg-slate-100 p-1 rounded-2xl h-auto xl:h-14 flex flex-wrap xl:flex-nowrap gap-1">
                <TabsTrigger value="calendar" className="flex-1 xl:flex-none rounded-xl px-4 md:px-6 py-2 xl:py-0 font-bold uppercase tracking-widest text-[9px] md:text-[10px] data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm h-full">
                  <CalendarIcon className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                  Full Calendar
                </TabsTrigger>
                <TabsTrigger value="routine" className="flex-1 xl:flex-none rounded-xl px-4 md:px-6 py-2 xl:py-0 font-bold uppercase tracking-widest text-[9px] md:text-[10px] data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm h-full">
                  <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                  Daily Routine
                </TabsTrigger>
                <TabsTrigger value="goals" className="flex-1 xl:flex-none rounded-xl px-4 md:px-6 py-2 xl:py-0 font-bold uppercase tracking-widest text-[9px] md:text-[10px] data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm h-full">
                  <Target className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                  Goals
                </TabsTrigger>
                <TabsTrigger value="addiction" className="flex-1 xl:flex-none rounded-xl px-4 md:px-6 py-2 xl:py-0 font-bold uppercase tracking-widest text-[9px] md:text-[10px] data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm h-full">
                  <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                  Addiction Tracker
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="calendar" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <EventManager 
                events={events}
                onEventCreate={handleEventCreate}
                onEventUpdate={handleEventUpdate}
                onEventDelete={handleEventDelete}
                missedDays={missedDays} 
              />
            </TabsContent>
            
            <TabsContent value="routine" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <EventManager 
                events={events}
                onEventCreate={handleEventCreate}
                onEventUpdate={handleEventUpdate}
                onEventDelete={handleEventDelete}
                missedDays={missedDays} 
                categories={["Morning", "Deep Work", "Evening", "General"]} 
                availableTags={["Routine", "Daily"]} 
              />
            </TabsContent>

            <TabsContent value="goals" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <EventManager 
                events={events}
                onEventCreate={handleEventCreate}
                onEventUpdate={handleEventUpdate}
                onEventDelete={handleEventDelete}
                missedDays={missedDays} 
                categories={["Business", "Spiritual", "Physical", "Mental"]} 
                availableTags={["Mission", "Objective"]} 
              />
            </TabsContent>

            <TabsContent value="addiction" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <EventManager 
                events={events}
                onEventCreate={handleEventCreate}
                onEventUpdate={handleEventUpdate}
                onEventDelete={handleEventDelete}
                missedDays={missedDays} 
                categories={["Sober Day", "Milestone", "Relapse"]} 
                availableTags={["Victory", "Fortress"]} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

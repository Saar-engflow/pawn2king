"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/ui/modern-side-bar";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, Trophy, Flame, Target, Save, Loader2, Camera, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  rank: string;
  xp: number;
  level: number;
  streak_days: number;
  bio: string | null;
}

export default function ProfilePage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    bio: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) {
          setProfile(data);
          setFormData({
            full_name: data.full_name || "",
            username: data.username || "",
            bio: data.bio || "",
          });
        }
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [supabase]);

  const handleSave = async () => {
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          username: formData.username,
          bio: formData.bio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        toast({
          title: "Update Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profile Updated",
          description: "Your tactical data has been synchronized.",
        });
        setProfile(prev => prev ? { ...prev, ...formData } : null);
      }
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-50/50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase">
              USER PROFILE
            </h1>
            <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-widest text-[10px]">
              <User size={14} />
              <span>Tactical Identity // System Authorization</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Avatar & Rank */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-none shadow-xl bg-white overflow-hidden rounded-[2.5rem]">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="relative group mb-6">
                    <div className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center overflow-hidden shadow-2xl border-4 border-white">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-black text-4xl">
                          {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-slate-400 hover:text-indigo-600 transition-colors">
                      <Camera size={18} />
                    </button>
                  </div>
                  
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                    {profile?.full_name || "New King"}
                  </h2>
                  <p className="text-sm font-bold text-slate-400 mb-6">@{profile?.username || "warrior"}</p>
                  
                  <div className="w-full pt-6 border-t border-slate-50 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank</span>
                      <span className="text-xs font-black text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-full">
                        {profile?.rank || "Pawn"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Level</span>
                      <span className="text-xs font-black text-slate-700">{profile?.level || 1}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full transition-all duration-1000" 
                        style={{ width: `${(profile?.xp || 0) % 100}%` }}
                      />
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase text-right">
                      XP: {profile?.xp || 0} / 100 to next level
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-none shadow-md bg-white p-4 rounded-3xl">
                  <div className="flex items-center gap-2 mb-2 text-orange-500">
                    <Flame size={14} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Streak</span>
                  </div>
                  <div className="text-xl font-black text-slate-900">{profile?.streak_days || 0}D</div>
                </Card>
                <Card className="border-none shadow-md bg-white p-4 rounded-3xl">
                  <div className="flex items-center gap-2 mb-2 text-amber-500">
                    <Trophy size={14} />
                    <span className="text-[8px] font-black uppercase tracking-widest">XP</span>
                  </div>
                  <div className="text-xl font-black text-slate-900">{profile?.xp || 0}</div>
                </Card>
              </div>
            </div>

            {/* Right Column: Edit Profile */}
            <div className="lg:col-span-2">
              <Card className="border-none shadow-xl bg-white rounded-[2.5rem] h-full">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-indigo-500" />
                    Identity Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <Input 
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="John Doe"
                        className="h-12 bg-slate-50 border-slate-100 focus:ring-indigo-500 rounded-xl font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                      <Input 
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="king_warrior"
                        className="h-12 bg-slate-50 border-slate-100 focus:ring-indigo-500 rounded-xl font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bio // Philosophy</label>
                    <textarea 
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Share your journey philosophy..."
                      className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-medium text-sm text-slate-700"
                    />
                  </div>

                  <div className="pt-6">
                    <Button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full md:w-auto px-8 h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all rounded-2xl flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Save size={18} />
                          <span>Synchronize Profile</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

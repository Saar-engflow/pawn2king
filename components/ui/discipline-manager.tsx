"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { 
  Trophy, 
  Flame, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  Zap,
  Coffee,
  Book,
  Code,
  Dumbbell,
  Moon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RoutineItem {
  id: string;
  label: string;
  completed: boolean;
  category: 'morning' | 'deep-work' | 'evening';
  icon: React.ReactNode;
}

const initialRoutine: RoutineItem[] = [];

export function DisciplineManager() {
  const [routine, setRoutine] = useState<RoutineItem[]>(initialRoutine);
  const { toast } = useToast();

  const completedCount = routine.filter(item => item.completed).length;
  const progress = (completedCount / routine.length) * 100;
  const isFullyCompleted = completedCount === routine.length;

  const toggleItem = (id: string) => {
    setRoutine(prev => {
      const newRoutine = prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      );
      
      const item = newRoutine.find(i => i.id === id);
      if (item?.completed) {
        // If all items now completed after this toggle
        const allDone = newRoutine.every(i => i.completed);
        if (allDone) {
          toast({
            title: "Done for the day!",
            description: "King behavior. You've completed your entire routine.",
            variant: "success",
          });
        }
      }
      
      return newRoutine;
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto p-4 md:p-8">
      {/* Progress Section */}
      <Card className="border-2 border-indigo-500/20 bg-[#0A0F1F] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Trophy className="w-24 h-24 text-indigo-400" />
        </div>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-black tracking-wider uppercase italic text-indigo-400">
                Discipline Level
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1 font-mono">
                {isFullyCompleted ? "UNSTOPPABLE STATUS REACHED" : "CURRENT PROGRESS: OPERATIONAL"}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-indigo-400">{Math.round(progress)}%</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">Fulfillment Index</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3 bg-slate-800" />
          
          {!isFullyCompleted && (
            <div className="mt-4 flex items-center gap-2 text-amber-500 bg-amber-500/10 p-3 rounded-md border border-amber-500/20">
              <AlertCircle className="w-4 h-4" />
              <p className="text-xs font-mono uppercase tracking-wider">
                Warning: Daily routine incomplete. Discipline required.
              </p>
            </div>
          )}
          
          {isFullyCompleted && (
            <div className="mt-4 flex items-center gap-2 text-emerald-500 bg-emerald-500/10 p-3 rounded-md border border-emerald-500/20 animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <p className="text-xs font-mono uppercase tracking-wider">
                Objective Complete: You have conquered the day.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Routine Sections */}
      <div className="grid grid-cols-1 gap-4">
        {(['morning', 'deep-work', 'evening'] as const).map(cat => (
          <Card key={cat} className="bg-card/50 backdrop-blur-sm border-slate-800">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                {cat === 'morning' && <Calendar className="w-4 h-4 text-orange-400" />}
                {cat === 'deep-work' && <Zap className="w-4 h-4 text-blue-400" />}
                {cat === 'evening' && <Moon className="w-4 h-4 text-indigo-400" />}
                {cat.replace('-', ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {routine.filter(item => item.category === cat).map(item => (
                <div 
                  key={item.id} 
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer group",
                    item.completed 
                      ? "bg-emerald-500/5 border-emerald-500/20 opacity-60" 
                      : "bg-slate-900/50 border-slate-800 hover:border-indigo-500/50"
                  )}
                  onClick={() => toggleItem(item.id)}
                >
                  <Checkbox 
                    id={item.id} 
                    checked={item.completed}
                    onCheckedChange={() => toggleItem(item.id)}
                    className={cn(
                      "h-5 w-5",
                      item.completed && "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    )}
                  />
                  <div className="flex-1 flex items-center gap-3">
                    <div className={cn(
                      "p-1.5 rounded-md",
                      item.completed ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-800 text-slate-400"
                    )}>
                      {item.icon}
                    </div>
                    <Label 
                      htmlFor={item.id}
                      className={cn(
                        "text-sm font-medium cursor-pointer transition-all",
                        item.completed ? "text-slate-500 line-through" : "text-slate-200"
                      )}
                    >
                      {item.label}
                    </Label>
                  </div>
                  {item.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Motivation */}
      <div className="text-center py-4">
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em]">
          Discipline is the bridge between goals and accomplishment
        </p>
      </div>
    </div>
  );
}

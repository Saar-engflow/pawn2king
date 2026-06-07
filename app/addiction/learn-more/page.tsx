"use client";

import React from "react";
import { Sidebar } from "../../../components/ui/modern-side-bar";
import { 
  Heart, 
  ShieldCheck, 
  Brain, 
  TrendingUp, 
  ChevronLeft, 
  Quote,
  Flame,
  Zap,
  Star,
  Shield
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import Link from "next/link";
import { cn } from "../../../lib/utils";

export default function LearnMorePage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
          <Link href="/addiction">
            <Button variant="ghost" className="mb-8 gap-2 text-slate-500 hover:text-indigo-600 rounded-xl">
              <ChevronLeft className="w-4 h-4" />
              Back to Battle Room
            </Button>
          </Link>

          <header className="mb-16">
            <div className="flex items-center gap-3 mb-4 text-indigo-600">
              <Shield className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-[0.3em]">Scientific Intelligence</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-slate-900 mb-6">
              THE SCIENCE OF <span className="text-indigo-600 underline decoration-indigo-200">ASCENSION</span>
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed font-medium">
              Understanding why tracking your struggle is the first step to conquering it.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase mb-4 tracking-tight">The Observer Effect</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                In behavioral psychology, the simple act of observing and recording a behavior significantly alters its frequency. By tracking your streak, you move the habit from your subconscious "autopilot" to your conscious, executive brain.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform">
                <Flame className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase mb-4 tracking-tight">Dopamine Baseline</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Addiction hijacks the reward system. Visualizing a growing streak helps your brain find "micro-rewards" in discipline, slowly lowering your dopamine baseline back to healthy levels so you can find joy in the mundane again.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase mb-4 tracking-tight">Loss Aversion</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Human beings are biologically wired to fear losing what they've built more than they value gaining something new. Once you see "10 Days" on that screen, the psychological cost of breaking that streak becomes a powerful shield.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase mb-4 tracking-tight">Neuroplasticity</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Every second you spend in "The Struggle" without giving in, your brain is physically rewiring itself. You are weakening the neural pathways of the addiction and strengthening the prefrontal cortex—the seat of your Kingly Will.
              </p>
            </div>
          </div>

          <section className="bg-slate-900 text-white p-12 md:p-16 rounded-[3rem] relative overflow-hidden mb-20">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Star className="w-40 h-40" />
            </div>
            <Quote className="w-12 h-12 text-indigo-400 mb-8" />
            <h2 className="text-3xl md:text-4xl font-black italic tracking-tight mb-8 leading-tight">
              "The path of discipline is a narrow one, paved with honesty. You aren't just fighting a habit; you are reclaiming your soul."
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-lg">
                R
              </div>
              <div>
                <p className="font-black uppercase tracking-widest text-sm text-indigo-400">Robin</p>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-tighter">Architect of Pawn2King</p>
              </div>
            </div>
          </section>

          <footer className="text-center space-y-6">
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">This is your sanctuary. This is your war.</p>
            <div className="flex justify-center gap-4">
              <Link href="/addiction">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-10 h-14 rounded-2xl shadow-xl shadow-indigo-100">
                  RETURN TO FRONT LINE
                </Button>
              </Link>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

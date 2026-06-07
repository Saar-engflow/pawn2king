"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import { Shield, Zap } from "lucide-react";

interface CyberpunkHudHeaderProps {
  title: string;
  subtitle: string;
  className?: string;
}

export function CyberpunkHudHeader({ title, subtitle, className }: CyberpunkHudHeaderProps) {
  return (
    <div className={cn("relative w-full h-32 flex items-center select-none", className)}>
      {/* Background with Clip Path */}
      <div 
        className="absolute inset-0 bg-[#0A0F1F] z-0"
        style={{
          clipPath: "polygon(0% 0%, 85% 0%, 100% 100%, 15% 100%, 0% 100%)",
          maskImage: "linear-gradient(to right, black 80%, transparent 100%)"
        }}
      />

      {/* Decorative Glow Borders */}
      <div 
        className="absolute inset-0 z-0 opacity-50 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, #00E5FF 0%, transparent 80%)",
          height: "1px",
          top: "0"
        }}
      />
      <div 
        className="absolute inset-0 z-0 opacity-50 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, #00E5FF 0%, transparent 80%)",
          height: "1px",
          bottom: "0"
        }}
      />

      {/* Emblem Section */}
      <div className="relative z-10 -ml-4 flex items-center justify-center">
        <div className="relative w-24 h-24 rounded-full border-2 border-[#00E5FF] bg-[#0A0F1F] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.4)] animate-pulse">
          <Shield className="w-10 h-10 text-[#00E5FF]" />
          {/* Rotating Ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-[#4F46E5] animate-[spin_10s_linear_infinite]" />
        </div>
      </div>

      {/* Main Content Panel */}
      <div 
        className="relative z-10 flex-1 ml-6 h-20 bg-[#0A0F1F]/80 backdrop-blur-md border-l border-[#00E5FF] flex items-center px-8 group overflow-hidden"
        style={{
          clipPath: "polygon(0 0, 100% 0, 95% 100%, 0 100%)"
        }}
      >
        {/* Animated Background Scanline */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00E5FF]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-[#00E5FF] animate-bounce" />
            <h2 className="text-2xl font-black tracking-[0.2em] text-white uppercase italic">
              {title}
            </h2>
          </div>
          {subtitle && (
            <div className="flex items-center gap-2 mt-1">
              <div className="h-[2px] w-12 bg-[#4F46E5]" />
              <span className="text-xs font-mono text-[#00E5FF]/70 tracking-widest uppercase">
                {subtitle}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Extension Section */}
      <div className="hidden lg:block flex-[2] relative h-1 z-0 -ml-10">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00E5FF]/40 via-[#4F46E5]/20 to-transparent" />
        {/* Decorative Diagonal Fade Lines */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-1 pr-10 opacity-30">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div 
              key={i} 
              className="w-1 h-8 bg-[#00E5FF] -skew-x-12" 
              style={{ opacity: 1 - i * 0.1 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

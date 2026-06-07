"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange'> {
  value: number[]
  onValueChange: (value: number[]) => void
  max?: number
  min?: number
  step?: number
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, max = 100, min = 0, step = 1, ...props }, ref) => {
    const percentage = ((value[0] - min) / (max - min)) * 100

    return (
      <div className={cn("relative flex w-full touch-none select-none items-center group", className)}>
        {/* Track */}
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-100">
          {/* Progress Indicator */}
          <div 
            className="absolute h-full bg-indigo-600 transition-all duration-150 ease-out" 
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Native Range Input (Hidden but functional) */}
        <input
          type="range"
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => onValueChange([parseInt(e.target.value)])}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          {...props}
        />

        {/* Custom Thumb (Visual only) */}
        <div 
          className="absolute h-5 w-5 rounded-full border-2 border-indigo-600 bg-white shadow-md transition-all duration-150 ease-out pointer-events-none group-hover:scale-110 group-active:scale-95"
          style={{ 
            left: `calc(${percentage}% - 10px)`,
            boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.1)'
          }}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }

"use client"

import React, { useState, useCallback, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, Grid3x3, List, Search, Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface Event {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  color: string
  category?: string
  attendees?: string[]
  tags?: string[]
}

export interface EventManagerProps {
  events?: Event[]
  onEventCreate?: (event: Omit<Event, "id">) => void
  onEventUpdate?: (id: string, event: Partial<Event>) => void
  onEventDelete?: (id: string) => void
  categories?: string[]
  colors?: { name: string; value: string; bg: string; text: string }[]
  defaultView?: "month" | "week" | "day" | "list"
  className?: string
  availableTags?: string[]
  missedDays?: string[] // Added to support highlighting missed days in red
}

const defaultColors = [
  { name: "Blue", value: "blue", bg: "bg-blue-500", text: "text-blue-700" },
  { name: "Green", value: "green", bg: "bg-green-500", text: "text-green-700" },
  { name: "Purple", value: "purple", bg: "bg-purple-500", text: "text-purple-700" },
  { name: "Orange", value: "orange", bg: "bg-orange-500", text: "text-orange-700" },
  { name: "Pink", value: "pink", bg: "bg-pink-500", text: "text-pink-700" },
  { name: "Red", value: "red", bg: "bg-red-500", text: "text-red-700" },
]

export function EventManager({
  events: initialEvents = [],
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  categories = ["Meeting", "Task", "Reminder", "Personal"],
  colors = defaultColors,
  defaultView = "month",
  className,
  availableTags = ["Important", "Urgent", "Work", "Personal", "Team", "Client"],
  missedDays = [],
}: EventManagerProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents)

  // Synchronize internal state with props - 2026-06-07
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day" | "list">(defaultView)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null)
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: "",
    description: "",
    color: colors[0].value,
    category: categories[0],
    tags: [],
    startTime: new Date(),
    endTime: new Date(new Date().getTime() + 60 * 60 * 1000),
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.category?.toLowerCase().includes(query) ||
          event.tags?.some((tag) => tag.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }
      if (selectedColors.length > 0 && !selectedColors.includes(event.color)) return false
      if (selectedTags.length > 0 && !event.tags?.some((tag) => selectedTags.includes(tag))) return false
      if (selectedCategories.length > 0 && event.category && !selectedCategories.includes(event.category)) return false
      return true
    })
  }, [events, searchQuery, selectedColors, selectedTags, selectedCategories])

  const handleCreateEvent = useCallback(() => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) return
    const event: Event = {
      id: Math.random().toString(36).substr(2, 9),
      title: newEvent.title,
      description: newEvent.description,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      color: newEvent.color || colors[0].value,
      category: newEvent.category,
      attendees: newEvent.attendees,
      tags: newEvent.tags || [],
    }
    setEvents((prev) => [...prev, event])
    onEventCreate?.(event)
    setIsDialogOpen(false)
    setIsCreating(false)
    setNewEvent({
      title: "",
      description: "",
      color: colors[0].value,
      category: categories[0],
      tags: [],
      startTime: new Date(),
      endTime: new Date(new Date().getTime() + 60 * 60 * 1000),
    })
  }, [newEvent, colors, categories, onEventCreate])

  const handleUpdateEvent = useCallback(() => {
    if (!selectedEvent) return
    setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? selectedEvent : e)))
    onEventUpdate?.(selectedEvent.id, selectedEvent)
    setIsDialogOpen(false)
    setSelectedEvent(null)
  }, [selectedEvent, onEventUpdate])

  const handleDeleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
    onEventDelete?.(id)
    setIsDialogOpen(false)
    setSelectedEvent(null)
  }, [onEventDelete])

  const navigateDate = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      if (view === "month") next.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1))
      else if (view === "week") next.setDate(prev.getDate() + (direction === "next" ? 7 : -7))
      else next.setDate(prev.getDate() + (direction === "next" ? 1 : -1))
      return next
    })
  }

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const date = new Date(year, month, 1)
    const days = []
    const firstDay = date.getDay()
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    while (date.getMonth() === month) {
      days.push(new Date(date))
      date.setDate(date.getDate() + 1)
    }
    return days
  }, [currentDate])

  const renderMonthView = () => (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[700px] grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden border">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="bg-background p-2 text-center text-xs font-medium text-muted-foreground">{day}</div>
        ))}
        {daysInMonth.map((day, i) => {
          const dateString = day ? day.toISOString().split('T')[0] : null;
          const isMissed = dateString && missedDays.includes(dateString);

          return (
            <div 
              key={i} 
              className={cn(
                "bg-background min-h-[100px] p-2 transition-colors hover:bg-accent/50 cursor-pointer border-t border-l first:border-l-0", 
                !day && "bg-muted/30",
                isMissed && "bg-red-500/10 border-red-200" // Highlight missed days with a subtle red tint
              )}
            >
              {day && (
                <>
                  <div className={cn(
                    "flex items-center justify-between mb-1",
                    isMissed && "text-red-600 font-bold"
                  )}>
                    <div className={cn(
                      "text-sm font-medium", 
                      day.toDateString() === new Date().toDateString() && "text-primary font-bold underline decoration-2 underline-offset-4"
                    )}>
                      {day.getDate()}
                    </div>
                    {isMissed && (
                      <div className="text-[8px] font-black uppercase tracking-tighter bg-red-600 text-white px-1 rounded leading-tight">
                        Missed
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {filteredEvents
                      .filter(e => e.startTime.toDateString() === day.toDateString())
                      .map(e => (
                        <div
                          key={e.id}
                          onClick={(ev) => {
                            ev.stopPropagation()
                            setSelectedEvent(e)
                            setIsCreating(false)
                            setIsDialogOpen(true)
                          }}
                          className={cn("text-[10px] px-1.5 py-0.5 rounded truncate", colors.find(c => c.value === e.color)?.bg, "text-white")}
                        >
                          {e.title}
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  )

  const renderListView = () => (
    <div className="flex flex-col gap-2">
      {filteredEvents.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">No events found</Card>
      ) : (
        filteredEvents
          .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
          .map(e => (
            <Card
              key={e.id}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => {
                setSelectedEvent(e)
                setIsCreating(false)
                setIsDialogOpen(true)
              }}
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-3 h-3 rounded-full", colors.find(c => c.value === e.color)?.bg)} />
                <div>
                  <h3 className="font-medium">{e.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {e.startTime.toLocaleString()} - {e.endTime.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              {e.category && <Badge variant="outline">{e.category}</Badge>}
            </Card>
          ))
      )}
    </div>
  )

  return (
    <div className={cn("flex flex-col gap-4 p-4", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2 sm:pb-0">
          <h2 className="text-lg sm:text-2xl font-bold whitespace-nowrap">
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateDate("prev")}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateDate("next")}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/50 shrink-0">
            <Button variant={view === "month" ? "secondary" : "ghost"} size="sm" className="h-8 text-[10px] px-2" onClick={() => setView("month")}><Grid3x3 className="mr-1 h-3 w-3" />Month</Button>
            <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" className="h-8 text-[10px] px-2" onClick={() => setView("list")}><List className="mr-1 h-3 w-3" />List</Button>
          </div>
          <Button size="sm" className="h-8 text-[10px] px-3 flex-1 sm:flex-none" onClick={() => { setIsCreating(true); setIsDialogOpen(true); }}>
            <Plus className="mr-1 h-3 w-3" />New Event
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {view === "month" ? renderMonthView() : renderListView()}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isCreating ? "Create New Event" : "Edit Event"}</DialogTitle>
            <DialogDescription>
              {isCreating ? "Add a new task or meeting to your calendar." : "Modify your existing event details."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={(isCreating ? newEvent.title : selectedEvent?.title) || ""}
                onChange={(e) => isCreating ? setNewEvent({ ...newEvent, title: e.target.value }) : setSelectedEvent(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={(isCreating ? newEvent.description : selectedEvent?.description) || ""}
                onChange={(e) => isCreating ? setNewEvent({ ...newEvent, description: e.target.value }) : setSelectedEvent(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={(isCreating ? newEvent.category : selectedEvent?.category) || categories[0]}
                  onValueChange={(v) => isCreating ? setNewEvent({ ...newEvent, category: v }) : setSelectedEvent(prev => prev ? { ...prev, category: v } : null)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <Select
                  value={(isCreating ? newEvent.color : selectedEvent?.color) || colors[0].value}
                  onValueChange={(v) => isCreating ? setNewEvent({ ...newEvent, color: v }) : setSelectedEvent(prev => prev ? { ...prev, color: v } : null)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {colors.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", c.bg)} />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            {!isCreating && (
              <Button variant="destructive" onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}>Delete</Button>
            )}
            <Button onClick={isCreating ? handleCreateEvent : handleUpdateEvent}>
              {isCreating ? "Create Event" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

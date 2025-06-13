"use client"

import { useNotes } from "@/components/context/notes-context"
import MobileNoteCard from "@/components/mobile-note-card"
import { Loader2 } from "lucide-react"

export default function MobileNotesCanvas() {
  const { tasks, loading } = useNotes()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading your notes...
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden touch-pan-y">
      {/* Grid background - lighter on mobile */}
      <div
        className="absolute inset-0 opacity-3"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "30px 30px",
        }}
      />

      {tasks.map((task) => (
        <MobileNoteCard key={task.id} task={task} />
      ))}

      {tasks.length === 0 && (
        <div className="flex items-center justify-center h-96 px-4">
          <div className="text-center text-slate-400">
            <p className="text-lg mb-2">No notes yet</p>
            <p className="text-sm">Tap "Add" to create your first task</p>
          </div>
        </div>
      )}
    </div>
  )
}

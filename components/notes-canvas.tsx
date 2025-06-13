"use client"

import { useNotes } from "@/components/context/notes-context"
import AdaptiveNoteCard from "@/components/adaptive-note-card"
import TaskLinksOverlay from "@/components/task-links-overlay"
import { Button } from "@/components/ui/button"
import { Loader2, Link, X } from "lucide-react"

export default function NotesCanvas() {
  const { tasks, loading, linkingMode, setLinkingMode, selectedTaskForLinking, setSelectedTaskForLinking } = useNotes()

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

  const handleExitLinkingMode = () => {
    setLinkingMode(false)
    setSelectedTaskForLinking(null)
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Dark school notepad grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "40px 40px, 40px 40px, 8px 8px, 8px 8px",
          backgroundPosition: "-1px -1px, -1px -1px, -1px -1px, -1px -1px",
        }}
      />

      {/* Task links overlay */}
      <TaskLinksOverlay />

      {/* Linking mode controls */}
      {linkingMode && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <Link className="w-5 h-5 text-amber-400" />
            <span className="text-white font-medium">Linking Mode Active</span>
            <span className="text-slate-400 text-sm">
              {selectedTaskForLinking ? "Click target card to create link" : "Click source card to start"}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExitLinkingMode}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600"
            >
              <X className="w-4 h-4 mr-1" />
              Exit
            </Button>
          </div>
        </div>
      )}

      {tasks.map((task) => (
        <AdaptiveNoteCard key={task.id} task={task} />
      ))}

      {tasks.length === 0 && (
        <div className="flex items-center justify-center h-96 px-4">
          <div className="text-center text-slate-400">
            <p className="text-lg mb-2">No notes yet</p>
            <p className="text-sm">Click "Add Note" to create your first task</p>
          </div>
        </div>
      )}
    </div>
  )
}

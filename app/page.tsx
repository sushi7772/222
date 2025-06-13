"use client"

import { NotesProvider } from "@/components/context/notes-context"
import GlassmorphismHeader from "@/components/glassmorphism-header"
import EnhancedNotesCanvas from "@/components/enhanced-notes-canvas"
import { Toaster } from "@/components/ui/toaster"

export default function HomePage() {
  return (
    <NotesProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <GlassmorphismHeader />
        <main className="relative">
          <EnhancedNotesCanvas />
        </main>
        <Toaster />
      </div>
    </NotesProvider>
  )
}

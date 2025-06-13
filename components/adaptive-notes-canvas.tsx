"use client"

import { useResponsive } from "@/hooks/use-responsive"
import NotesCanvas from "@/components/notes-canvas"
import MobileNotesCanvas from "@/components/mobile-notes-canvas"

export default function AdaptiveNotesCanvas() {
  const { isMobile } = useResponsive()

  return isMobile ? <MobileNotesCanvas /> : <NotesCanvas />
}

"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useNotes, type Task } from "@/components/context/notes-context"
import { useResponsive } from "@/hooks/use-responsive"
import AdaptiveTimer from "@/components/adaptive-timer"
import TimePickerModal from "@/components/time-picker-modal"
import AlarmTimePickerModal from "@/components/alarm-time-picker-modal"
import AttachmentPanel from "@/components/attachment-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Clock,
  Paperclip,
  Bell,
  BellOff,
  MoreVertical,
  Edit3,
  Palette,
  Tag,
  Timer,
  AlarmClock,
  Link,
  Unlink,
  Target,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdaptiveNoteCardProps {
  task: Task
}

const COLOR_THEMES = {
  amber: {
    bg: "from-amber-900/95 to-amber-800/95",
    border: "border-amber-700/50",
    text: "text-amber-100",
    accent: "text-amber-200",
    glow: "shadow-amber-500/20",
  },
  blue: {
    bg: "from-blue-900/95 to-blue-800/95",
    border: "border-blue-700/50",
    text: "text-blue-100",
    accent: "text-blue-200",
    glow: "shadow-blue-500/20",
  },
  green: {
    bg: "from-green-900/95 to-green-800/95",
    border: "border-green-700/50",
    text: "text-green-100",
    accent: "text-green-200",
    glow: "shadow-green-500/20",
  },
  purple: {
    bg: "from-purple-900/95 to-purple-800/95",
    border: "border-purple-700/50",
    text: "text-purple-100",
    accent: "text-purple-200",
    glow: "shadow-purple-500/20",
  },
  pink: {
    bg: "from-pink-900/95 to-pink-800/95",
    border: "border-pink-700/50",
    text: "text-pink-100",
    accent: "text-pink-200",
    glow: "shadow-pink-500/20",
  },
  indigo: {
    bg: "from-indigo-900/95 to-indigo-800/95",
    border: "border-indigo-700/50",
    text: "text-indigo-100",
    accent: "text-indigo-200",
    glow: "shadow-indigo-500/20",
  },
}

export default function AdaptiveNoteCard({ task }: AdaptiveNoteCardProps) {
  const {
    updatePosition,
    updateTask,
    toggleTimer,
    resetTimer,
    deleteTask,
    setCustomTime,
    setAlarmTime,
    toggleTaskMode,
    addAttachment,
    linkingMode,
    selectedTaskForLinking,
    setSelectedTaskForLinking,
    linkTasks,
    unlinkTasks,
  } = useNotes()
  const { toast } = useToast()
  const { isMobile, isTablet } = useResponsive()

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showAlarmPicker, setShowAlarmPicker] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [newTag, setNewTag] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isSwipingLeft, setIsSwipingLeft] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)

  const titleInputRef = useRef<HTMLInputElement>(null)
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const touchStartTime = useRef(0)
  const lastTouchEnd = useRef(0)
  const dragStartTime = useRef(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwipeGesture = useRef(false)

  const theme = COLOR_THEMES[task.backgroundColor as keyof typeof COLOR_THEMES] || COLOR_THEMES.amber

  // Unified drag handling for both mouse and touch
  const handleDragStart = useCallback(
    (clientX: number, clientY: number, eventType: "mouse" | "touch") => {
      if (isEditingTitle || isEditingDescription || linkingMode) return false

      dragStartTime.current = Date.now()
      const rect = cardRef.current?.getBoundingClientRect()

      if (rect) {
        const offsetX = clientX - rect.left
        const offsetY = clientY - rect.top
        setDragOffset({ x: offsetX, y: offsetY })
        dragStartPos.current = { x: task.position.x, y: task.position.y }
      }

      // For touch events, store the start position for swipe detection
      if (eventType === "touch") {
        touchStartX.current = clientX
        touchStartY.current = clientY
        isSwipeGesture.current = false
      }

      return true
    },
    [isEditingTitle, isEditingDescription, task.position, linkingMode],
  )

  const handleDragMove = useCallback(
    (clientX: number, clientY: number, eventType: "mouse" | "touch") => {
      // For touch events, check if it's a horizontal swipe
      if (eventType === "touch" && !isDragging) {
        const deltaX = clientX - touchStartX.current
        const deltaY = clientY - touchStartY.current

        // If horizontal movement is greater than vertical and exceeds threshold
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
          isSwipeGesture.current = true

          // Only handle left swipes for delete
          if (deltaX < 0) {
            setIsSwipingLeft(true)
            setSwipeOffset(Math.min(0, deltaX))
            return true
          }
        }
      }

      // If it's a swipe gesture, don't start dragging
      if (isSwipeGesture.current) return false

      if (!isDragging && Date.now() - dragStartTime.current > (isMobile ? 150 : 100)) {
        setIsDragging(true)
      }

      if (isDragging) {
        const maxWidth = window.innerWidth - (isMobile ? 330 : 320)
        const maxHeight = window.innerHeight - 400
        const minX = isMobile ? 10 : 0
        const minY = 80

        const newX = Math.max(minX, Math.min(maxWidth, clientX - dragOffset.x))
        const newY = Math.max(minY, Math.min(maxHeight, clientY - dragOffset.y))

        if (cardRef.current) {
          cardRef.current.style.left = `${newX}px`
          cardRef.current.style.top = `${newY}px`
        }
      }

      return true
    },
    [isDragging, dragOffset, isMobile],
  )

  const handleDragEnd = useCallback(
    (clientX: number, clientY: number, eventType: "touch" | "mouse") => {
      // Handle swipe to delete
      if (eventType === "touch" && isSwipeGesture.current && isSwipingLeft) {
        const deltaX = clientX - touchStartX.current

        // If swiped far enough to the left, show delete confirmation
        if (deltaX < -100) {
          setShowDeleteConfirm(true)
        }

        setIsSwipingLeft(false)
        setSwipeOffset(0)
        return
      }

      if (isDragging) {
        const maxWidth = window.innerWidth - (isMobile ? 330 : 320)
        const maxHeight = window.innerHeight - 400
        const minX = isMobile ? 10 : 0
        const minY = 80

        const newX = Math.max(minX, Math.min(maxWidth, clientX - dragOffset.x))
        const newY = Math.max(minY, Math.min(maxHeight, clientY - dragOffset.y))

        if (Math.abs(newX - dragStartPos.current.x) > 5 || Math.abs(newY - dragStartPos.current.y) > 5) {
          updatePosition(task.id, newX, newY)
        } else if (cardRef.current) {
          cardRef.current.style.left = `${task.position.x}px`
          cardRef.current.style.top = `${task.position.y}px`
        }

        setIsDragging(false)
      }
    },
    [isDragging, dragOffset, task.position, task.id, updatePosition, isMobile, isSwipingLeft],
  )

  // Mouse events for desktop
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) return // Don't handle mouse events on mobile

      if (handleDragStart(e.clientX, e.clientY, "mouse")) {
        e.preventDefault()

        const handleMouseMove = (e: MouseEvent) => {
          handleDragMove(e.clientX, e.clientY, "mouse")
        }

        const handleMouseUp = (e: MouseEvent) => {
          handleDragEnd(e.clientX, e.clientY, "mouse")
          document.removeEventListener("mousemove", handleMouseMove)
          document.removeEventListener("mouseup", handleMouseUp)
        }

        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)
      }
    },
    [handleDragStart, handleDragMove, handleDragEnd, isMobile],
  )

  // Touch events for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile) return // Don't handle touch events on desktop

      touchStartTime.current = Date.now()
      const touch = e.touches[0]

      if (handleDragStart(touch.clientX, touch.clientY, "touch")) {
        // Don't prevent default here to allow scrolling if needed
      }
    },
    [handleDragStart, isMobile],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile) return

      const touch = e.touches[0]
      const handled = handleDragMove(touch.clientX, touch.clientY, "touch")

      if (isDragging || isSwipingLeft) {
        e.preventDefault()
      }
    },
    [handleDragMove, isDragging, isMobile, isSwipingLeft],
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile) return

      const touchDuration = Date.now() - touchStartTime.current
      const timeSinceLastTouch = Date.now() - lastTouchEnd.current

      // Handle double tap for mobile
      if (touchDuration < 300 && timeSinceLastTouch < 300 && !isDragging && !isSwipingLeft) {
        setIsEditingTitle(true)
        e.preventDefault()
        return
      }

      lastTouchEnd.current = Date.now()

      if (e.changedTouches.length > 0) {
        const touch = e.changedTouches[0]
        handleDragEnd(touch.clientX, touch.clientY, "touch")
      }
    },
    [handleDragEnd, isDragging, isMobile, isSwipingLeft],
  )

  // Handle linking mode clicks
  const handleCardClick = useCallback(() => {
    if (linkingMode) {
      if (selectedTaskForLinking === null) {
        setSelectedTaskForLinking(task.id)
        toast({
          title: "Source selected",
          description: "Now click on the target card to create a link.",
        })
      } else if (selectedTaskForLinking === task.id) {
        setSelectedTaskForLinking(null)
        toast({
          title: "Selection cleared",
          description: "Link creation cancelled.",
        })
      } else {
        linkTasks(selectedTaskForLinking, task.id)
        setSelectedTaskForLinking(null)
      }
    }
  }, [linkingMode, selectedTaskForLinking, task.id, setSelectedTaskForLinking, linkTasks, toast])

  // Auto-focus inputs when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus()
      descriptionInputRef.current.select()
    }
  }, [isEditingDescription])

  const handleSaveTitle = async () => {
    if (title.trim() !== task.title) {
      await updateTask(task.id, { title: title.trim() })
    }
    setIsEditingTitle(false)
  }

  const handleSaveDescription = async () => {
    if (description.trim() !== task.description) {
      await updateTask(task.id, { description: description.trim() })
    }
    setIsEditingDescription(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent, type: "title" | "description") => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (type === "title") {
        handleSaveTitle()
      } else {
        handleSaveDescription()
      }
    }
    if (e.key === "Escape") {
      if (type === "title") {
        setTitle(task.title)
        setIsEditingTitle(false)
      } else {
        setDescription(task.description)
        setIsEditingDescription(false)
      }
    }
  }

  const handleDelete = async () => {
    await deleteTask(task.id)
    setShowDeleteConfirm(false)
    toast({
      title: "Task deleted",
      description: "Your task has been removed",
    })
  }

  const handleTimeSelect = (time: string) => {
    setCustomTime(task.id, time)
    setShowTimePicker(false)
    toast({
      title: "Timer updated",
      description: `Timer set to ${time}`,
    })
  }

  const handleAlarmSelect = (time: string, date?: string) => {
    setAlarmTime(task.id, time, date)
    setShowAlarmPicker(false)
    toast({
      title: "Alarm set",
      description: `Alarm set for ${time}${date ? ` on ${date}` : ""}`,
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      addAttachment(task.id, file)
      if (isMobile) setShowOptions(false)
    }
  }

  const handleColorChange = async (color: string) => {
    await updateTask(task.id, { backgroundColor: color })
    if (isMobile) setShowOptions(false)
  }

  const handleAddTag = async () => {
    if (newTag.trim() && !task.tags.includes(newTag.trim())) {
      await updateTask(task.id, { tags: [...task.tags, newTag.trim()] })
      setNewTag("")
    }
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    await updateTask(task.id, { tags: task.tags.filter((tag) => tag !== tagToRemove) })
  }

  const handleToggleNotifications = async () => {
    await updateTask(task.id, { telegramNotifications: !task.telegramNotifications })
  }

  const handleModeToggle = () => {
    toggleTaskMode(task.id)
    toast({
      title: `Switched to ${task.mode === "timer" ? "alarm" : "timer"} mode`,
      description: `This card is now in ${task.mode === "timer" ? "alarm" : "timer"} mode.`,
    })
  }

  const handleUnlinkTask = (targetId: number) => {
    unlinkTasks(task.id, targetId)
  }

  // Determine card width based on screen size
  const cardWidth = isMobile ? "w-80" : "w-80"
  const padding = isMobile ? "p-3" : "p-4"
  const textSize = isMobile ? "text-lg" : "text-lg"

  // Determine if card should be highlighted for linking
  const isLinkingHighlight = linkingMode && selectedTaskForLinking === task.id
  const isLinkingTarget = linkingMode && selectedTaskForLinking !== null && selectedTaskForLinking !== task.id

  return (
    <>
      <div
        ref={cardRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
        className={`absolute ${cardWidth} bg-gradient-to-br ${theme.bg} backdrop-blur-sm rounded-xl shadow-2xl border ${theme.border} transition-all duration-200 hover:${theme.glow} hover:shadow-2xl ${
          isDragging ? "opacity-90 scale-105 rotate-1 z-50 cursor-grabbing" : "opacity-100 hover:scale-[1.02]"
        } ${linkingMode ? "cursor-pointer" : "cursor-grab"} ${task.isCompleted ? "ring-2 ring-green-500/50" : ""} ${
          isLinkingHighlight ? "ring-4 ring-amber-500/70 shadow-amber-500/50" : ""
        } ${
          isLinkingTarget ? "ring-2 ring-blue-500/50 shadow-blue-500/30" : ""
        } ${isMobile ? "touch-none select-none" : ""}`}
        style={{
          left: task.position.x,
          top: task.position.y,
          transform: isDragging ? "rotate(2deg) scale(1.05)" : isSwipingLeft ? `translateX(${swipeOffset}px)` : "none",
          transition: isDragging || isSwipingLeft ? "none" : "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: isDragging || isSwipingLeft ? "transform" : "auto",
        }}
      >
        {/* Mobile swipe-to-delete indicator */}
        {isMobile && isSwipingLeft && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-16 bg-red-500/80 rounded-r-xl">
            <Trash2 className="w-6 h-6 text-white" />
          </div>
        )}

        {/* Linking mode overlay */}
        {linkingMode && (
          <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center z-10">
            <div className="bg-black/80 rounded-lg p-3 text-center">
              {selectedTaskForLinking === task.id ? (
                <div className="text-amber-400">
                  <Target className="w-6 h-6 mx-auto mb-1" />
                  <p className="text-xs">Source Selected</p>
                </div>
              ) : selectedTaskForLinking !== null ? (
                <div className="text-blue-400">
                  <Target className="w-6 h-6 mx-auto mb-1" />
                  <p className="text-xs">Click to Link</p>
                </div>
              ) : (
                <div className="text-white">
                  <Link className="w-6 h-6 mx-auto mb-1" />
                  <p className="text-xs">Select Source</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Header with controls */}
        <div
          className={`flex justify-between items-center ${padding} border-b ${theme.border.replace("border-", "border-b-")}`}
        >
          <div className="flex items-center gap-2">
            {/* Desktop traffic lights */}
            {!isMobile && (
              <div className="flex gap-1.5">
                <div
                  className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-400 cursor-pointer transition-all duration-200 hover:scale-110"
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete task"
                />
                <div
                  className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-400 cursor-pointer transition-all duration-200 hover:scale-110"
                  onClick={() => (task.mode === "timer" ? setShowTimePicker(true) : setShowAlarmPicker(true))}
                  title={task.mode === "timer" ? "Set timer" : "Set alarm"}
                />
                <div
                  className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-400 cursor-pointer transition-all duration-200 hover:scale-110"
                  onClick={() => resetTimer(task.id)}
                  title="Reset timer/alarm"
                />
              </div>
            )}
            <span className={`${theme.accent} text-xs font-mono bg-black/20 px-2 py-1 rounded`}>#{task.id}</span>
            {task.telegramNotifications && <Bell className="w-3 h-3 text-green-400" />}
            {task.linkedTo.length > 0 && <Link className="w-3 h-3 text-blue-400" />}
          </div>

          <div className="flex gap-1">
            {/* Mode toggle */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleModeToggle}
              className={`h-${isMobile ? "8" : "6"} w-${isMobile ? "8" : "6"} p-0 ${theme.text} hover:text-white hover:bg-black/20 transition-all duration-200`}
              title={`Switch to ${task.mode === "timer" ? "alarm" : "timer"} mode`}
            >
              {task.mode === "timer" ? (
                <Timer className={`w-${isMobile ? "4" : "3"} h-${isMobile ? "4" : "3"}`} />
              ) : (
                <AlarmClock className={`w-${isMobile ? "4" : "3"} h-${isMobile ? "4" : "3"} text-purple-400`} />
              )}
            </Button>

            {/* Desktop controls */}
            {!isMobile && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleToggleNotifications}
                  className={`h-6 w-6 p-0 ${theme.text} hover:text-white hover:bg-black/20 transition-all duration-200`}
                >
                  {task.telegramNotifications ? (
                    <Bell className="w-3 h-3 text-green-400" />
                  ) : (
                    <BellOff className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAttachments(!showAttachments)}
                  className={`h-6 w-6 p-0 ${theme.text} hover:text-white hover:bg-black/20 transition-all duration-200`}
                >
                  <Paperclip className="w-3 h-3" />
                  {task.attachments.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {task.attachments.length}
                    </span>
                  )}
                </Button>
              </>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => (task.mode === "timer" ? setShowTimePicker(true) : setShowAlarmPicker(true))}
              className={`h-${isMobile ? "8" : "6"} w-${isMobile ? "8" : "6"} p-0 ${theme.text} hover:text-white hover:bg-black/20 transition-all duration-200`}
            >
              <Clock className={`w-${isMobile ? "4" : "3"} h-${isMobile ? "4" : "3"}`} />
            </Button>

            {/* Mobile options menu */}
            {isMobile && (
              <Sheet open={showOptions} onOpenChange={setShowOptions}>
                <SheetTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-8 w-8 p-0 ${theme.text} hover:text-white hover:bg-black/20 transition-all duration-200`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] bg-slate-900/90 backdrop-blur-md border-slate-700">
                  <SheetHeader>
                    <SheetTitle className="text-white">Task Options</SheetTitle>
                  </SheetHeader>

                  <div className="mt-6 space-y-6 pb-6">
                    {/* Mode Toggle */}
                    <div>
                      <h3 className="text-white font-medium mb-3">Mode</h3>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleModeToggle}
                          variant={task.mode === "timer" ? "default" : "outline"}
                          className="flex-1 bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-600 justify-start"
                        >
                          <Timer className="w-4 h-4 mr-2" />
                          Timer Mode
                        </Button>
                        <Button
                          onClick={handleModeToggle}
                          variant={task.mode === "alarm" ? "default" : "outline"}
                          className="flex-1 bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-600 justify-start"
                        >
                          <AlarmClock className="w-4 h-4 mr-2" />
                          Alarm Mode
                        </Button>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                      <h3 className="text-white font-medium mb-3">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => {
                            setIsEditingTitle(true)
                            setShowOptions(false)
                          }}
                          variant="outline"
                          className="bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-600 justify-start"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Title
                        </Button>
                        <Button
                          onClick={() => {
                            setShowAttachments(true)
                            setShowOptions(false)
                          }}
                          variant="outline"
                          className="bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-600 justify-start"
                        >
                          <Paperclip className="w-4 h-4 mr-2" />
                          Attachments
                          {task.attachments.length > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {task.attachments.length}
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Linked Tasks */}
                    {task.linkedTo.length > 0 && (
                      <div>
                        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                          <Link className="w-4 h-4" />
                          Linked Tasks
                        </h3>
                        <div className="space-y-2">
                          {task.linkedTo.map((linkedId) => (
                            <div
                              key={linkedId}
                              className="flex items-center justify-between p-2 bg-slate-800/50 rounded border border-slate-600"
                            >
                              <span className="text-slate-300 text-sm">Task #{linkedId}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUnlinkTask(linkedId)}
                                className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/30"
                              >
                                <Unlink className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notifications */}
                    <div>
                      <h3 className="text-white font-medium mb-3">Notifications</h3>
                      <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg">
                        <Checkbox
                          id={`telegram-mobile-${task.id}`}
                          checked={task.telegramNotifications}
                          onCheckedChange={handleToggleNotifications}
                          className="border-white/30"
                        />
                        <label htmlFor={`telegram-mobile-${task.id}`} className="text-slate-300 cursor-pointer flex-1">
                          Send Telegram notifications
                        </label>
                        {task.telegramNotifications ? (
                          <Bell className="w-4 h-4 text-green-400" />
                        ) : (
                          <BellOff className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Color Themes */}
                    <div>
                      <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Color Theme
                      </h3>
                      <div className="grid grid-cols-6 gap-3">
                        {Object.keys(COLOR_THEMES).map((color) => (
                          <button
                            key={color}
                            className={`w-12 h-12 rounded-lg border-2 ${
                              task.backgroundColor === color ? "border-white scale-110" : "border-transparent"
                            } hover:scale-110 transition-all duration-200`}
                            style={{
                              background: `linear-gradient(135deg, var(--${color}-600), var(--${color}-800))`,
                            }}
                            onClick={() => handleColorChange(color)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Tags
                      </h3>
                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {task.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs bg-black/20 text-white hover:bg-black/30 cursor-pointer transition-all duration-200"
                              onClick={() => handleRemoveTag(tag)}
                            >
                              {tag} ×
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                          placeholder="Add tag..."
                          className="bg-slate-800/50 border-slate-600 text-white text-sm"
                        />
                        <Button onClick={handleAddTag} className="bg-slate-700 hover:bg-slate-600 text-white px-4">
                          Add
                        </Button>
                      </div>
                    </div>

                    {/* File Upload */}
                    <div>
                      <h3 className="text-white font-medium mb-3">Attachments</h3>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        multiple
                        accept="image/*,application/pdf,.txt,.doc,.docx"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="w-full bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-600 justify-start"
                      >
                        <Paperclip className="w-4 h-4 mr-3" />
                        Attach File
                      </Button>
                    </div>

                    {/* Danger Zone */}
                    <div>
                      <h3 className="text-red-400 font-medium mb-3">Danger Zone</h3>
                      <Button
                        onClick={() => setShowDeleteConfirm(true)}
                        variant="outline"
                        className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-400 border-red-600 hover:border-red-500 justify-start"
                      >
                        <Trash2 className="w-4 h-4 mr-3" />
                        Delete Task
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}

            {/* Desktop delete button */}
            {!isMobile && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                className={`h-6 w-6 p-0 ${theme.text} hover:text-red-400 hover:bg-red-900/30 transition-all duration-200`}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Telegram notification checkbox - Desktop only */}
        {!isMobile && (
          <div className="px-4 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`telegram-${task.id}`}
                checked={task.telegramNotifications}
                onCheckedChange={handleToggleNotifications}
                className="border-white/30"
              />
              <label
                htmlFor={`telegram-${task.id}`}
                className={`text-xs ${theme.accent} cursor-pointer hover:text-white transition-colors`}
              >
                Send Telegram notifications
              </label>
            </div>
          </div>
        )}

        {/* Title */}
        <div className={`px-${isMobile ? "3" : "4"} pt-3`}>
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => handleKeyPress(e, "title")}
              className={`bg-black/20 border-white/20 text-white font-semibold ${textSize} h-${isMobile ? "10" : "8"} px-${isMobile ? "3" : "2"} transition-all duration-200`}
              placeholder="Task title"
            />
          ) : (
            <h3
              className={`${theme.text} font-semibold ${textSize} cursor-pointer hover:text-white transition-all duration-200 border-b border-transparent hover:border-white/50 pb-1`}
              onClick={isMobile ? undefined : () => setIsEditingTitle(true)}
              onDoubleClick={isMobile ? () => setIsEditingTitle(true) : undefined}
              title={isMobile ? "Double tap to edit title" : "Click to edit title"}
            >
              {task.title}
            </h3>
          )}
        </div>

        {/* Mode indicator and linked tasks info */}
        <div className={`px-${isMobile ? "3" : "4"} pt-2`}>
          <div className="flex items-center gap-2 text-xs">
            <Badge
              variant="secondary"
              className={`text-xs ${
                task.mode === "alarm" ? "bg-purple-900/50 text-purple-200" : "bg-amber-900/50 text-amber-200"
              }`}
            >
              {task.mode === "alarm" ? (
                <>
                  <AlarmClock className="w-3 h-3 mr-1" />
                  Alarm
                </>
              ) : (
                <>
                  <Timer className="w-3 h-3 mr-1" />
                  Timer
                </>
              )}
            </Badge>
            {task.linkedTo.length > 0 && (
              <Badge variant="secondary" className="text-xs bg-blue-900/50 text-blue-200">
                <Link className="w-3 h-3 mr-1" />
                {task.linkedTo.length} linked
              </Badge>
            )}
          </div>
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className={`px-${isMobile ? "3" : "4"} pt-2`}>
            <div className="flex flex-wrap gap-1">
              {(isMobile ? task.tags.slice(0, 3) : task.tags).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs bg-black/20 text-white hover:bg-black/30 cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
              {isMobile && task.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-black/20 text-white">
                  +{task.tags.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <div className={`px-${isMobile ? "3" : "4"} pt-2`}>
          {isEditingDescription ? (
            <Textarea
              ref={descriptionInputRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSaveDescription}
              onKeyDown={(e) => handleKeyPress(e, "description")}
              className="bg-black/20 border-white/20 text-white text-sm min-h-[60px] resize-none transition-all duration-200"
              placeholder="Add description..."
            />
          ) : (
            <p
              className={`${theme.text} text-sm cursor-pointer hover:text-white transition-all duration-200 min-h-[40px] p-2 rounded hover:bg-black/20 border border-transparent hover:border-white/20`}
              onClick={isMobile ? undefined : () => setIsEditingDescription(true)}
              onDoubleClick={isMobile ? () => setIsEditingDescription(true) : undefined}
              title={isMobile ? "Double tap to edit description" : "Click to edit description"}
            >
              {task.description}
            </p>
          )}
        </div>

        {/* Attachments Panel */}
        {showAttachments && (
          <div className={`px-${isMobile ? "3" : "4"} pt-2`}>
            <AttachmentPanel task={task} />
            {!isMobile && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  multiple
                  accept="image/*,application/pdf,.txt,.doc,.docx"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mt-2 bg-black/20 border-white/20 text-white hover:bg-black/30 transition-all duration-200"
                >
                  <Paperclip className="w-3 h-3 mr-2" />
                  Attach File
                </Button>
              </>
            )}
            {isMobile && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAttachments(false)}
                className="w-full mt-2 bg-black/20 border-white/20 text-white hover:bg-black/30 transition-all duration-200"
              >
                Hide Attachments
              </Button>
            )}
          </div>
        )}

        {/* Timer/Alarm */}
        <div className="flex justify-center py-4">
          <div
            className="cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={() => (task.mode === "timer" ? setShowTimePicker(true) : setShowAlarmPicker(true))}
            title={isMobile ? "Tap to set custom time" : "Click to set custom time"}
          >
            <AdaptiveTimer task={task} />
          </div>
        </div>

        {/* Color picker - Desktop only */}
        {!isMobile && (
          <div className="px-4 pb-2">
            <div className="flex gap-1 justify-center">
              {Object.keys(COLOR_THEMES).map((color) => (
                <div
                  key={color}
                  className={`w-4 h-4 rounded-full cursor-pointer border-2 ${
                    task.backgroundColor === color ? "border-white scale-110" : "border-transparent"
                  } hover:scale-110 transition-all duration-200`}
                  style={{
                    background: `linear-gradient(135deg, var(--${color}-600), var(--${color}-800))`,
                  }}
                  onClick={() => handleColorChange(color)}
                  title={`Change to ${color}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className={`flex justify-between items-center ${padding} pt-0`}>
          <div className="flex gap-2">
            <Button
              onClick={() => toggleTimer(task.id)}
              size="sm"
              className={`${
                task.isRunning
                  ? "bg-red-600/80 hover:bg-red-600 text-white"
                  : task.mode === "alarm"
                    ? "bg-purple-600/80 hover:bg-purple-600 text-white"
                    : "bg-green-600/80 hover:bg-green-600 text-white"
              } border-0 shadow-md transition-all duration-200 hover:scale-105 px-${isMobile ? "3" : "4"}`}
            >
              {task.isRunning ? (
                <>
                  <Pause className="w-3 h-3 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  {task.mode === "alarm" ? "Set" : "Start"}
                </>
              )}
            </Button>
            <Button
              onClick={() => resetTimer(task.id)}
              size="sm"
              variant="outline"
              className={`bg-black/20 hover:bg-black/30 text-white border-white/20 hover:border-white/30 transition-all duration-200 hover:scale-105 px-${isMobile ? "3" : "4"}`}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>

          <div className={`text-xs ${theme.accent} transition-all duration-200`}>
            {task.isCompleted
              ? isMobile
                ? "🎉 Done!"
                : "🎉 Completed!"
              : task.isRunning
                ? isMobile
                  ? task.mode === "alarm"
                    ? "⏰ Set"
                    : "⏱️ Running"
                  : task.mode === "alarm"
                    ? "⏰ Alarm Set"
                    : "⏱️ Running..."
                : isMobile
                  ? "⏸️ Ready"
                  : "⏸️ Ready"}
          </div>
        </div>

        {/* Add tag input - Desktop only */}
        {!isMobile && (
          <div className="px-4 pb-4">
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                placeholder="Add tag..."
                className="bg-black/20 border-white/20 text-white text-xs h-6 transition-all duration-200"
              />
              <Button
                size="sm"
                onClick={handleAddTag}
                className="h-6 px-2 text-xs bg-black/20 hover:bg-black/30 transition-all duration-200 hover:scale-105"
              >
                +
              </Button>
            </div>
          </div>
        )}

        {/* Mobile delete button - visible when swiping */}
        {isMobile && isSwipingLeft && (
          <div className="absolute inset-y-0 right-0 flex items-center justify-center w-16 bg-red-500/80 rounded-r-xl">
            <Trash2 className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Sheet open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={`${isMobile ? "h-auto" : "w-80"} bg-slate-900/90 backdrop-blur-md border-slate-700`}
        >
          <div className="flex flex-col items-center justify-center h-full p-6 space-y-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white text-center">Delete Task?</h3>
            <p className="text-slate-300 text-center">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full mt-4">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1 bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <TimePickerModal
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onTimeSelect={handleTimeSelect}
        currentTime={task.time}
      />

      <AlarmTimePickerModal
        isOpen={showAlarmPicker}
        onClose={() => setShowAlarmPicker(false)}
        onTimeSelect={handleAlarmSelect}
        currentTime={task.alarmTime}
        currentDate={task.alarmDate}
      />
    </>
  )
}

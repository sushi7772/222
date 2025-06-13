"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useNotes, type Task } from "@/components/context/notes-context"
import Timer from "@/components/mobile-timer"
import TimePickerModal from "@/components/mobile-time-picker-modal"
import AttachmentPanel from "@/components/mobile-attachment-panel"
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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MobileNoteCardProps {
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

export default function MobileNoteCard({ task }: MobileNoteCardProps) {
  const { updatePosition, updateTask, toggleTimer, resetTimer, deleteTask, setCustomTime, addAttachment } = useNotes()
  const { toast } = useToast()

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [newTag, setNewTag] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const titleInputRef = useRef<HTMLInputElement>(null)
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const touchStartTime = useRef(0)
  const lastTouchEnd = useRef(0)

  const theme = COLOR_THEMES[task.backgroundColor as keyof typeof COLOR_THEMES] || COLOR_THEMES.amber

  // Touch handling for mobile drag
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isEditingTitle || isEditingDescription) return

      touchStartTime.current = Date.now()
      const touch = e.touches[0]
      const rect = cardRef.current?.getBoundingClientRect()

      if (rect) {
        const offsetX = touch.clientX - rect.left
        const offsetY = touch.clientY - rect.top
        setDragOffset({ x: offsetX, y: offsetY })
        dragStartPos.current = { x: task.position.x, y: task.position.y }
      }

      // Prevent default to avoid scrolling
      e.preventDefault()
    },
    [isEditingTitle, isEditingDescription, task.position],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging && Date.now() - touchStartTime.current > 150) {
        setIsDragging(true)
      }

      if (isDragging) {
        const touch = e.touches[0]
        const newX = Math.max(10, Math.min(window.innerWidth - 330, touch.clientX - dragOffset.x))
        const newY = Math.max(80, Math.min(window.innerHeight - 400, touch.clientY - dragOffset.y))

        if (cardRef.current) {
          cardRef.current.style.left = `${newX}px`
          cardRef.current.style.top = `${newY}px`
        }

        e.preventDefault()
      }
    },
    [isDragging, dragOffset],
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touchDuration = Date.now() - touchStartTime.current
      const timeSinceLastTouch = Date.now() - lastTouchEnd.current

      // Handle double tap
      if (touchDuration < 300 && timeSinceLastTouch < 300) {
        setIsEditingTitle(true)
        e.preventDefault()
        return
      }

      lastTouchEnd.current = Date.now()

      if (isDragging) {
        const touch = e.changedTouches[0]
        const newX = Math.max(10, Math.min(window.innerWidth - 330, touch.clientX - dragOffset.x))
        const newY = Math.max(80, Math.min(window.innerHeight - 400, touch.clientY - dragOffset.y))

        if (Math.abs(newX - dragStartPos.current.x) > 5 || Math.abs(newY - dragStartPos.current.y) > 5) {
          updatePosition(task.id, newX, newY)
        } else if (cardRef.current) {
          cardRef.current.style.left = `${task.position.x}px`
          cardRef.current.style.top = `${task.position.y}px`
        }

        setIsDragging(false)
      }
    },
    [isDragging, dragOffset, task.position, task.id, updatePosition],
  )

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
    if (window.confirm("Are you sure you want to delete this task?")) {
      await deleteTask(task.id)
    }
  }

  const handleTimeSelect = (time: string) => {
    setCustomTime(task.id, time)
    setShowTimePicker(false)
    toast({
      title: "Timer updated",
      description: `Timer set to ${time}`,
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      addAttachment(task.id, file)
      setShowOptions(false)
    }
  }

  const handleColorChange = async (color: string) => {
    await updateTask(task.id, { backgroundColor: color })
    setShowOptions(false)
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

  return (
    <>
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`absolute w-80 sm:w-80 bg-gradient-to-br ${theme.bg} backdrop-blur-sm rounded-xl shadow-2xl border ${theme.border} transition-all duration-200 hover:${theme.glow} hover:shadow-2xl ${
          isDragging ? "opacity-90 scale-105 rotate-1 z-50" : "opacity-100 hover:scale-[1.02]"
        } ${task.isCompleted ? "ring-2 ring-green-500/50" : ""} touch-none select-none`}
        style={{
          left: task.position.x,
          top: task.position.y,
          transform: isDragging ? "rotate(2deg) scale(1.05)" : "none",
          transition: isDragging ? "none" : "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: isDragging ? "transform" : "auto",
        }}
      >
        {/* Header with controls */}
        <div
          className={`flex justify-between items-center p-3 sm:p-4 border-b ${theme.border.replace("border-", "border-b-")}`}
        >
          <div className="flex items-center gap-2">
            <span className={`${theme.accent} text-xs font-mono bg-black/20 px-2 py-1 rounded`}>#{task.id}</span>
            {task.telegramNotifications && <Bell className="w-3 h-3 text-green-400" />}
          </div>

          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowTimePicker(true)}
              className={`h-8 w-8 p-0 ${theme.text} hover:text-white hover:bg-black/20 transition-all duration-200`}
            >
              <Clock className="w-4 h-4" />
            </Button>

            {/* Options Sheet */}
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
              <SheetContent side="bottom" className="h-[80vh] bg-slate-900 border-slate-700">
                <SheetHeader>
                  <SheetTitle className="text-white">Task Options</SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6 pb-6">
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
                      onClick={handleDelete}
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
          </div>
        </div>

        {/* Title */}
        <div className="px-3 sm:px-4 pt-3">
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => handleKeyPress(e, "title")}
              className="bg-black/20 border-white/20 text-white font-semibold text-lg h-10 px-3 transition-all duration-200"
              placeholder="Task title"
            />
          ) : (
            <h3
              className={`${theme.text} font-semibold text-lg cursor-pointer hover:text-white transition-all duration-200 border-b border-transparent hover:border-white/50 pb-1`}
              onDoubleClick={() => setIsEditingTitle(true)}
              title="Double tap to edit title"
            >
              {task.title}
            </h3>
          )}
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="px-3 sm:px-4 pt-2">
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs bg-black/20 text-white">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-black/20 text-white">
                  +{task.tags.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="px-3 sm:px-4 pt-2">
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
              onDoubleClick={() => setIsEditingDescription(true)}
              title="Double tap to edit description"
            >
              {task.description}
            </p>
          )}
        </div>

        {/* Attachments Panel */}
        {showAttachments && (
          <div className="px-3 sm:px-4 pt-2">
            <AttachmentPanel task={task} />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAttachments(false)}
              className="w-full mt-2 bg-black/20 border-white/20 text-white hover:bg-black/30 transition-all duration-200"
            >
              Hide Attachments
            </Button>
          </div>
        )}

        {/* Timer */}
        <div className="flex justify-center py-4">
          <div
            className="cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={() => setShowTimePicker(true)}
            title="Tap to set custom time"
          >
            <Timer task={task} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center p-3 sm:p-4 pt-0">
          <div className="flex gap-2">
            <Button
              onClick={() => toggleTimer(task.id)}
              size="sm"
              className={`${
                task.isRunning
                  ? "bg-red-600/80 hover:bg-red-600 text-white"
                  : "bg-green-600/80 hover:bg-green-600 text-white"
              } border-0 shadow-md transition-all duration-200 hover:scale-105 px-3 sm:px-4`}
            >
              {task.isRunning ? (
                <>
                  <Pause className="w-3 h-3 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Start
                </>
              )}
            </Button>
            <Button
              onClick={() => resetTimer(task.id)}
              size="sm"
              variant="outline"
              className="bg-black/20 hover:bg-black/30 text-white border-white/20 hover:border-white/30 transition-all duration-200 hover:scale-105 px-3"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>

          <div className={`text-xs ${theme.accent} transition-all duration-200`}>
            {task.isCompleted ? "🎉 Done!" : task.isRunning ? "⏱️ Running" : "⏸️ Ready"}
          </div>
        </div>
      </div>

      <TimePickerModal
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onTimeSelect={handleTimeSelect}
        currentTime={task.time}
      />
    </>
  )
}

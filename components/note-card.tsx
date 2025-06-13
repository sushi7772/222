"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useNotes, type Task } from "@/components/context/notes-context"
import Timer from "@/components/timer"
import TimePickerModal from "@/components/time-picker-modal"
import AttachmentPanel from "@/components/attachment-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Play, Pause, RotateCcw, Trash2, Clock, Paperclip, Bell, BellOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NoteCardProps {
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

export default function NoteCard({ task }: NoteCardProps) {
  const { updatePosition, updateTask, toggleTimer, resetTimer, deleteTask, setCustomTime, addAttachment } = useNotes()
  const { toast } = useToast()

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
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

  const theme = COLOR_THEMES[task.backgroundColor as keyof typeof COLOR_THEMES] || COLOR_THEMES.amber

  // Smooth dragging with native HTML5 drag API
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (isEditingTitle || isEditingDescription) {
        e.preventDefault()
        return
      }

      setIsDragging(true)

      // Store initial mouse position relative to the card
      const rect = cardRef.current?.getBoundingClientRect()
      if (rect) {
        const offsetX = e.clientX - rect.left
        const offsetY = e.clientY - rect.top
        setDragOffset({ x: offsetX, y: offsetY })
        dragStartPos.current = { x: task.position.x, y: task.position.y }
      }

      // Create a transparent drag image to hide the default ghost
      const dragImage = new Image()
      dragImage.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="
      e.dataTransfer.setDragImage(dragImage, 0, 0)
      e.dataTransfer.effectAllowed = "move"
    },
    [isEditingTitle, isEditingDescription, task.position],
  )

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      if (!isDragging || (e.clientX === 0 && e.clientY === 0)) return

      // Calculate new position based on mouse position and offset
      const newX = Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x))
      const newY = Math.max(80, Math.min(window.innerHeight - 400, e.clientY - dragOffset.y))

      // Update position immediately for smooth visual feedback
      if (cardRef.current) {
        cardRef.current.style.left = `${newX}px`
        cardRef.current.style.top = `${newY}px`
      }
    },
    [isDragging, dragOffset],
  )

  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      setIsDragging(false)

      if (e.clientX === 0 && e.clientY === 0) {
        // Drag was cancelled, reset position
        if (cardRef.current) {
          cardRef.current.style.left = `${task.position.x}px`
          cardRef.current.style.top = `${task.position.y}px`
        }
        return
      }

      // Calculate final position
      const newX = Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x))
      const newY = Math.max(80, Math.min(window.innerHeight - 400, e.clientY - dragOffset.y))

      // Only update if position changed significantly
      if (Math.abs(newX - dragStartPos.current.x) > 5 || Math.abs(newY - dragStartPos.current.y) > 5) {
        updatePosition(task.id, newX, newY)
      } else {
        // Reset to original position if no significant movement
        if (cardRef.current) {
          cardRef.current.style.left = `${task.position.x}px`
          cardRef.current.style.top = `${task.position.y}px`
        }
      }
    },
    [dragOffset, task.position, task.id, updatePosition],
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
    }
  }

  const handleColorChange = async (color: string) => {
    await updateTask(task.id, { backgroundColor: color })
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
        draggable={!isEditingTitle && !isEditingDescription}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className={`absolute w-80 bg-gradient-to-br ${theme.bg} backdrop-blur-sm rounded-xl shadow-2xl border ${theme.border} transition-all duration-200 hover:${theme.glow} hover:shadow-2xl ${
          isDragging
            ? "opacity-90 scale-105 rotate-1 z-50 cursor-grabbing"
            : "opacity-100 hover:scale-[1.02] cursor-grab"
        } ${task.isCompleted ? "ring-2 ring-green-500/50" : ""}`}
        style={{
          left: task.position.x,
          top: task.position.y,
          transform: isDragging ? "rotate(2deg) scale(1.05)" : "none",
          transition: isDragging ? "none" : "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: isDragging ? "transform" : "auto",
        }}
      >
        {/* Header with traffic lights and controls */}
        <div
          className={`flex justify-between items-center p-4 border-b ${theme.border.replace("border-", "border-b-")} cursor-grab`}
          onMouseDown={(e) => {
            // Prevent text selection during drag
            e.preventDefault()
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div
                className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-400 cursor-pointer transition-all duration-200 hover:scale-110"
                onClick={handleDelete}
                title="Delete task"
              />
              <div
                className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-400 cursor-pointer transition-all duration-200 hover:scale-110"
                onClick={() => setShowTimePicker(true)}
                title="Set timer"
              />
              <div
                className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-400 cursor-pointer transition-all duration-200 hover:scale-110"
                onClick={() => resetTimer(task.id)}
                title="Reset timer"
              />
            </div>
            <span className={`${theme.accent} text-xs font-mono bg-black/20 px-2 py-1 rounded`}>#{task.id}</span>
          </div>
          <div className="flex gap-1">
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
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowTimePicker(true)}
              className={`h-6 w-6 p-0 ${theme.text} hover:text-white hover:bg-black/20 transition-all duration-200`}
            >
              <Clock className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className={`h-6 w-6 p-0 ${theme.text} hover:text-red-400 hover:bg-red-900/30 transition-all duration-200`}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Telegram notification checkbox */}
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

        {/* Title */}
        <div className="px-4 pt-3">
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => handleKeyPress(e, "title")}
              className="bg-black/20 border-white/20 text-white font-semibold text-lg h-8 px-2 transition-all duration-200"
              placeholder="Task title"
            />
          ) : (
            <h3
              className={`${theme.text} font-semibold text-lg cursor-pointer hover:text-white transition-all duration-200 border-b border-transparent hover:border-white/50 pb-1`}
              onClick={() => setIsEditingTitle(true)}
              title="Click to edit title"
            >
              {task.title}
            </h3>
          )}
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="px-4 pt-2">
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs bg-black/20 text-white hover:bg-black/30 cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="px-4 pt-2">
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
              onClick={() => setIsEditingDescription(true)}
              title="Click to edit description"
            >
              {task.description}
            </p>
          )}
        </div>

        {/* Attachments Panel */}
        {showAttachments && (
          <div className="px-4 pt-2">
            <AttachmentPanel task={task} />
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
          </div>
        )}

        {/* Timer */}
        <div className="flex justify-center py-4">
          <div
            className="cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={() => setShowTimePicker(true)}
            title="Click to set custom time"
          >
            <Timer task={task} />
          </div>
        </div>

        {/* Color picker */}
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

        {/* Action buttons */}
        <div className="flex justify-between items-center p-4 pt-0">
          <div className="flex gap-2">
            <Button
              onClick={() => toggleTimer(task.id)}
              size="sm"
              className={`${
                task.isRunning
                  ? "bg-red-600/80 hover:bg-red-600 text-white"
                  : "bg-green-600/80 hover:bg-green-600 text-white"
              } border-0 shadow-md transition-all duration-200 hover:scale-105`}
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
              className="bg-black/20 hover:bg-black/30 text-white border-white/20 hover:border-white/30 transition-all duration-200 hover:scale-105"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>

          <div className={`text-xs ${theme.accent} transition-all duration-200`}>
            {task.isCompleted ? "🎉 Completed!" : task.isRunning ? "⏱️ Running..." : "⏸️ Ready"}
          </div>
        </div>

        {/* Add tag input */}
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

"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { saveToStorage, loadFromStorage } from "@/lib/storage"
import { apiClient } from "@/lib/api"
import { sendTelegramNotification } from "@/lib/telegram"
import { getSessionId, generateNewSession } from "@/lib/session"
import { useToast } from "@/hooks/use-toast"
import { debounce } from "lodash"

export interface TaskAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
}

export interface TelegramSettings {
  enabled: boolean
  chatId: string
  botToken: string
  notifyOnComplete: boolean
  notifyOnStart: boolean
  customMessage: string
}

export interface TaskLink {
  id: string
  fromTaskId: number
  toTaskId: number
  createdAt: string
  linkType: "sequential" | "parallel" | "conditional"
}

export interface Task {
  id: number
  title: string
  description: string
  time: string
  originalTime: string
  position: { x: number; y: number }
  isRunning: boolean
  isCompleted: boolean
  createdAt: string
  attachments: TaskAttachment[]
  backgroundColor?: string
  tags: string[]
  telegramNotifications: boolean
  lastUpdated: string
  mode: "timer" | "alarm"
  alarmTime?: string
  alarmDate?: string
  linkedTo: number[]
  linkedFrom: number[]
  chainPosition?: number
  isChainActive?: boolean
  completionCount?: number
}

interface NotesContextType {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  links: TaskLink[]
  setLinks: React.Dispatch<React.SetStateAction<TaskLink[]>>
  telegramSettings: TelegramSettings
  setTelegramSettings: React.Dispatch<React.SetStateAction<TelegramSettings>>
  sessionId: string
  linkingMode: boolean
  setLinkingMode: React.Dispatch<React.SetStateAction<boolean>>
  selectedTaskForLinking: number | null
  setSelectedTaskForLinking: React.Dispatch<React.SetStateAction<number | null>>
  addTask: () => Promise<void>
  updatePosition: (id: number, x: number, y: number) => void
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: number) => Promise<void>
  clearAllTasks: () => Promise<void>
  toggleTimer: (id: number) => void
  resetTimer: (id: number) => void
  setCustomTime: (id: number, time: string) => void
  setAlarmTime: (id: number, time: string, date?: string) => void
  toggleTaskMode: (id: number) => void
  linkTasks: (fromId: number, toId: number, linkType?: "sequential" | "parallel" | "conditional") => void
  unlinkTasks: (fromId: number, toId: number) => void
  startChain: (startTaskId: number) => void
  resetChain: (chainTasks: number[]) => void
  addAttachment: (taskId: number, file: File) => Promise<void>
  removeAttachment: (taskId: number, attachmentId: string) => Promise<void>
  exportTasks: () => Promise<void>
  importTasks: (file: File) => Promise<void>
  saveTelegramSettings: (settings: TelegramSettings) => Promise<void>
  createNewSession: () => void
  loading: boolean
  getTaskChain: (taskId: number) => Task[]
  getChainProgress: (chainTasks: Task[]) => number
}

const NotesContext = createContext<NotesContextType | null>(null)

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [links, setLinks] = useState<TaskLink[]>([])
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>({
    enabled: false,
    chatId: "",
    botToken: "",
    notifyOnComplete: true,
    notifyOnStart: false,
    customMessage: "Timer completed for: {title}",
  })
  const [loading, setLoading] = useState(true)
  const [sessionId, setSessionId] = useState("")
  const [linkingMode, setLinkingMode] = useState(false)
  const [selectedTaskForLinking, setSelectedTaskForLinking] = useState<number | null>(null)
  const { toast } = useToast()

  const timerIntervals = useRef<Map<number, NodeJS.Timeout>>(new Map())
  const alarmCheckers = useRef<Map<number, NodeJS.Timeout>>(new Map())
  const chainTimeouts = useRef<Map<number, NodeJS.Timeout>>(new Map())
  const positionUpdateTimeouts = useRef<Map<number, NodeJS.Timeout>>(new Map())

  const debouncedUpdate = useCallback(
    debounce((id: number, updates: Partial<Task>) => {
      apiClient.updateTask(id, updates).catch((error) => {
        console.error("Failed to update task:", error)
        toast({
          title: "Update saved locally",
          description: "Changes saved locally. Will sync when online.",
        })
      })
    }, 1000),
    []
  )

  useEffect(() => {
    const currentSessionId = getSessionId()
    setSessionId(currentSessionId)
    console.log("Session initialized:", currentSessionId)
  }, [])

  useEffect(() => {
    if (sessionId) {
      loadTasks()
      loadTelegramSettings()
    }
  }, [sessionId])

  useEffect(() => {
    if (!loading && tasks.length >= 0 && sessionId) {
      saveToStorage("notes-playground-tasks", tasks)
      updateLinksFromTasks()
    }
  }, [tasks, loading, sessionId])

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const updateLinksFromTasks = () => {
    const newLinks: TaskLink[] = []
    tasks.forEach((task) => {
      task.linkedTo.forEach((toTaskId) => {
        const linkId = String(task.id) + "-" + String(toTaskId)
        newLinks.push({
          id: linkId,
          fromTaskId: task.id,
          toTaskId,
          createdAt: new Date().toISOString(),
          linkType: "sequential",
        })
      })
    })
    setLinks(newLinks)
  }

  const getTaskChain = useCallback(
    (taskId: number): Task[] => {
      const visited = new Set<number>()
      const chain: Task[] = []

      const buildChain = (currentId: number) => {
        if (visited.has(currentId)) return
        visited.add(currentId)

        const task = tasks.find((t) => t.id === currentId)
        if (task) {
          chain.push(task)
          task.linkedTo.forEach((linkedId) => buildChain(linkedId))
        }
      }

      buildChain(taskId)
      return chain.sort((a, b) => (a.chainPosition || 0) - (b.chainPosition || 0))
    },
    [tasks],
  )

  const getChainProgress = useCallback((chainTasks: Task[]): number => {
    if (chainTasks.length === 0) return 0
    const completedTasks = chainTasks.filter((task) => task.isCompleted).length
    return Math.round((completedTasks / chainTasks.length) * 100)
  }, [])

  useEffect(() => {
    const cleanup = () => {
      timerIntervals.current.forEach((interval) => clearInterval(interval))
      timerIntervals.current.clear()
      alarmCheckers.current.forEach((checker) => clearInterval(checker))
      alarmCheckers.current.clear()
    }

    cleanup()

    tasks.forEach((task) => {
      if (task.mode === "timer" && task.isRunning && !task.isCompleted) {
        const interval = setInterval(() => {
          setTasks((prevTasks) => {
            return prevTasks.map((prevTask) => {
              if (prevTask.id !== task.id || !prevTask.isRunning) return prevTask

              const timeParts = prevTask.time.split(":")
              const min = Number.parseInt(timeParts[0], 10)
              const sec = Number.parseInt(timeParts[1], 10)

              if (min === 0 && sec === 0) {
                handleTaskComplete(prevTask)
                return {
                  ...prevTask,
                  isRunning: false,
                  isCompleted: true,
                  lastUpdated: new Date().toISOString(),
                  completionCount: (prevTask.completionCount || 0) + 1,
                }
              }

              const newSec = sec === 0 ? 59 : sec - 1
              const newMin = sec === 0 ? min - 1 : min
              const newTime = String(newMin).padStart(2, "0") + ":" + String(newSec).padStart(2, "0")

              return {
                ...prevTask,
                time: newTime,
                lastUpdated: new Date().toISOString(),
              }
            })
          })
        }, 1000)

        timerIntervals.current.set(task.id, interval)
      }

      if (task.mode === "alarm" && task.alarmTime && !task.isCompleted) {
        const checker = setInterval(() => {
          const now = new Date()
          const hours = now.getHours()
          const minutes = now.getMinutes()
          const currentTime = String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0")
          const currentDate = now.toISOString().split("T")[0]

          const targetDate = task.alarmDate || currentDate
          const isToday = targetDate === currentDate
          const isAlarmTime = currentTime === task.alarmTime

          if (isToday && isAlarmTime) {
            handleTaskComplete(task)
          }
        }, 1000)

        alarmCheckers.current.set(task.id, checker)
      }
    })

    return cleanup
  }, [tasks])

  const handleTaskComplete = async (task: Task) => {
    const interval = timerIntervals.current.get(task.id)
    if (interval) {
      clearInterval(interval)
      timerIntervals.current.delete(task.id)
    }
    const checker = alarmCheckers.current.get(task.id)
    if (checker) {
      clearInterval(checker)
      alarmCheckers.current.delete(task.id)
    }

    // Enhanced completion notification
    if (
      task.mode === "alarm" &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification("Alarm: " + task.title, {
        body: task.description || "Your alarm is ringing!",
        icon: "/icon-192.png",
        tag: "alarm-" + String(task.id),
      })
    }

    // Telegram notification
    if (task.telegramNotifications && telegramSettings.enabled && telegramSettings.notifyOnComplete) {
      try {
        const message = telegramSettings.customMessage.replace("{title}", task.title)
        await sendTelegramNotification(telegramSettings.chatId, message, telegramSettings.botToken)
        const modeText = task.mode === "alarm" ? "Alarm" : "Timer"
        toast({
          title: modeText + " completed!",
          description: "Telegram notification sent successfully!",
        })
      } catch (error) {
        console.error("Failed to send Telegram notification:", error)
        const modeText = task.mode === "alarm" ? "Alarm" : "Timer"
        toast({
          title: modeText + " completed!",
          description: "Failed to send Telegram notification.",
          variant: "destructive",
        })
      }
    } else {
      const modeText = task.mode === "alarm" ? "Alarm" : "Timer"
      toast({
        title: modeText + " completed!",
        description: task.title + " has finished.",
      })
    }

    // Enhanced chain reaction system
    if (task.linkedTo.length > 0) {
      const linkedTasks = task.linkedTo.map((id) => tasks.find((t) => t.id === id)).filter(Boolean) as Task[]

      // Sequential chain activation with delay
      linkedTasks.forEach((linkedTask, index) => {
        const delay = index * 1000 // 1 second delay between each activation

        const timeout = setTimeout(() => {
          setTasks((prevTasks) =>
            prevTasks.map((prevTask) =>
              prevTask.id === linkedTask.id && !prevTask.isRunning && !prevTask.isCompleted
                ? {
                    ...prevTask,
                    isRunning: true,
                    isChainActive: true,
                    chainPosition: index + 1,
                    lastUpdated: new Date().toISOString(),
                  }
                : prevTask,
            ),
          )

          // Enhanced notification for chain activation
          toast({
            title: "Chain Activated! 🔗",
            description: "Task '" + linkedTask.title + "' started automatically",
          })
        }, delay)

        chainTimeouts.current.set(linkedTask.id, timeout)
      })

      // Overall chain notification
      toast({
        title: "Chain Reaction Started! ⚡",
        description: String(linkedTasks.length) + " connected task(s) will start in sequence.",
      })
    }

    try {
      await apiClient.updateTask(task.id, {
        isRunning: false,
        isCompleted: true,
        completionCount: (task.completionCount || 0) + 1,
      })
    } catch (error) {
      console.error("Failed to update completed task:", error)
    }
  }

  const startChain = useCallback(
    (startTaskId: number) => {
      const chainTasks = getTaskChain(startTaskId)

      // Reset all tasks in the chain
      setTasks((prev) =>
        prev.map((task) => {
          if (chainTasks.some((ct) => ct.id === task.id)) {
            return {
              ...task,
              isRunning: false,
              isCompleted: false,
              time: task.originalTime,
              isChainActive: true,
              chainPosition: chainTasks.findIndex((ct) => ct.id === task.id) + 1,
              lastUpdated: new Date().toISOString(),
            }
          }
          return task
        }),
      )

      // Start the first task
      setTimeout(() => {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === startTaskId
              ? {
                  ...task,
                  isRunning: true,
                  lastUpdated: new Date().toISOString(),
                }
              : task,
          ),
        )
      }, 500)

      toast({
        title: "Chain Started! 🚀",
        description: "Workflow with " + String(chainTasks.length) + " tasks has begun.",
      })
    },
    [getTaskChain],
  )

  const resetChain = useCallback((chainTaskIds: number[]) => {
    // Clear any pending chain timeouts
    chainTaskIds.forEach((id) => {
      const timeout = chainTimeouts.current.get(id)
      if (timeout) {
        clearTimeout(timeout)
        chainTimeouts.current.delete(id)
      }
    })

    setTasks((prev) =>
      prev.map((task) => {
        if (chainTaskIds.includes(task.id)) {
          return {
            ...task,
            isRunning: false,
            isCompleted: false,
            time: task.originalTime,
            isChainActive: false,
            chainPosition: undefined,
            lastUpdated: new Date().toISOString(),
          }
        }
        return task
      }),
    )

    toast({
      title: "Chain Reset",
      description: "All tasks in the workflow have been reset.",
    })
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const apiTasks = await apiClient.fetchTasks()

      if (apiTasks.length > 0) {
        console.log("Loaded " + String(apiTasks.length) + " tasks from API for session " + sessionId)
        setTasks(apiTasks)
      } else {
        const storedTasks = loadFromStorage("notes-playground-tasks", [])
        if (storedTasks.length === 0) {
          const defaultTask: Task = {
            id: Date.now(),
            title: "Welcome to Notes Playground",
            description: "Click to edit description, drag to move, attach files! This is your private session.",
            time: "05:00",
            originalTime: "05:00",
            position: { x: 150, y: 150 },
            isRunning: false,
            isCompleted: false,
            createdAt: new Date().toISOString(),
            attachments: [],
            backgroundColor: "amber",
            tags: ["welcome", "private"],
            telegramNotifications: false,
            lastUpdated: new Date().toISOString(),
            mode: "timer",
            linkedTo: [],
            linkedFrom: [],
            completionCount: 0,
          }
          console.log("Creating default task for session " + sessionId + ":", defaultTask.id)
          setTasks([defaultTask])
          try {
            await apiClient.createTask(defaultTask)
            console.log("Default task synced to API")
          } catch (error) {
            console.error("Failed to sync default task:", error)
          }
        } else {
          console.log("Loaded " + String(storedTasks.length) + " tasks from localStorage for session " + sessionId)
          const migratedTasks = storedTasks.map((task) => ({
            ...task,
            mode: task.mode || "timer",
            linkedTo: task.linkedTo || [],
            linkedFrom: task.linkedFrom || [],
            completionCount: task.completionCount || 0,
          }))
          setTasks(migratedTasks)
          try {
            await apiClient.syncTasks(migratedTasks)
            console.log("Stored tasks synced to API")
          } catch (error) {
            console.error("Failed to sync stored tasks:", error)
          }
        }
      }
    } catch (error) {
      console.error("Failed to load tasks:", error)
      const storedTasks = loadFromStorage("notes-playground-tasks", [])
      setTasks(storedTasks)
    } finally {
      setLoading(false)
    }
  }

  const loadTelegramSettings = () => {
    const stored = loadFromStorage("telegram-settings", telegramSettings)
    setTelegramSettings(stored)
  }

  const addTask = async () => {
    const colors = ["amber", "blue", "green", "purple", "pink", "indigo"]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const newTask: Task = {
      id: Date.now(),
      title: "New Task",
      description: "Click to add description",
      time: "05:00",
      originalTime: "05:00",
      position: {
        x: Math.random() * (window.innerWidth - 400) + 50,
        y: Math.random() * (window.innerHeight - 400) + 150,
      },
      isRunning: false,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      attachments: [],
      backgroundColor: randomColor,
      tags: [],
      telegramNotifications: false,
      lastUpdated: new Date().toISOString(),
      mode: "timer",
      linkedTo: [],
      linkedFrom: [],
      completionCount: 0,
    }

    console.log("Adding new task for session " + sessionId + ":", newTask.id)

    setTasks((prev) => [...prev, newTask])

    try {
      await apiClient.createTask(newTask)
      console.log("New task synced to API")
      toast({
        title: "Task created",
        description: "New task has been added successfully.",
      })
    } catch (error) {
      console.error("Failed to sync new task:", error)
      toast({
        title: "Task created locally",
        description: "Task saved locally. Will sync when online.",
      })
    }
  }

  const updatePosition = useCallback((id: number, x: number, y: number) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, position: { x, y } } : task)))

    const existingTimeout = positionUpdateTimeouts.current.get(id)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    const timeout = setTimeout(() => {
      debouncedUpdate(id, { position: { x, y } })
      positionUpdateTimeouts.current.delete(id)
    }, 1000)

    positionUpdateTimeouts.current.set(id, timeout)
  }, [debouncedUpdate])

  const updateTask = async (id: number, updates: Partial<Task>) => {
    const updatedTask = tasks.find((t) => t.id === id)
    if (!updatedTask) return

    const newTask = { ...updatedTask, ...updates, lastUpdated: new Date().toISOString() }

    setTasks((prev) => prev.map((task) => (task.id === id ? newTask : task)))

    try {
      await apiClient.updateTask(id, newTask)
    } catch (error) {
      console.error("Failed to update task:", error)
      toast({
        title: "Update saved locally",
        description: "Changes saved locally. Will sync when online.",
      })
    }
  }

  const deleteTask = async (id: number) => {
    console.log("Context: Attempting to delete task " + String(id) + " for session " + sessionId)

    const interval = timerIntervals.current.get(id)
    if (interval) {
      clearInterval(interval)
      timerIntervals.current.delete(id)
    }
    const checker = alarmCheckers.current.get(id)
    if (checker) {
      clearInterval(checker)
      alarmCheckers.current.delete(id)
    }
    const timeout = chainTimeouts.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      chainTimeouts.current.delete(id)
    }

    setTasks((prev) =>
      prev.map((task) => ({
        ...task,
        linkedTo: task.linkedTo.filter((linkedId) => linkedId !== id),
        linkedFrom: task.linkedFrom.filter((linkedId) => linkedId !== id),
      })),
    )

    const taskToDelete = tasks.find((t) => t.id === id)
    if (!taskToDelete) {
      console.log("Context: Task " + String(id) + " not found in local state")
      toast({
        title: "Task not found",
        description: "The task you're trying to delete doesn't exist.",
        variant: "destructive",
      })
      return
    }

    console.log("Context: Found task " + String(id) + " in local state, proceeding with deletion")

    try {
      await apiClient.deleteTask(id)
      console.log("Context: API delete successful for task " + String(id))

      setTasks((prev) => prev.filter((task) => task.id !== id))

      toast({
        title: "Task deleted",
        description: "Task has been removed successfully.",
      })
    } catch (error) {
      console.error("Context: Failed to delete task via API:", error)

      setTasks((prev) => prev.filter((task) => task.id !== id))

      toast({
        title: "Task deleted locally",
        description: "Task removed locally. Will sync when online.",
      })
    }
  }

  const clearAllTasks = async () => {
    console.log("Context: Attempting to clear all tasks for session " + sessionId)

    timerIntervals.current.forEach((interval) => clearInterval(interval))
    timerIntervals.current.clear()
    alarmCheckers.current.forEach((checker) => clearInterval(checker))
    alarmCheckers.current.clear()
    chainTimeouts.current.forEach((timeout) => clearTimeout(timeout))
    chainTimeouts.current.clear()

    try {
      await apiClient.clearAllTasks()
      console.log("Context: API clear all successful for session " + sessionId)

      setTasks([])
      setLinks([])

      toast({
        title: "All tasks cleared",
        description: "All your notes have been removed successfully.",
      })
    } catch (error) {
      console.error("Context: Failed to clear all tasks via API:", error)

      setTasks([])
      setLinks([])

      toast({
        title: "Tasks cleared locally",
        description: "All tasks removed locally. Will sync when online.",
      })
    }
  }

  const toggleTimer = async (id: number) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    const newRunningState = !task.isRunning

    if (newRunningState && task.telegramNotifications && telegramSettings.enabled && telegramSettings.notifyOnStart) {
      try {
        const modeText = task.mode === "alarm" ? "Alarm" : "Timer"
        await sendTelegramNotification(
          telegramSettings.chatId,
          modeText + " started for: " + task.title,
          telegramSettings.botToken,
        )
      } catch (error) {
        console.error("Failed to send start notification:", error)
      }
    }

    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, isRunning: newRunningState } : task)))

    try {
      await apiClient.updateTask(id, { isRunning: newRunningState })
    } catch (error) {
      console.error("Failed to update timer state:", error)
    }
  }

  const resetTimer = (id: number) => {
    const interval = timerIntervals.current.get(id)
    if (interval) {
      clearInterval(interval)
      timerIntervals.current.delete(id)
    }
    const checker = alarmCheckers.current.get(id)
    if (checker) {
      clearInterval(checker)
      alarmCheckers.current.delete(id)
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              time: task.originalTime,
              isRunning: false,
              isCompleted: false,
              isChainActive: false,
              chainPosition: undefined,
              lastUpdated: new Date().toISOString(),
            }
          : task,
      ),
    )
  }

  const setCustomTime = (id: number, time: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              time,
              originalTime: time,
              isRunning: false,
              isCompleted: false,
              lastUpdated: new Date().toISOString(),
            }
          : task,
      ),
    )
  }

  const setAlarmTime = (id: number, time: string, date?: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              alarmTime: time,
              alarmDate: date,
              isRunning: false,
              isCompleted: false,
              lastUpdated: new Date().toISOString(),
            }
          : task,
      ),
    )
  }

  const toggleTaskMode = (id: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              mode: task.mode === "timer" ? "alarm" : "timer",
              isRunning: false,
              isCompleted: false,
              lastUpdated: new Date().toISOString(),
            }
          : task,
      ),
    )
  }

  const linkTasks = (
    fromId: number,
    toId: number,
    linkType: "sequential" | "parallel" | "conditional" = "sequential",
  ) => {
    if (fromId === toId) return

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === fromId) {
          return {
            ...task,
            linkedTo: [...new Set([...task.linkedTo, toId])],
            lastUpdated: new Date().toISOString(),
          }
        }
        if (task.id === toId) {
          return {
            ...task,
            linkedFrom: [...new Set([...task.linkedFrom, fromId])],
            lastUpdated: new Date().toISOString(),
          }
        }
        return task
      }),
    )

    toast({
      title: "Tasks linked! 🔗",
      description: "Cards are now connected in a workflow chain.",
    })
  }

  const unlinkTasks = (fromId: number, toId: number) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === fromId) {
          return {
            ...task,
            linkedTo: task.linkedTo.filter((id) => id !== toId),
            lastUpdated: new Date().toISOString(),
          }
        }
        if (task.id === toId) {
          return {
            ...task,
            linkedFrom: task.linkedFrom.filter((id) => id !== fromId),
            lastUpdated: new Date().toISOString(),
          }
        }
        return task
      }),
    )

    toast({
      title: "Tasks unlinked",
      description: "Connection between cards has been removed.",
    })
  }

  const addAttachment = async (taskId: number, file: File) => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("taskId", String(taskId))

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const attachment = await response.json()

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                attachments: [...task.attachments, attachment],
                lastUpdated: new Date().toISOString(),
              }
            : task,
        ),
      )

      toast({
        title: "File uploaded",
        description: file.name + " has been attached successfully.",
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const removeAttachment = async (taskId: number, attachmentId: string) => {
    try {
      await fetch("/api/upload/" + attachmentId, {
        method: "DELETE",
      })

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                attachments: task.attachments.filter((att) => att.id !== attachmentId),
                lastUpdated: new Date().toISOString(),
              }
            : task,
        ),
      )

      toast({
        title: "Attachment removed",
        description: "File has been deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const exportTasks = async () => {
    try {
      const dataStr = JSON.stringify(tasks, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })

      const fileName = "notes-backup-" + sessionId + "-" + new Date().toISOString().split("T")[0] + ".json"
      const formData = new FormData()
      formData.append("file", dataBlob, fileName)

      const response = await fetch("/api/export", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Export failed")

      const { url } = await response.json()

      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export successful",
        description: "Your notes have been exported and downloaded.",
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export notes. Please try again.",
        variant: "destructive",
      })
    }
  }

  const importTasks = async (file: File) => {
    try {
      const text = await file.text()
      const importedTasks = JSON.parse(text) as Task[]

      if (!Array.isArray(importedTasks)) {
        throw new Error("Invalid file format")
      }

      const migratedTasks = importedTasks.map((task) => ({
        ...task,
        mode: task.mode || "timer",
        linkedTo: task.linkedTo || [],
        linkedFrom: task.linkedFrom || [],
        completionCount: task.completionCount || 0,
      }))

      setTasks(migratedTasks)

      try {
        await apiClient.syncTasks(migratedTasks)
      } catch (error) {
        console.error("Failed to sync imported tasks:", error)
      }

      toast({
        title: "Import successful",
        description: "Imported " + String(migratedTasks.length) + " tasks successfully.",
      })
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to import notes. Please check the file format.",
        variant: "destructive",
      })
    }
  }

  const saveTelegramSettings = async (settings: TelegramSettings) => {
    setTelegramSettings(settings)
    saveToStorage("telegram-settings", settings)

    if (settings.enabled && settings.chatId && settings.botToken) {
      try {
        await sendTelegramNotification(settings.chatId, "Telegram notifications are now enabled!", settings.botToken)
        toast({
          title: "Telegram connected",
          description: "Test message sent successfully!",
        })
      } catch (error) {
        toast({
          title: "Connection failed",
          description: "Please check your bot token and chat ID.",
          variant: "destructive",
        })
      }
    }
  }

  const createNewSession = () => {
    const newSessionId = generateNewSession()
    setSessionId(newSessionId)
    setTasks([])
    setLinks([])
    setTelegramSettings({
      enabled: false,
      chatId: "",
      botToken: "",
      notifyOnComplete: true,
      notifyOnStart: false,
      customMessage: "Timer completed for: {title}",
    })

    toast({
      title: "New session created",
      description: "You now have a fresh workspace!",
    })

    console.log("New session created:", newSessionId)
  }

  return (
    <NotesContext.Provider
      value={{
        tasks,
        setTasks,
        links,
        setLinks,
        telegramSettings,
        setTelegramSettings,
        sessionId,
        linkingMode,
        setLinkingMode,
        selectedTaskForLinking,
        setSelectedTaskForLinking,
        addTask,
        updatePosition,
        updateTask,
        deleteTask,
        clearAllTasks,
        toggleTimer,
        resetTimer,
        setCustomTime,
        setAlarmTime,
        toggleTaskMode,
        linkTasks,
        unlinkTasks,
        startChain,
        resetChain,
        addAttachment,
        removeAttachment,
        exportTasks,
        importTasks,
        saveTelegramSettings,
        createNewSession,
        loading,
        getTaskChain,
        getChainProgress,
      }}
    >
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes() {
  const context = useContext(NotesContext)
  if (!context) {
    throw new Error("useNotes must be used within a NotesProvider")
  }
  return context
}

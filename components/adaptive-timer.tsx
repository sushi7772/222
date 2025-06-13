"use client"

import { useState, useEffect, useRef } from "react"
import type { Task } from "@/components/context/notes-context"
import { Clock, Timer } from "lucide-react"

interface AdaptiveTimerProps {
  task: Task
}

export default function AdaptiveTimer({ task }: AdaptiveTimerProps) {
  const [displayTime, setDisplayTime] = useState(task.time)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate progress percentage for timer mode
  const calculateProgress = (currentTime: string, originalTime: string) => {
    const [currentMin, currentSec] = currentTime.split(":").map(Number)
    const [originalMin, originalSec] = originalTime.split(":").map(Number)

    const currentTotal = currentMin * 60 + currentSec
    const originalTotal = originalMin * 60 + originalSec

    if (originalTotal === 0) return 100
    return Math.max(0, Math.min(100, ((originalTotal - currentTotal) / originalTotal) * 100))
  }

  // Calculate progress for alarm mode (time until alarm)
  const calculateAlarmProgress = () => {
    if (!task.alarmTime) return 0

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const [alarmHour, alarmMin] = task.alarmTime.split(":").map(Number)
    const alarmTime = alarmHour * 60 + alarmMin

    // Handle next day alarms
    let timeUntilAlarm = alarmTime - currentTime
    if (timeUntilAlarm < 0) {
      timeUntilAlarm += 24 * 60 // Add 24 hours
    }

    // Progress based on how close we are to the alarm (max 12 hours)
    const maxTime = 12 * 60 // 12 hours in minutes
    return Math.max(0, Math.min(100, ((maxTime - timeUntilAlarm) / maxTime) * 100))
  }

  // Update display time and progress
  useEffect(() => {
    if (task.mode === "timer") {
      setDisplayTime(task.time)
      setProgress(calculateProgress(task.time, task.originalTime))
    } else if (task.mode === "alarm" && task.alarmTime) {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
      setDisplayTime(task.alarmTime)
      setProgress(calculateAlarmProgress())
    }
  }, [task.time, task.originalTime, task.alarmTime, task.mode])

  // Handle timer/alarm running state
  useEffect(() => {
    if (task.isRunning && !task.isCompleted) {
      intervalRef.current = setInterval(() => {
        if (task.mode === "timer") {
          setDisplayTime(task.time)
          setProgress(calculateProgress(task.time, task.originalTime))
        } else if (task.mode === "alarm") {
          setProgress(calculateAlarmProgress())
        }
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [task.isRunning, task.isCompleted, task.time, task.originalTime, task.alarmTime, task.mode])

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const getTimerColor = () => {
    if (task.isCompleted) return "#10b981"
    if (task.mode === "alarm") return "#8b5cf6" // Purple for alarms
    return task.isRunning ? "#f59e0b" : "rgba(245, 158, 11, 0.6)"
  }

  const getDisplayText = () => {
    if (task.mode === "alarm" && task.alarmTime) {
      if (task.isRunning) {
        const now = new Date()
        const [alarmHour, alarmMin] = task.alarmTime.split(":").map(Number)
        const alarmTime = new Date()
        alarmTime.setHours(alarmHour, alarmMin, 0, 0)

        if (alarmTime <= now) {
          alarmTime.setDate(alarmTime.getDate() + 1) // Next day
        }

        const timeUntil = alarmTime.getTime() - now.getTime()
        const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60))
        const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60))

        if (hoursUntil > 0) {
          return `${hoursUntil}h ${minutesUntil}m`
        } else {
          return `${minutesUntil}m`
        }
      } else {
        return task.alarmTime
      }
    }
    return displayTime
  }

  return (
    <div className="relative">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle cx="50" cy="50" r="45" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="3" fill="none" />

          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={getTimerColor()}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Timer/Alarm icon and text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 mb-1">
            {task.mode === "alarm" ? (
              <Clock className="w-3 h-3 text-purple-400" />
            ) : (
              <Timer className="w-3 h-3 text-amber-400" />
            )}
          </div>
          <span
            className={`text-lg font-bold font-mono tracking-wider ${
              task.isCompleted
                ? "text-green-400"
                : task.mode === "alarm"
                  ? "text-purple-100"
                  : task.isRunning
                    ? "text-white"
                    : "text-amber-100"
            }`}
          >
            {getDisplayText()}
          </span>
        </div>

        {/* Completion celebration */}
        {task.isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="absolute w-32 h-32 bg-green-400/10 rounded-full animate-ping"
              style={{ animationDuration: "2s" }}
            />
          </div>
        )}

        {/* Alarm pulse effect when running */}
        {task.mode === "alarm" && task.isRunning && !task.isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="absolute w-32 h-32 bg-purple-400/10 rounded-full animate-pulse"
              style={{ animationDuration: "2s" }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

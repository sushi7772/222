"use client"

import { useState, useEffect, useRef } from "react"
import type { Task } from "@/components/context/notes-context"

interface MobileTimerProps {
  task: Task
}

export default function MobileTimer({ task }: MobileTimerProps) {
  const [displayTime, setDisplayTime] = useState(task.time)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate progress percentage
  const calculateProgress = (currentTime: string, originalTime: string) => {
    const [currentMin, currentSec] = currentTime.split(":").map(Number)
    const [originalMin, originalSec] = originalTime.split(":").map(Number)

    const currentTotal = currentMin * 60 + currentSec
    const originalTotal = originalMin * 60 + originalSec

    if (originalTotal === 0) return 100
    return Math.max(0, Math.min(100, ((originalTotal - currentTotal) / originalTotal) * 100))
  }

  // Update display time and progress
  useEffect(() => {
    setDisplayTime(task.time)
    setProgress(calculateProgress(task.time, task.originalTime))
  }, [task.time, task.originalTime])

  // Handle timer running state
  useEffect(() => {
    if (task.isRunning && !task.isCompleted) {
      intervalRef.current = setInterval(() => {
        setDisplayTime(task.time)
        setProgress(calculateProgress(task.time, task.originalTime))
      }, 100)
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
  }, [task.isRunning, task.isCompleted, task.time, task.originalTime])

  const circumference = 2 * Math.PI * 35 // Smaller radius for mobile
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
        <svg className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90" viewBox="0 0 80 80">
          {/* Background circle */}
          <circle cx="40" cy="40" r="35" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="3" fill="none" />

          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r="35"
            stroke={task.isCompleted ? "#10b981" : task.isRunning ? "#f59e0b" : "rgba(245, 158, 11, 0.6)"}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Timer text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-sm sm:text-base font-bold font-mono tracking-wider ${
              task.isCompleted ? "text-green-400" : task.isRunning ? "text-white" : "text-amber-100"
            }`}
          >
            {displayTime}
          </span>
        </div>

        {/* Completion celebration */}
        {task.isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="absolute w-24 h-24 sm:w-28 sm:h-28 bg-green-400/10 rounded-full animate-ping"
              style={{ animationDuration: "2s" }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

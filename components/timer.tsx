"use client"

import { useState, useEffect, useRef } from "react"
import type { Task } from "@/components/context/notes-context"

interface TimerProps {
  task: Task
}

export default function Timer({ task }: TimerProps) {
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

  // Handle timer running state - simplified, no animations
  useEffect(() => {
    if (task.isRunning && !task.isCompleted) {
      intervalRef.current = setInterval(() => {
        setDisplayTime(task.time)
        setProgress(calculateProgress(task.time, task.originalTime))
      }, 100) // Update display every 100ms for smooth progress
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

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle cx="50" cy="50" r="45" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="3" fill="none" />

          {/* Progress circle - no animations when running */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={task.isCompleted ? "#10b981" : task.isRunning ? "#f59e0b" : "rgba(245, 158, 11, 0.6)"}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Timer text - clean, no animations */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-xl font-bold font-mono tracking-wider ${
              task.isCompleted ? "text-green-400" : task.isRunning ? "text-white" : "text-amber-100"
            }`}
          >
            {displayTime}
          </span>
        </div>

        {/* Only show completion celebration */}
        {task.isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="absolute w-32 h-32 bg-green-400/10 rounded-full animate-ping"
              style={{ animationDuration: "2s" }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

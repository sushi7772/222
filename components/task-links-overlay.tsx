"use client"

import { useNotes } from "@/components/context/notes-context"

export default function TaskLinksOverlay() {
  const { tasks, links } = useNotes()

  if (links.length === 0) return null

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: "100%", height: "100%" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {links.map((link) => {
        const fromTask = tasks.find((t) => t.id === link.fromTaskId)
        const toTask = tasks.find((t) => t.id === link.toTaskId)

        if (!fromTask || !toTask) return null

        // Calculate connection points
        const fromX = fromTask.position.x + 160 // Center of card (320px / 2)
        const fromY = fromTask.position.y + 200 // Bottom of card
        const toX = toTask.position.x + 160 // Center of card
        const toY = toTask.position.y + 50 // Top of card

        // Calculate control points for curved arrow
        const midY = (fromY + toY) / 2
        const controlY = midY + Math.abs(toX - fromX) * 0.3

        const pathData = "M " + fromX + " " + fromY + " Q " + fromX + " " + controlY + " " + toX + " " + toY

        return (
          <g key={link.id}>
            {/* Glow effect */}
            <path d={pathData} stroke="#f59e0b" strokeWidth="3" fill="none" filter="url(#glow)" opacity="0.6" />
            {/* Main arrow */}
            <path
              d={pathData}
              stroke="#f59e0b"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
              className="animate-pulse"
            />
            {/* Connection points */}
            <circle cx={fromX} cy={fromY} r="4" fill="#f59e0b" opacity="0.8" />
            <circle cx={toX} cy={toY} r="4" fill="#f59e0b" opacity="0.8" />
          </g>
        )
      })}
    </svg>
  )
}

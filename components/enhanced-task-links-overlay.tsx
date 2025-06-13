"use client"

import { useNotes } from "@/components/context/notes-context"

export default function EnhancedTaskLinksOverlay() {
  const { tasks, links } = useNotes()

  if (links.length === 0) return null

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: "100%", height: "100%" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Enhanced arrow marker */}
        <marker
          id="arrowhead"
          markerWidth="12"
          markerHeight="8"
          refX="11"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0 0, 12 4, 0 8" fill="#f59e0b" />
        </marker>

        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Animated gradient for active chains */}
        <linearGradient id="chainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3">
            <animate attributeName="stop-opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8">
            <animate attributeName="stop-opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3">
            <animate attributeName="stop-opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
          </stop>
        </linearGradient>

        {/* Pulse animation for connection points */}
        <circle id="pulsePoint" r="6" fill="#f59e0b" opacity="0.8">
          <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
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

        // Determine if this is an active chain
        const isActiveChain = fromTask.isChainActive || toTask.isChainActive || fromTask.isRunning || toTask.isRunning
        const isCompleted = fromTask.isCompleted && toTask.isCompleted

        return (
          <g key={link.id}>
            {/* Background glow */}
            <path
              d={pathData}
              stroke={isCompleted ? "#10b981" : "#f59e0b"}
              strokeWidth="6"
              fill="none"
              filter="url(#glow)"
              opacity="0.4"
            />

            {/* Main arrow path */}
            <path
              d={pathData}
              stroke={isCompleted ? "#10b981" : isActiveChain ? "url(#chainGradient)" : "#f59e0b"}
              strokeWidth="3"
              fill="none"
              markerEnd="url(#arrowhead)"
              className={isActiveChain ? "animate-pulse" : ""}
              strokeDasharray={isActiveChain ? "8,4" : "none"}
            >
              {isActiveChain && (
                <animate attributeName="stroke-dashoffset" values="0;12;0" dur="1.5s" repeatCount="indefinite" />
              )}
            </path>

            {/* Enhanced connection points */}
            <g>
              {/* From point */}
              <circle
                cx={fromX}
                cy={fromY}
                r="5"
                fill={fromTask.isCompleted ? "#10b981" : fromTask.isRunning ? "#f59e0b" : "#64748b"}
                opacity="0.9"
                className={fromTask.isRunning ? "animate-pulse" : ""}
              />
              <circle
                cx={fromX}
                cy={fromY}
                r="8"
                fill="none"
                stroke={fromTask.isCompleted ? "#10b981" : fromTask.isRunning ? "#f59e0b" : "#64748b"}
                strokeWidth="1"
                opacity="0.5"
              />

              {/* To point */}
              <circle
                cx={toX}
                cy={toY}
                r="5"
                fill={toTask.isCompleted ? "#10b981" : toTask.isRunning ? "#f59e0b" : "#64748b"}
                opacity="0.9"
                className={toTask.isRunning ? "animate-pulse" : ""}
              />
              <circle
                cx={toX}
                cy={toY}
                r="8"
                fill="none"
                stroke={toTask.isCompleted ? "#10b981" : toTask.isRunning ? "#f59e0b" : "#64748b"}
                strokeWidth="1"
                opacity="0.5"
              />
            </g>

            {/* Chain position indicators */}
            {(fromTask.chainPosition || toTask.chainPosition) && (
              <g>
                {fromTask.chainPosition && (
                  <text
                    x={fromX}
                    y={fromY - 15}
                    textAnchor="middle"
                    className="fill-white text-xs font-bold"
                    style={{ fontSize: "10px" }}
                  >
                    {fromTask.chainPosition}
                  </text>
                )}
                {toTask.chainPosition && (
                  <text
                    x={toX}
                    y={toY - 15}
                    textAnchor="middle"
                    className="fill-white text-xs font-bold"
                    style={{ fontSize: "10px" }}
                  >
                    {toTask.chainPosition}
                  </text>
                )}
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

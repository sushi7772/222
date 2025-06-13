"use client"

import { useNotes } from "@/components/context/notes-context"
import EnhancedAdaptiveNoteCard from "@/components/enhanced-adaptive-note-card"
import EnhancedTaskLinksOverlay from "@/components/enhanced-task-links-overlay"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Link, X, Workflow, Play, RotateCcw, Zap } from "lucide-react"

export default function EnhancedNotesCanvas() {
  const {
    tasks,
    loading,
    linkingMode,
    setLinkingMode,
    selectedTaskForLinking,
    setSelectedTaskForLinking,
    getTaskChain,
    getChainProgress,
    startChain,
    resetChain,
  } = useNotes()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading your notes...
        </div>
      </div>
    )
  }

  const handleExitLinkingMode = () => {
    setLinkingMode(false)
    setSelectedTaskForLinking(null)
  }

  // Get unique chains
  const chains = tasks.filter((task) => task.linkedTo.length > 0).map((task) => getTaskChain(task.id))
  const uniqueChains = chains.filter((chain, index, self) => index === self.findIndex((c) => c[0]?.id === chain[0]?.id))

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Enhanced dark school notepad grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(0deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "40px 40px, 40px 40px, 8px 8px, 8px 8px",
          backgroundPosition: "-1px -1px, -1px -1px, -1px -1px, -1px -1px",
        }}
      />

      {/* Enhanced task links overlay */}
      <EnhancedTaskLinksOverlay />

      {/* Enhanced linking mode controls */}
      {linkingMode && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 glass-card border border-slate-700 rounded-lg p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
              <Link className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-white font-medium">Linking Mode Active</span>
              <p className="text-slate-400 text-sm">
                {selectedTaskForLinking ? "Click target card to create link" : "Click source card to start"}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExitLinkingMode}
              className="glass-button border-white/20 text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4 mr-1" />
              Exit
            </Button>
          </div>
        </div>
      )}

      {/* Chain management panel */}
      {uniqueChains.length > 0 && !linkingMode && (
        <div className="fixed top-20 right-6 z-40 space-y-3 max-w-xs">
          {uniqueChains.map((chain, index) => {
            const progress = getChainProgress(chain)
            const isActive = chain.some((task) => task.isChainActive)
            const isRunning = chain.some((task) => task.isRunning)

            return (
              <div key={chain[0]?.id || index} className="glass-card border border-purple-700/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-purple-400" />
                    <span className="text-white text-sm font-medium">Chain {index + 1}</span>
                    {isActive && (
                      <Badge variant="secondary" className="bg-purple-900/50 text-purple-200 text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <span className="text-purple-200 text-xs">{chain.length} tasks</span>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-purple-300 text-xs">Progress</span>
                    <span className="text-purple-200 text-xs font-medium">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-purple-800/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-400 transition-all duration-300"
                      style={{ width: progress + "%" }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => startChain(chain[0].id)}
                    disabled={isRunning}
                    className="flex-1 bg-purple-600/80 hover:bg-purple-600 text-white text-xs h-7"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Start
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resetChain(chain.map((t) => t.id))}
                    className="flex-1 bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-600 text-xs h-7"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Enhanced task cards */}
      {tasks.map((task) => (
        <EnhancedAdaptiveNoteCard key={task.id} task={task} />
      ))}

      {/* Enhanced empty state */}
      {tasks.length === 0 && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto">
              <Workflow className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Welcome to Notes Playground</h3>
            <p className="text-slate-400 leading-relaxed">
              Create your first note card to get started. You can set timers, alarms, link cards together for workflows,
              and much more!
            </p>
            <div className="flex flex-wrap gap-2 justify-center text-xs text-slate-500">
              <span>• Drag to move cards</span>
              <span>• Link cards for workflows</span>
              <span>• Set timers & alarms</span>
              <span>• Attach files</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

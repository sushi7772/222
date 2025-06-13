"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useNotes } from "@/components/context/notes-context"
import TelegramSettingsModal from "@/components/telegram-settings-modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  Plus,
  Settings,
  Zap,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Link,
  X,
  Play,
  CheckCircle,
  Workflow,
  Sparkles,
} from "lucide-react"

export default function GlassmorphismHeader() {
  const {
    addTask,
    tasks,
    loading,
    exportTasks,
    importTasks,
    telegramSettings,
    clearAllTasks,
    createNewSession,
    sessionId,
    linkingMode,
    setLinkingMode,
    setSelectedTaskForLinking,
    getTaskChain,
    getChainProgress,
  } = useNotes()
  const [showTelegramSettings, setShowTelegramSettings] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showNewSessionConfirm, setShowNewSessionConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      importTasks(file)
    }
  }

  const handleClearAll = async () => {
    await clearAllTasks()
    setShowClearConfirm(false)
  }

  const handleNewSession = () => {
    createNewSession()
    setShowNewSessionConfirm(false)
  }

  const handleToggleLinkingMode = () => {
    setLinkingMode(!linkingMode)
    setSelectedTaskForLinking(null)
  }

  // Calculate statistics
  const runningTasks = tasks.filter((task) => task.isRunning).length
  const completedTasks = tasks.filter((task) => task.isCompleted).length
  const linkedTasks = tasks.filter((task) => task.linkedTo.length > 0).length
  const totalAttachments = tasks.reduce((acc, task) => acc + task.attachments.length, 0)
  const totalCompletions = tasks.reduce((acc, task) => acc + (task.completionCount || 0), 0)

  // Get chain statistics
  const chains = tasks.filter((task) => task.linkedTo.length > 0).map((task) => getTaskChain(task.id))
  const uniqueChains = chains.filter((chain, index, self) => index === self.findIndex((c) => c[0]?.id === chain[0]?.id))

  return (
    <>
      <div className="glass-nav sticky top-0 z-50 border-b border-white/10">
        <div className="flex justify-between items-center p-4 lg:p-6">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white via-amber-100 to-orange-200 bg-clip-text text-transparent">
                  Notes
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                    Playground
                  </span>
                  <Badge variant="secondary" className="bg-white/10 text-white/80 text-xs">
                    v2.0
                  </Badge>
                </div>
              </div>
            </div>

            {/* Enhanced Statistics */}
            <div className="hidden lg:flex items-center gap-6 ml-6 pl-6 border-l border-white/20">
              {loading ? (
                <div className="flex items-center gap-2 text-white/60">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin"></div>
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                <>
                  {/* Task Count */}
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-white/90 text-sm font-medium">{tasks.length}</span>
                    <span className="text-white/60 text-xs">tasks</span>
                  </div>

                  {/* Running Tasks */}
                  {runningTasks > 0 && (
                    <div className="flex items-center gap-2 bg-amber-500/20 rounded-lg px-3 py-1.5">
                      <Play className="w-3 h-3 text-amber-400" />
                      <span className="text-amber-200 text-sm font-medium">{runningTasks}</span>
                      <span className="text-amber-300/60 text-xs">running</span>
                    </div>
                  )}

                  {/* Completed Tasks */}
                  {completedTasks > 0 && (
                    <div className="flex items-center gap-2 bg-green-500/20 rounded-lg px-3 py-1.5">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      <span className="text-green-200 text-sm font-medium">{completedTasks}</span>
                      <span className="text-green-300/60 text-xs">done</span>
                    </div>
                  )}

                  {/* Linked Tasks */}
                  {linkedTasks > 0 && (
                    <div className="flex items-center gap-2 bg-purple-500/20 rounded-lg px-3 py-1.5">
                      <Workflow className="w-3 h-3 text-purple-400" />
                      <span className="text-purple-200 text-sm font-medium">{uniqueChains.length}</span>
                      <span className="text-purple-300/60 text-xs">chains</span>
                    </div>
                  )}

                  {/* Total Completions */}
                  {totalCompletions > 0 && (
                    <div className="flex items-center gap-2 bg-pink-500/20 rounded-lg px-3 py-1.5">
                      <Zap className="w-3 h-3 text-pink-400" />
                      <span className="text-pink-200 text-sm font-medium">{totalCompletions}</span>
                      <span className="text-pink-300/60 text-xs">completions</span>
                    </div>
                  )}

                  {/* Session Info */}
                  <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
                    <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                    <span className="text-white/50 text-xs font-mono">{sessionId.slice(-8)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 lg:gap-3">
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

            {/* Import Button */}
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="glass-button border-white/20 hover:border-white/30 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <Upload className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Import</span>
            </Button>

            {/* Export Button */}
            <Button
              onClick={exportTasks}
              variant="outline"
              size="sm"
              className="glass-button border-white/20 hover:border-white/30 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>

            {/* Telegram Settings */}
            <Button
              onClick={() => setShowTelegramSettings(true)}
              variant="outline"
              size="sm"
              className={`glass-button border-white/20 hover:border-white/30 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 ${
                telegramSettings.enabled ? "ring-2 ring-blue-400/50 bg-blue-500/10" : ""
              }`}
            >
              <Settings className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Telegram</span>
              {telegramSettings.enabled && <div className="w-2 h-2 bg-green-400 rounded-full ml-2 animate-pulse" />}
            </Button>

            {/* Link Mode Toggle */}
            <Button
              onClick={handleToggleLinkingMode}
              variant="outline"
              size="sm"
              className={`glass-button transition-all duration-300 ${
                linkingMode
                  ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/50 text-amber-200 hover:from-amber-500/30 hover:to-orange-500/30"
                  : "border-white/20 hover:border-white/30 text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              {linkingMode ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Exit Link</span>
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Link Cards</span>
                </>
              )}
            </Button>

            {/* New Session */}
            <Button
              onClick={() => setShowNewSessionConfirm(true)}
              variant="outline"
              size="sm"
              className="glass-button border-white/20 hover:border-white/30 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">New Session</span>
            </Button>

            {/* Clear All */}
            <Button
              onClick={() => setShowClearConfirm(true)}
              variant="outline"
              size="sm"
              className="glass-button border-red-400/30 hover:border-red-400/50 text-red-300/80 hover:text-red-200 hover:bg-red-500/10 transition-all duration-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">Clear All</span>
            </Button>

            {/* Add Note - Primary Action */}
            <Button
              onClick={addTask}
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add Note</span>
            </Button>
          </div>
        </div>

        {/* Mobile Statistics Bar */}
        <div className="lg:hidden border-t border-white/10 px-4 py-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-white/60">{tasks.length} tasks</span>
              {runningTasks > 0 && (
                <span className="text-amber-400 flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  {runningTasks}
                </span>
              )}
              {completedTasks > 0 && (
                <span className="text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {completedTasks}
                </span>
              )}
              {linkedTasks > 0 && (
                <span className="text-purple-400 flex items-center gap-1">
                  <Workflow className="w-3 h-3" />
                  {uniqueChains.length}
                </span>
              )}
            </div>
            <span className="text-white/40 font-mono">{sessionId.slice(-8)}</span>
          </div>
        </div>
      </div>

      {/* Clear All Confirmation */}
      <Sheet open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <SheetContent side="right" className="w-80 glass-card border-slate-700">
          <div className="flex flex-col items-center justify-center h-full p-6 space-y-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white text-center">Clear All Notes?</h3>
            <p className="text-slate-300 text-center">
              Are you sure you want to delete all {tasks.length} notes? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <Button
                onClick={() => setShowClearConfirm(false)}
                variant="outline"
                className="flex-1 glass-button border-white/20 text-white/80"
              >
                Cancel
              </Button>
              <Button
                onClick={handleClearAll}
                variant="destructive"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Clear All
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* New Session Confirmation */}
      <Sheet open={showNewSessionConfirm} onOpenChange={setShowNewSessionConfirm}>
        <SheetContent side="right" className="w-80 glass-card border-slate-700">
          <div className="flex flex-col items-center justify-center h-full p-6 space-y-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
              <RotateCcw className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white text-center">Start New Session?</h3>
            <p className="text-slate-300 text-center">
              This will create a fresh workspace and save your current notes. You can always return to this session
              later by importing your exported notes.
            </p>
            <div className="flex gap-3 w-full">
              <Button
                onClick={() => setShowNewSessionConfirm(false)}
                variant="outline"
                className="flex-1 glass-button border-white/20 text-white/80"
              >
                Cancel
              </Button>
              <Button onClick={handleNewSession} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                New Session
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <TelegramSettingsModal isOpen={showTelegramSettings} onClose={() => setShowTelegramSettings(false)} />
    </>
  )
}

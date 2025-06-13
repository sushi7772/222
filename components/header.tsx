"use client"

import type React from "react"

import { useRef, useState } from "react"
import { useNotes } from "@/components/context/notes-context"
import TelegramSettingsModal from "@/components/telegram-settings-modal"
import { Button } from "@/components/ui/button"
import { Plus, Settings, Zap, Download, Upload, Trash2, RotateCcw, AlertTriangle, Link, X } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"

export default function Header() {
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

  const runningTasks = tasks.filter((task) => task.isRunning).length
  const completedTasks = tasks.filter((task) => task.isCompleted).length
  const linkedTasks = tasks.filter((task) => task.linkedTo.length > 0).length

  return (
    <>
      <div className="flex justify-between items-center p-6 bg-slate-900/80 backdrop-blur-md text-white border-b border-slate-700/50 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Notes Playground
            </h1>
          </div>
          <div className="text-sm text-slate-400">
            {loading ? (
              "Loading..."
            ) : (
              <div className="flex gap-4">
                <span>{tasks.length} tasks</span>
                {runningTasks > 0 && <span className="text-amber-400">⏱️ {runningTasks} running</span>}
                {completedTasks > 0 && <span className="text-green-400">✅ {completedTasks} completed</span>}
                {linkedTasks > 0 && <span className="text-blue-400">🔗 {linkedTasks} linked</span>}
                <span>{tasks.reduce((acc, task) => acc + task.attachments.length, 0)} files</span>
                <span className="text-xs text-slate-500">Session: {sessionId.slice(-8)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-600 hover:border-slate-500 transition-all duration-200"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>

          <Button
            onClick={exportTasks}
            variant="outline"
            size="sm"
            className="bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-600 hover:border-slate-500 transition-all duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <Button
            onClick={() => setShowTelegramSettings(true)}
            variant="outline"
            size="sm"
            className={`bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-600 hover:border-slate-500 transition-all duration-200 ${
              telegramSettings.enabled ? "ring-2 ring-blue-500/50" : ""
            }`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Telegram
            {telegramSettings.enabled && <div className="w-2 h-2 bg-green-400 rounded-full ml-1" />}
          </Button>

          <Button
            onClick={handleToggleLinkingMode}
            variant="outline"
            size="sm"
            className={`transition-all duration-200 ${
              linkingMode
                ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-500"
                : "bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-600 hover:border-slate-500"
            }`}
          >
            {linkingMode ? <X className="w-4 h-4 mr-2" /> : <Link className="w-4 h-4 mr-2" />}
            {linkingMode ? "Exit Link" : "Link Cards"}
          </Button>

          <Button
            onClick={() => setShowNewSessionConfirm(true)}
            variant="outline"
            size="sm"
            className="bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-600 hover:border-slate-500 transition-all duration-200"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            New Session
          </Button>

          <Button
            onClick={() => setShowClearConfirm(true)}
            variant="outline"
            size="sm"
            className="bg-red-900/20 hover:bg-red-900/40 text-red-400 border-red-600 hover:border-red-500 transition-all duration-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>

          <Button
            onClick={addTask}
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg transition-all duration-200 hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>

      {/* Clear All Confirmation */}
      <Sheet open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <SheetContent side="right" className="w-80 bg-slate-900/90 backdrop-blur-md border-slate-700">
          <div className="flex flex-col items-center justify-center h-full p-6 space-y-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white text-center">Clear All Notes?</h3>
            <p className="text-slate-300 text-center">
              Are you sure you want to delete all {tasks.length} notes? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <Button
                onClick={() => setShowClearConfirm(false)}
                variant="outline"
                className="flex-1 bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-600"
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
        <SheetContent side="right" className="w-80 bg-slate-900/90 backdrop-blur-md border-slate-700">
          <div className="flex flex-col items-center justify-center h-full p-6 space-y-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
              <RotateCcw className="w-8 h-8 text-blue-500" />
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
                className="flex-1 bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-600"
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

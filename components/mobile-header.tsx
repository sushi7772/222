"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useNotes } from "@/components/context/notes-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Plus, Menu, Upload, Zap, Link, X } from "lucide-react"

export default function MobileHeader() {
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showNewSessionConfirm, setShowNewSessionConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      importTasks(file)
      setIsMenuOpen(false)
    }
  }

  const handleExport = () => {
    exportTasks()
    setIsMenuOpen(false)
  }

  const handleTelegramSettings = () => {
    setShowTelegramSettings(true)
    setIsMenuOpen(false)
  }

  const handleClearAll = async () => {
    await clearAllTasks()
    setShowClearConfirm(false)
    setIsMenuOpen(false)
  }

  const handleNewSession = () => {
    createNewSession()
    setShowNewSessionConfirm(false)
    setIsMenuOpen(false)
  }

  const handleToggleLinkingMode = () => {
    setLinkingMode(!linkingMode)
    setSelectedTaskForLinking(null)
    setIsMenuOpen(false)
  }

  const runningTasks = tasks.filter((task) => task.isRunning).length
  const completedTasks = tasks.filter((task) => task.isCompleted).length
  const linkedTasks = tasks.filter((task) => task.linkedTo.length > 0).length

  return (
    <>
      <div className="flex justify-between items-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md text-white border-b border-slate-700/50 sticky top-0 z-50 shadow-lg">
        {/* Logo and Stats */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent truncate">
              Notes
            </h1>
          </div>

          {/* Mobile Stats */}
          <div className="hidden xs:flex text-xs text-slate-400 gap-2">
            {loading ? (
              <span>Loading...</span>
            ) : (
              <>
                <span>{tasks.length}</span>
                {runningTasks > 0 && <span className="text-amber-400">⏱️{runningTasks}</span>}
                {completedTasks > 0 && <span className="text-green-400">✅{completedTasks}</span>}
                {linkedTasks > 0 && <span className="text-blue-400">🔗{linkedTasks}</span>}
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Link Mode Toggle */}
          <Button
            onClick={handleToggleLinkingMode}
            size="sm"
            className={`transition-all duration-200 px-3 ${
              linkingMode
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-slate-800/50 hover:bg-slate-700 text-slate-300 border border-slate-600"
            }`}
          >
            {linkingMode ? <X className="w-4 h-4" /> : <Link className="w-4 h-4" />}
          </Button>

          {/* Quick Add Button */}
          <Button
            onClick={addTask}
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg transition-all duration-200 hover:scale-105 px-3 sm:px-4"
          >
            <Plus className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Add</span>
          </Button>

          {/* Menu Sheet */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-600 hover:border-slate-500 transition-all duration-200 px-3"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-slate-900/90 backdrop-blur-md border-slate-700">
              <SheetHeader>
                <SheetTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Notes Playground
                </SheetTitle>
                <p className="text-xs text-slate-400 text-left">Session: {sessionId.slice(-8)}</p>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {/* Stats */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50">
                  <h3 className="text-white font-medium mb-2">Statistics</h3>
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex justify-between">
                      <span>Total Tasks:</span>
                      <span className="text-white">{tasks.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Running:</span>
                      <span className="text-amber-400">{runningTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span className="text-green-400">{completedTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Linked:</span>
                      <span className="text-blue-400">{linkedTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Files:</span>
                      <span className="text-purple-400">
                        {tasks.reduce((acc, task) => acc + task.attachments.length, 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

                  <Button
                    onClick={handleToggleLinkingMode}
                    variant="outline"
                    className={`w-full justify-start ${
                      linkingMode
                        ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-500"
                        : "bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    {linkingMode ? (
                      <>
                        <X className="w-4 h-4 mr-3" />
                        Exit Link Mode
                      </>
                    ) : (
                      <>
                        <Link className="w-4 h-4 mr-3" />
                        Link Cards
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-600 hover:border-slate-500 justify-start"
                  >
                    <Upload className="w-4 h-4 mr-3" />
                    Import Tasks
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  )
}

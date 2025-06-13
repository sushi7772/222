"use client"

import { useState } from "react"
import { useNotes } from "@/components/context/notes-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ExternalLink } from "lucide-react"

interface TelegramSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TelegramSettingsModal({ isOpen, onClose }: TelegramSettingsModalProps) {
  const { telegramSettings, saveTelegramSettings } = useNotes()
  const [settings, setSettings] = useState(telegramSettings)
  const [isTesting, setIsTesting] = useState(false)

  const handleSave = async () => {
    await saveTelegramSettings(settings)
    onClose()
  }

  const handleTest = async () => {
    setIsTesting(true)
    try {
      await saveTelegramSettings(settings)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-slate-800 border-slate-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white text-sm font-bold">T</span>
            </div>
            Telegram Integration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Setup Instructions */}
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400" />
                Setup Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <div className="space-y-2">
                <p className="font-medium text-white">1. Create a Telegram Bot:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Message @BotFather on Telegram</li>
                  <li>Send /newbot and follow instructions</li>
                  <li>Copy the bot token (looks like: 123456789:ABC-DEF...)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-white">2. Get your Chat ID:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Message @userinfobot on Telegram</li>
                  <li>Copy your Chat ID (a number like: 123456789)</li>
                </ul>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://t.me/botfather", "_blank")}
                className="bg-slate-600 border-slate-500 text-slate-200 hover:bg-slate-500"
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                Open BotFather
              </Button>
            </CardContent>
          </Card>

          {/* Settings Form */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, enabled: !!checked })}
                className="border-slate-500"
              />
              <Label htmlFor="enabled" className="text-white font-medium">
                Enable Telegram Notifications
              </Label>
            </div>

            {settings.enabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300 text-sm font-medium">Bot Token</Label>
                    <Input
                      type="password"
                      value={settings.botToken}
                      onChange={(e) => setSettings({ ...settings, botToken: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                      placeholder="123456789:ABC-DEF..."
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm font-medium">Chat ID</Label>
                    <Input
                      value={settings.chatId}
                      onChange={(e) => setSettings({ ...settings, chatId: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                      placeholder="123456789"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300 text-sm font-medium">Custom Message Template</Label>
                  <Textarea
                    value={settings.customMessage}
                    onChange={(e) => setSettings({ ...settings, customMessage: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                    placeholder="⏰ Timer completed for: {title}"
                    rows={3}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Use {"{title}"} to include the task title in your message
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-300 text-sm font-medium">Notification Settings</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notifyOnComplete"
                        checked={settings.notifyOnComplete}
                        onCheckedChange={(checked) => setSettings({ ...settings, notifyOnComplete: !!checked })}
                        className="border-slate-500"
                      />
                      <Label htmlFor="notifyOnComplete" className="text-slate-300 text-sm">
                        Notify when timer completes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notifyOnStart"
                        checked={settings.notifyOnStart}
                        onCheckedChange={(checked) => setSettings({ ...settings, notifyOnStart: !!checked })}
                        className="border-slate-500"
                      />
                      <Label htmlFor="notifyOnStart" className="text-slate-300 text-sm">
                        Notify when timer starts
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Test Connection */}
                <Card className="bg-slate-700 border-slate-600">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-medium">Test Connection</p>
                        <p className="text-slate-400 text-xs">Send a test message to verify your setup</p>
                      </div>
                      <Button
                        onClick={handleTest}
                        disabled={!settings.botToken || !settings.chatId || isTesting}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isTesting ? "Testing..." : "Test"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-600">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700 text-white">
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

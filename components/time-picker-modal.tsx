"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TimePickerModalProps {
  isOpen: boolean
  onClose: () => void
  onTimeSelect: (time: string) => void
  currentTime: string
}

const PRESET_TIMES = [
  { label: "1 min", value: "01:00" },
  { label: "5 min", value: "05:00" },
  { label: "10 min", value: "10:00" },
  { label: "15 min", value: "15:00" },
  { label: "25 min", value: "25:00" },
  { label: "30 min", value: "30:00" },
  { label: "45 min", value: "45:00" },
  { label: "1 hour", value: "60:00" },
]

export default function TimePickerModal({ isOpen, onClose, onTimeSelect, currentTime }: TimePickerModalProps) {
  const [minutes, setMinutes] = useState(() => {
    const [min] = currentTime.split(":").map(Number)
    return min.toString()
  })
  const [seconds, setSeconds] = useState(() => {
    const [, sec] = currentTime.split(":").map(Number)
    return sec.toString()
  })

  const handlePresetSelect = (time: string) => {
    onTimeSelect(time)
  }

  const handleCustomTime = () => {
    const min = Math.max(0, Math.min(99, Number.parseInt(minutes) || 0))
    const sec = Math.max(0, Math.min(59, Number.parseInt(seconds) || 0))
    const timeString = `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
    onTimeSelect(timeString)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Set Timer</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preset times */}
          <div>
            <Label className="text-slate-300 text-sm font-medium">Quick Select</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {PRESET_TIMES.map((preset) => (
                <Button
                  key={preset.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSelect(preset.value)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600 hover:border-slate-500"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom time input */}
          <div>
            <Label className="text-slate-300 text-sm font-medium">Custom Time</Label>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1">
                <Label className="text-xs text-slate-400">Minutes</Label>
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="00"
                />
              </div>
              <div className="text-slate-400 text-lg font-bold mt-5">:</div>
              <div className="flex-1">
                <Label className="text-xs text-slate-400">Seconds</Label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) => setSeconds(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="00"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600"
            >
              Cancel
            </Button>
            <Button onClick={handleCustomTime} className="bg-amber-600 hover:bg-amber-700 text-white">
              Set Timer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

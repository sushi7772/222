"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock } from "lucide-react"

interface AlarmTimePickerModalProps {
  isOpen: boolean
  onClose: () => void
  onTimeSelect: (time: string, date?: string) => void
  currentTime?: string
  currentDate?: string
}

export default function AlarmTimePickerModal({
  isOpen,
  onClose,
  onTimeSelect,
  currentTime = "",
  currentDate = "",
}: AlarmTimePickerModalProps) {
  const [time, setTime] = useState(() => {
    if (currentTime) return currentTime
    const now = new Date()
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
  })
  const [date, setDate] = useState(() => {
    if (currentDate) return currentDate
    return new Date().toISOString().split("T")[0]
  })

  const handleSetAlarm = () => {
    onTimeSelect(time, date)
    onClose()
  }

  const handleQuickTime = (quickTime: string) => {
    setTime(quickTime)
  }

  const quickTimes = [
    { label: "9:00 AM", value: "09:00" },
    { label: "12:00 PM", value: "12:00" },
    { label: "1:00 PM", value: "13:00" },
    { label: "3:00 PM", value: "15:00" },
    { label: "5:00 PM", value: "17:00" },
    { label: "6:00 PM", value: "18:00" },
    { label: "8:00 PM", value: "20:00" },
    { label: "10:00 PM", value: "22:00" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Set Alarm Time
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick times */}
          <div>
            <Label className="text-slate-300 text-sm font-medium">Quick Times</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {quickTimes.map((quickTime) => (
                <Button
                  key={quickTime.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickTime(quickTime.value)}
                  className={`bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600 hover:border-slate-500 text-xs ${
                    time === quickTime.value ? "ring-2 ring-amber-500" : ""
                  }`}
                >
                  {quickTime.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom time and date */}
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time (24-hour format)
              </Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white mt-2"
              />
            </div>

            <div>
              <Label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white mt-2"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
            <Label className="text-slate-300 text-xs">Alarm Preview:</Label>
            <p className="text-white font-medium">
              {new Date(`${date}T${time}`).toLocaleString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
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
            <Button onClick={handleSetAlarm} className="bg-amber-600 hover:bg-amber-700 text-white">
              Set Alarm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

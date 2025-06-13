"use client"

import { useState } from "react"
import { useNotes, type Task } from "@/components/context/notes-context"
import { Button } from "@/components/ui/button"
import { FileText, ImageIcon, Download, Trash2, Eye } from "lucide-react"

interface MobileAttachmentPanelProps {
  task: Task
}

export default function MobileAttachmentPanel({ task }: MobileAttachmentPanelProps) {
  const { removeAttachment } = useNotes()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-5 h-5" />
    return <FileText className="w-5 h-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const handlePreview = (attachment: any) => {
    if (attachment.type.startsWith("image/")) {
      setPreviewUrl(attachment.url)
    } else {
      window.open(attachment.url, "_blank")
    }
  }

  const handleDownload = (attachment: any) => {
    const link = document.createElement("a")
    link.href = attachment.url
    link.download = attachment.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (task.attachments.length === 0) {
    return (
      <div className="text-center py-6 text-white/60 text-sm">
        <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No attachments yet</p>
        <p className="text-xs mt-1">Tap the options menu to add files</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {task.attachments.map((attachment) => (
        <div key={attachment.id} className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/10">
          {getFileIcon(attachment.type)}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm truncate font-medium">{attachment.name}</p>
            <p className="text-white/60 text-xs">{formatFileSize(attachment.size)}</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handlePreview(attachment)}
              className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDownload(attachment)}
              className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeAttachment(task.id, attachment.id)}
              className="h-8 w-8 p-0 text-white/60 hover:text-red-400 hover:bg-red-900/30"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}

      {/* Image preview modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="max-w-full max-h-full">
            <img
              src={previewUrl || "/placeholder.svg"}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { useNotes, type Task } from "@/components/context/notes-context"
import { Button } from "@/components/ui/button"
import { FileText, ImageIcon, Download, Trash2, Eye } from "lucide-react"

interface AttachmentPanelProps {
  task: Task
}

export default function AttachmentPanel({ task }: AttachmentPanelProps) {
  const { removeAttachment } = useNotes()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
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
      <div className="text-center py-4 text-white/60 text-sm">
        <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
        No attachments yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {task.attachments.map((attachment) => (
        <div key={attachment.id} className="flex items-center gap-2 p-2 bg-black/20 rounded border border-white/10">
          {getFileIcon(attachment.type)}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm truncate">{attachment.name}</p>
            <p className="text-white/60 text-xs">{formatFileSize(attachment.size)}</p>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handlePreview(attachment)}
              className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
            >
              <Eye className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDownload(attachment)}
              className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
            >
              <Download className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeAttachment(task.id, attachment.id)}
              className="h-6 w-6 p-0 text-white/60 hover:text-red-400 hover:bg-red-900/30"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ))}

      {/* Image preview modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="max-w-4xl max-h-4xl p-4">
            <img
              src={previewUrl || "/placeholder.svg"}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  )
}

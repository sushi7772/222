import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const taskId = formData.get("taskId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`attachments/${taskId}/${file.name}`, file, {
      access: "public",
    })

    // Create attachment object
    const attachment = {
      id: crypto.randomUUID(),
      name: file.name,
      url: blob.url,
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }

    return NextResponse.json(attachment)
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

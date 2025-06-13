import { del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const attachmentId = params.id

    // In a real app, you'd look up the blob URL by attachment ID
    // For now, we'll assume the URL is passed in the request body
    const { url } = await request.json()

    if (url) {
      await del(url)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}

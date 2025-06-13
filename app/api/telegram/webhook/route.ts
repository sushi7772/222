import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle Telegram webhook updates
    if (body.message) {
      const chatId = body.message.chat.id
      const text = body.message.text

      // You can add custom commands here
      if (text === "/start") {
        // Send welcome message
        return NextResponse.json({
          method: "sendMessage",
          chat_id: chatId,
          text: "Welcome to Notes Playground! Your notifications are set up correctly.",
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

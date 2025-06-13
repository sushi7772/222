"use client"

export async function sendTelegramNotification(chatId: string, message: string, botToken: string): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Telegram API Error: ${error.description || "Unknown error"}`)
  }
}

export async function testTelegramConnection(chatId: string, botToken: string): Promise<boolean> {
  try {
    await sendTelegramNotification(chatId, "🎉 Telegram notifications are now enabled!", botToken)
    return true
  } catch (error) {
    console.error("Telegram connection test failed:", error)
    return false
  }
}

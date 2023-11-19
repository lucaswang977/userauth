import constants from "@/l/constants"
import { cn, slogger } from "@/l/utility"
import type { Metadata } from "next"
import { Inter as FontSans } from "next/font/google"
import { cookies } from "next/headers"
import * as React from "react"

import "@/s/globals.css"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Todo List Sample Project",
  description: "Todo list implemented with Next.js",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const theme = cookieStore.get(constants.COOKIE_THEME_NAME)

  slogger.info(`Get theme from cookie: ${theme ? theme.value : "(system)"}`)

  let value = (
    <html lang="en">
      <body className={cn(fontSans.variable)}>{children}</body>
    </html>
  )

  if (theme !== undefined) {
    value = (
      <html lang="en" className={theme.value}>
        <body className={cn(fontSans.variable)}>{children}</body>
      </html>
    )
  }

  return value
}

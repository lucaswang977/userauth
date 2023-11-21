import { ThemeSwitcher } from "@/c/reusable/theme-switcher"
import constants from "@/l/constants"
import { cn, slogger } from "@/l/utility"
import type { Metadata } from "next"
import getConfig from "next/config"
import { Inter as FontSans } from "next/font/google"
import { cookies } from "next/headers"
import Link from "next/link"
import * as React from "react"

import "@/s/globals.css"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "User Auth Demo Project",
  description: "User authentication demo implemented with Next.js",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { publicRuntimeConfig } = getConfig()
  const version = publicRuntimeConfig?.version

  const cookieStore = cookies()
  const theme = cookieStore.get(constants.COOKIE_THEME_NAME)

  slogger.info(`Get theme from cookie: ${theme ? theme.value : "(system)"}`)

  return (
    <html lang="en" className={theme ? theme.value : ""}>
      <body className={cn(fontSans.variable)}>
        <main
          className={cn(
            "container min-h-screen",
            "flex flex-col items-center justify-between",
          )}
        >
          <Link className="mt-2" href="/">
            Home
          </Link>
          {children}
          <div className="mb-2 flex flex-col items-center text-sm text-gray-500">
            <div className="flex space-x-1">
              <p>v{version}</p>
              <ThemeSwitcher />
            </div>
            <p>User auth demo project written using Next.js 14</p>
          </div>
        </main>
      </body>
    </html>
  )
}

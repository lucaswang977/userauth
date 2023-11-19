import TodoList from "@/c/business/TodoList"
import { ThemeSwitcher } from "@/c/reusable/theme-switcher"
import { cn } from "@/l/utility"
import getConfig from "next/config"

export default function Home() {
  const { publicRuntimeConfig } = getConfig()
  const version = publicRuntimeConfig?.version

  return (
    <main
      className={cn(
        "container min-h-screen",
        "flex flex-col items-center justify-between",
      )}
    >
      <div />
      <TodoList />
      <div className="mb-3 flex flex-col items-center space-y-1 text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <p>v{version}</p>
          <ThemeSwitcher />
        </div>
        <p>A small todo list app written using Next.js 14</p>
      </div>
    </main>
  )
}

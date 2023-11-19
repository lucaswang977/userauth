"use client"

import { Button } from "@/c/shadui/button"
import { Checkbox } from "@/c/shadui/checkbox"
import { Todo } from "@/l/types"
import { cn } from "@/l/utility"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { Trash2 } from "lucide-react"

dayjs.extend(relativeTime)

interface TodoItemProps {
  data: Todo
  seq: number
  handleFinished: (id: string, setFinished: boolean) => void
  handleRemoved: (id: string) => void
}

function TodoItem({ data, seq, handleRemoved, handleFinished }: TodoItemProps) {
  return (
    <div key={data.id} data-testid="todo-item" className="group flex space-x-1">
      <div className="flex items-center space-x-1 opacity-0 transition-all group-hover:opacity-100">
        <Checkbox
          data-testid="todo-finish"
          onCheckedChange={(checked) => {
            handleFinished(data.id, checked as boolean)
          }}
          checked={data.finished}
        />
        <Button
          data-testid="todo-remove"
          onClick={() => {
            handleRemoved(data.id)
          }}
          variant="ghost"
          size="icon"
          className="h-4 w-4"
        >
          <Trash2 />
        </Button>
      </div>
      <div
        className={cn(
          data.finished ? "text-secondary line-through" : "",
          "flex space-x-2",
          "items-center",
        )}
      >
        <span>{seq}.</span>
        <span>{data.text}</span>
        <span className={cn("text-xs", data.finished ? "" : "text-slate-300")}>
          {dayjs(data.created_at).fromNow()}
        </span>
      </div>
    </div>
  )
}

export default TodoItem

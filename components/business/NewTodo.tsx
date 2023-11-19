"use client"

import { Button } from "@/c/shadui/button"
import { Input } from "@/c/shadui/input"
import * as React from "react"

interface NewTodoProps {
  handleNewItem: (t: string) => void
}

function NewTodo({ handleNewItem }: NewTodoProps) {
  const [text, setText] = React.useState("")
  const handleNewItemInput = (t: string) => {
    handleNewItem(t)
    setText("")
  }

  return (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Input
        data-testid="todo-input"
        type="text"
        value={text}
        placeholder="What are you going to do today..."
        onKeyDown={(ev) => {
          if (ev.key === "Enter") {
            handleNewItemInput(text)
          }
        }}
        onChange={(v) => {
          setText(v.currentTarget.value)
        }}
      />
      <Button
        type="button"
        onClick={() => {
          handleNewItemInput(text)
        }}
      >
        Add
      </Button>
    </div>
  )
}

export default NewTodo

import {
  fetchTodoList,
  newTodoItem,
  todoItemDelete,
  todoItemMarkFinished,
} from "@/l/actions"

import "@testing-library/jest-dom"

describe("Server actions test", () => {
  let testItemId: string | undefined

  it("Add new todo item", async () => {
    const item = await newTodoItem("todo item #1")
    expect(item).toBeDefined()
    const result = await fetchTodoList()
    expect(result.length).toBeGreaterThan(0)
    const testItem = result.find((i) => i.id === item.id)
    expect(testItem).toBeDefined()
    if (testItem) {
      expect(testItem.text).toContain("item #1")
      testItemId = testItem.id
    }
  })

  it("Mark item finished", async () => {
    expect(testItemId).toBeDefined()
    if (testItemId) {
      await todoItemMarkFinished(testItemId, true)
      const completeList = await fetchTodoList(true)
      expect(completeList).toBeDefined()
      if (completeList) {
        const completedItem = completeList.find((i) => i.id === testItemId)
        expect(completedItem).toBeDefined()
      }
    }
  })

  it("Test item delete", async () => {
    expect(testItemId).toBeDefined()
    if (testItemId) {
      await todoItemDelete(testItemId)
      const result = await fetchTodoList()
      expect(result.find((i) => i.id === testItemId)).toBeUndefined()
    }
  })
})

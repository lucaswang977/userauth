// We cannot test the component which include another async server components
// Watching for the solution: https://github.com/testing-library/react-testing-library/issues/1209

import TodoItem from "@/c/business/TodoItem"
import { fireEvent, render, screen } from "@testing-library/react"

import "@testing-library/jest-dom"

describe("TodoItem Component", () => {
  it("renders todo item", () => {
    render(
      <TodoItem
        data={{
          id: "1234",
          text: "This is a todo item.",
          finished: true,
          priority: 0,
          created_at: new Date(Date.now()),
          updated_at: new Date(Date.now()),
        }}
        seq={1}
        handleRemoved={(id) => {
          expect(id).toBe("1234")
        }}
        handleFinished={(id, setFinished) => {
          expect(id).toBe("1234")
          expect(setFinished).toBe(false)
        }}
      />,
    )

    expect(screen.getByText(/todo item/)).toBeInTheDocument()
    fireEvent.click(screen.getByTestId("remove-button"))
    fireEvent.click(screen.getByTestId("finish-checkbox"))
  })
})

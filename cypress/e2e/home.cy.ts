describe("The Home Page", () => {
  it("Button Add exists", () => {
    cy.visit("/")
    cy.get("button").should("have.text", "Add")
  })

  it("Theme switcher tests", () => {
    cy.visit("/")
    cy.get("button[data-testid='theme-switcher']").click()
    cy.get("div[data-testid='ts-dark']").click()
    cy.get("html").should("have.class", "dark")

    cy.get("button[data-testid='theme-switcher']").click()
    cy.get("div[data-testid='ts-light']").click()
    cy.get("html").should("have.class", "light")

    cy.get("button[data-testid='theme-switcher']").click()
    cy.get("div[data-testid='ts-system']").click()
    cy.get("html").should(($el) => 
      !($el.hasClass("dark") || $el.hasClass("light"))
    )
  })

  it("Todo list tests", () => {
    cy.visit("/")

    cy.get("input[data-testid='todo-input']").type("Test todo item from Cypress.")
    cy.get("button").contains("Add").click()
    cy.contains("div[data-testid='todo-item']", "Test todo item").should("have.length", 1)

    cy.contains("div[data-testid='todo-item']", "Test todo item").find("button[data-testid='todo-remove']").click()
    cy.contains("div[data-testid='todo-item']", "Test todo item").should("have.length", 0)
  })
})

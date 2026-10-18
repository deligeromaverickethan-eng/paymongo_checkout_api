// Create an order straight through the Order Service API.
// Every test calls this for its own data, so tests never depend on each other.
Cypress.Commands.add('createOrder', (items = [{ productId: 'p1', quantity: 1 }]) => {
  return cy
    .request('POST', 'http://localhost:3002/api/orders', {
      items,
      customer: { email: 'cypress@test.local' },
    })
    .then(({ status, body }) => {
      expect(status).to.eq(201)
      return body.order
    })
})

// Read an order back from the Order Service
Cypress.Commands.add('getOrder', (id) => {
  return cy.request(`http://localhost:3002/api/orders/${id}`).its('body.order')
})

// Use the UI: set the quantity with + then click "Add to Cart" on the right product card
Cypress.Commands.add('addToCart', (productName, quantity = 1) => {
  cy.contains('[data-cy=product-name]', productName)
    .closest('[data-cy=product-card]')
    .within(() => {
      for (let i = 0; i < quantity; i++) {
        cy.get('[data-cy=qty-plus]').click()
      }
      cy.get('[data-cy=add-to-cart]').click()
    })
})

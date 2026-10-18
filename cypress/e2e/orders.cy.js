const ORDERS = 'http://localhost:3002/api/orders'

describe('Orders', () => {
  it('E2E-02: creates a pending order with the right total', () => {
    // Let the REAL request reach the Order Service, but stop the browser from
    // leaving for PayMongo, so we can inspect the stored order afterwards.
    cy.intercept('POST', '**/api/orders', (req) => {
      req.continue((res) => {
        if (res.body && res.body.order) res.body.order.checkoutUrl = null
      })
    }).as('createOrder')

    cy.visit('/')
    cy.addToCart('SIAI T-Shirt', 2) // 2 x 350 = 700
    cy.addToCart('SIAI Cap', 1)     // 1 x 200 = 200
    cy.get('[data-cy=cart-total]').should('have.text', '₱900.00')
    cy.get('[data-cy=checkout-button]').click()

    cy.wait('@createOrder').then(({ response }) => {
      expect(response.statusCode).to.eq(201)
      const id = response.body.order.id

      // What the Order Service actually stored
      cy.getOrder(id).then((order) => {
        expect(order.status).to.eq('pending')
        expect(order.totalAmount).to.eq(90000) // centavos
        expect(order.items).to.have.length(2)
      })
    })
  })

  it('E2E-05: updates the order on the success page', () => {
    cy.createOrder().then((order) => {
      expect(order.status).to.eq('pending')

      cy.visit(`/payment-success.html?orderId=${order.id}`) // where PayMongo sends the customer back
      cy.get('[data-cy=success-title]').should('be.visible')
      cy.get('[data-cy=order-id]').should('have.text', order.id)
      cy.get('[data-cy=order-status]').should('have.text', 'paid')

      cy.getOrder(order.id).its('status').should('eq', 'paid')
    })
  })

  it('E2E-06: never marks a cancelled order as paid', () => {
    cy.createOrder().then((order) => {
      cy.visit(`/payment-cancel.html?orderId=${order.id}`)
      cy.get('[data-cy=cancel-title]').should('be.visible')
      cy.get('[data-cy=order-status]').should('have.text', 'cancelled')
      cy.getOrder(order.id).its('status').should('eq', 'cancelled')

      // Trying to mark it paid through the API is refused
      cy.request({
        method: 'PUT',
        url: `${ORDERS}/${order.id}/status`,
        body: { status: 'paid' },
        failOnStatusCode: false,
      }).its('status').should('eq', 409)

      // Opening the success page afterwards cannot flip it either
      cy.visit(`/payment-success.html?orderId=${order.id}`)
      cy.get('[data-cy=order-status]').should('have.text', 'cancelled')
      cy.get('[data-cy=page-error]').should('be.visible')
      cy.getOrder(order.id).its('status').should('eq', 'cancelled')
    })
  })
})

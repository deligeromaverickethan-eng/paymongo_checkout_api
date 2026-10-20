describe('Checkout and PayMongo hand-over', () => {
  it('E2E-03: gets a checkout URL from PayMongo', () => {
    cy.intercept('POST', '**/api/orders').as('checkout')

    cy.visitShop()
    cy.addToCart('SIAI Cap')
    cy.get('[data-cy=checkout-button]').click()

    cy.wait('@checkout').then(({ response }) => {
      expect(response.statusCode).to.eq(201)
      expect(response.body.order.checkoutUrl).to.match(/^https:\/\/checkout\.paymongo\.com\//)
    })
  })

  it('E2E-04: hands the customer over to PayMongo', () => {
    cy.visitShop()
    cy.addToCart('SIAI Cap')
    cy.get('[data-cy=checkout-button]').click()

    // PayMongo's page is another origin: confirm we arrived, touch nothing.
    cy.origin('https://checkout.paymongo.com', () => {
      cy.location('hostname').should('eq', 'checkout.paymongo.com')
    })
  })

  it('E2E-07: shows a clear error when checkout fails', () => {
    // Pre-existing order: proves a failed checkout never turns anything into "paid"
    cy.createOrder().then((existing) => {
      cy.intercept('POST', '**/api/orders', {
        statusCode: 500,
        body: { success: false, error: 'Payment unavailable' },
      }).as('checkout')

      cy.visitShop()
      cy.addToCart('SIAI Cap')
      cy.get('[data-cy=checkout-button]').click()
      cy.wait('@checkout')

      cy.get('[data-cy=checkout-error]').should('be.visible').and('contain', 'Payment unavailable')
      cy.location('hostname').should('eq', 'localhost') // not redirected anywhere
      cy.location('pathname').should('eq', '/')
      cy.get('[data-cy=checkout-button]').should('not.be.disabled') // customer can try again

      cy.getOrder(existing.id).its('status').should('not.eq', 'paid')
    })
  })
})

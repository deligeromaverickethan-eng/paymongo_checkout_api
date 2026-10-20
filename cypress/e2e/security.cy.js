const SECRET_KEY = /sk_(test|live)_/

describe('Security', () => {
  it('E2E-08: keeps the secret key out of the browser', () => {
    // Spy: the browser itself must never talk to api.paymongo.com
    cy.intercept('https://api.paymongo.com/**', cy.spy().as('browserToPayMongo'))

    // Real order request, but do not follow the redirect to PayMongo's own page
    cy.intercept('POST', '**/api/orders', (req) => {
      req.continue((res) => {
        if (res.body && res.body.order) res.body.order.checkoutUrl = null
      })
    }).as('createOrder')

    cy.visitShop()
    cy.addToCart('SIAI Cap')
    cy.get('[data-cy=checkout-button]').click()

    cy.wait('@createOrder').then(({ response }) => {
      expect(JSON.stringify(response.body)).not.to.match(SECRET_KEY)
    })
    cy.get('@browserToPayMongo').should('not.have.been.called')

    // No page or script the browser receives contains a key
    ;['/', '/payment-success.html', '/payment-cancel.html'].forEach((path) => {
      cy.request(path).its('body').should('not.match', SECRET_KEY)
    })
    cy.request('/').then(({ body }) => {
      const scripts = [...body.matchAll(/<script[^>]+src=["']([^"']+)["']/g)]
        .map((m) => m[1])
        .filter((src) => !/^https?:\/\//.test(src))
      scripts.forEach((src) => cy.request(src).its('body').should('not.match', SECRET_KEY))
    })
  })
})

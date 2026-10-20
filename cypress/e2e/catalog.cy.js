const PRODUCTS = 'http://localhost:3001/api/products'
const ORDERS = 'http://localhost:3002/api/orders'

describe('Catalog and cart validation', () => {
  it('E2E-01: shows the catalog with correct peso prices', () => {
    cy.fixture('products').then((products) => {
      cy.visitShop()
      cy.get('[data-cy=product-card]').should('have.length', products.length)

      products.forEach((p) => {
        cy.contains('[data-cy=product-name]', p.name)
          .closest('[data-cy=product-card]')
          .find('[data-cy=product-price]')
          .should('have.text', p.display) // centavos -> pesos, e.g. 35000 -> ₱350.00
      })

      // The Product Service really stores the centavo amounts we expect
      cy.request(PRODUCTS).its('body.products').then((stored) => {
        products.forEach((p) => {
          expect(stored.find((s) => s.id === p.id).price).to.eq(p.centavos)
        })
      })
    })
  })

  it('E2E-09: blocks checkout with an empty cart', () => {
    cy.intercept('POST', '**/api/orders').as('createOrder')
    cy.visitShop()

    // 1) UI: empty cart
    cy.get('[data-cy=checkout-button]').click()
    cy.get('[data-cy=alert-error]').should('contain', 'Cart is empty')

    // 2) UI: quantity left at 0
    cy.contains('[data-cy=product-name]', 'SIAI Cap')
      .closest('[data-cy=product-card]')
      .find('[data-cy=add-to-cart]')
      .click()
    cy.get('[data-cy=alert-error]').should('contain', 'Please select quantity')
    cy.get('[data-cy=cart-count]').should('have.text', '0 items')

    // The browser never asked the Order Service to create anything
    cy.get('@createOrder.all').should('have.length', 0)

    // 3) API: the Order Service itself rejects bad input (never trust the UI alone)
    const bad = [
      { label: 'no items', items: [], status: 400 },
      { label: 'quantity 0', items: [{ productId: 'p1', quantity: 0 }], status: 400 },
      { label: 'negative quantity', items: [{ productId: 'p1', quantity: -3 }], status: 400 },
      { label: 'decimal quantity', items: [{ productId: 'p1', quantity: 1.5 }], status: 400 },
      { label: 'unknown product', items: [{ productId: 'nope', quantity: 1 }], status: 404 },
    ]
    bad.forEach(({ label, items, status }) => {
      cy.request({
        method: 'POST',
        url: ORDERS,
        body: { items },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status, label).to.eq(status)
        expect(res.body.success, label).to.eq(false)
        expect(res.body.order, `${label}: no order created`).to.be.undefined
      })
    })
  })
})

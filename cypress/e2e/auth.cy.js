describe('Login and signup', () => {
  it('E2E-10: sends a logged-out visitor to the login page first', () => {
    cy.visit('/')
    cy.location('pathname').should('include', 'login.html')
    cy.get('[data-cy=login-form]').should('be.visible')
    cy.get('[data-cy=go-signup]').should('be.visible')

    // The shop itself is not reachable without logging in
    cy.visit('/index.html')
    cy.location('pathname').should('include', 'login.html')
    cy.get('[data-cy=product-card]').should('not.exist')
  })

  it('E2E-11: signs up, reaches the shop, then logs out and back in', () => {
    const email = `student${Date.now()}@school.edu.ph`

    // Sign up
    cy.visit('/signup.html')
    cy.get('[data-cy=signup-name]').type('Test Student')
    cy.get('[data-cy=signup-email]').type(email)
    cy.get('[data-cy=signup-password]').type('Passw0rd1')
    cy.get('[data-cy=signup-confirm]').type('Passw0rd1')
    cy.get('[data-cy=signup-submit]').click()

    // Lands on the shop, logged in
    cy.get('[data-cy=auth-greeting]').should('contain', 'Test Student')
    cy.get('[data-cy=product-card]').should('have.length.greaterThan', 0)

    // Log out sends us back to the login page
    cy.get('[data-cy=logout-button]').click()
    cy.location('pathname').should('include', 'login.html')

    // Wrong password is refused
    cy.get('[data-cy=login-email]').type(email)
    cy.get('[data-cy=login-password]').type('WrongPass1')
    cy.get('[data-cy=login-submit]').click()
    cy.get('[data-cy=form-message]').should('contain', 'Incorrect email or password')

    // Right password gets us back in
    cy.get('[data-cy=login-password]').clear().type('Passw0rd1')
    cy.get('[data-cy=login-submit]').click()
    cy.get('[data-cy=auth-greeting]').should('contain', 'Test Student')
  })
})

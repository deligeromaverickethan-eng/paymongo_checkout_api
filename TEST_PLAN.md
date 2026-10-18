# Test plan

| ID | Scenario | Spec file | Test name | Service owner | Author |
|---|---|---|---|---|---|
| E2E-01 | Catalog | `cypress/e2e/catalog.cy.js` | E2E-01: shows the catalog with correct peso prices | Product | |
| E2E-02 | Order creation | `cypress/e2e/orders.cy.js` | E2E-02: creates a pending order with the right total | Order | |
| E2E-03 | Checkout session | `cypress/e2e/checkout.cy.js` | E2E-03: gets a checkout URL from PayMongo | Payment | |
| E2E-04 | Hand-over | `cypress/e2e/checkout.cy.js` | E2E-04: hands the customer over to PayMongo | Payment | |
| E2E-05 | Success return | `cypress/e2e/orders.cy.js` | E2E-05: updates the order on the success page | Order | |
| E2E-06 | Cancel return | `cypress/e2e/orders.cy.js` | E2E-06: never marks a cancelled order as paid | Order | |
| E2E-07 | Checkout failure | `cypress/e2e/checkout.cy.js` | E2E-07: shows a clear error when checkout fails | Payment | |
| E2E-08 | No secrets | `cypress/e2e/security.cy.js` | E2E-08: keeps the secret key out of the browser | Product | |
| E2E-09 | Invalid checkout | `cypress/e2e/catalog.cy.js` | E2E-09: blocks checkout with an empty cart | Product | |

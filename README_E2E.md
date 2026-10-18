## Running the E2E tests

The tests drive a real browser (Cypress) through the shop, then check what the services stored.

### 1. One-time setup
```
npm install                    # in the project root (installs Cypress)
npx cypress verify             # if it says the binary is missing: npx cypress install
```
Add these to the `scripts` in the root `package.json`:
```
"test:e2e": "cypress run",
"cy:open": "cypress open"
```
Install each service once: `npm install` inside `product-service`, `order-service`, `payment-service`.
Put your PayMongo **test** key in `payment-service/.env` (copy `.env.example`). Tests never read it.

### 2. Start the system (4 terminals, all must stay open)
| Terminal | Folder | Command | Port |
|---|---|---|---|
| 1 | `product-service` | `npm start` | 3001 |
| 2 | `order-service` | `npm start` | 3002 |
| 3 | `payment-service` | `npm start` | 3003 |
| 4 | project root | `npx serve -l 3000 .` | 3000 |

`serve.json` in the root keeps the `?orderId=` part of the success and cancel links.

### 3. Seed data
The Product Service always starts with the same 5 products (fixed names and prices, e.g. SIAI T-Shirt = 35000 centavos = ₱350.00), so every run sees the same catalog. Each test creates its own orders. Restart the Order Service any time to clear old orders.

### 4. Run
```
npm run test:e2e     # headless, prints the summary, saves a video in cypress/videos
npm run cy:open      # optional: watch it in the Cypress window
```
E2E-03 and E2E-04 need internet (PayMongo sandbox).

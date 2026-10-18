const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000', // the UI (served by: npx serve -l 3000 .)
    video: true,                      // evidence for submission (off by default)
    retries: 0,                       // flaky tests must be fixed, not retried
    defaultCommandTimeout: 8000,      // order creation calls PayMongo, so give it room
  },
})

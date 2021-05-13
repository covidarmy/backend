const analyticsLib = require('analytics').default
const googleAnalytics = require('@analytics/google-analytics').default

const analytics = analyticsLib({
  app: 'test-signal',
  plugins: [
    googleAnalytics({
      trackingId: process.env.GA_KEY
    })
  ]
})
module.export=analytics;
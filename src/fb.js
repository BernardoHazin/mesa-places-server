/** @description Sets up facebook node api with "mesa places" credentials */
const { FB } = require('fb')
FB.options({
  version: process.env.FB_VERSION,
  appId: process.env.FB_APP_ID,
  appSecret: process.env.FB_APP_SECRET
})

module.exports = FB

const fs = require('fs')
const path = require('path')

module.exports.typeDefs = fs.readFileSync(
  path.resolve(__dirname, './schema.graphql'),
  {
    encoding: 'utf8'
  }
)
module.exports.resolvers = require('./resolver')

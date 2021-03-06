const { createServer } = require('http')
const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const config = require('./config/')
const models = require('./models')
const { graphiqlExpress, graphqlExpress } = require('graphql-server-express')
const { makeExecutableSchema } = require('graphql-tools')
const { execute, subscribe } = require('graphql')
const { SubscriptionServer } = require('subscriptions-transport-ws')
const { typeDefs, resolvers } = require('./gql')
const consola = require('consola')
const passport = require('./passport')
const path = require('path')

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})

app.use(bodyParser.json())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  optionsSuccessStatus: 200
}))

/** @description Forward user authentication  */
app.use((req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err || !user) req.session = err
    else req.user = user
    next()
  })(req, res, next)
})

/** @description setting up graphql endpoint */
app.use(
  '/graphql',
  graphqlExpress(req => ({ schema, context: { models, req } }))
)

const server = createServer(app)

/** @description starts server */
models.sequelize.sync({ force: process.env.NODE_ENV === 'dev' }).then(() => {
  server.listen(config.port, () => {
    new SubscriptionServer(
      {
        execute,
        subscribe,
        schema
      },
      {
        server,
        path: '/subscriptions'
      }
    )
    consola.success(`Server started at ${config.port}`)
  })
})

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
app.use(cors())

/** @description Forward user authentication  */
app.use((req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err || !user) req.session = err
    else req.user = user
    next()
  })(req, res, next)
})

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }))

/** @description setting up graphql endpoint */
app.use(
  '/graphql',
  graphqlExpress(req => ({ schema, context: { models, req } }))
)

/** @description serve client static files */
const dir = path.join(__dirname, './public')
app.use(express.static(dir))

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

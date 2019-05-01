const passport = require('passport')
const { User } = require('./models')
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const { authentication } = require('./config')

/** @description sets up passport.js for user authentication with json web token */
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: authentication.secret
    },
    async (playload, done) => {
      if (playload.id) {
        User.findOne({
          where: {
            id: playload.id
          }
        })
          .then(fetched => {
            if (!fetched || fetched.blocked) {
              return done(new Error(), false)
            }
            return done(null, fetched, 'User')
          })
          .catch(err => {
            return done(err, false)
          })
      } else done(new Error('Invalid token'), false)
    }
  )
)

module.exports = passport

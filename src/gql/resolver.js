const fetch = require('node-fetch')
const gravatar = require('gravatar')
const { GOOGLE_API_KEY, MAIL, authentication } = require('../config')
const { sign } = require('jsonwebtoken')
const FB = require('../fb')
const { PubSub } = require('graphql-subscriptions')
const nodemailer = require('nodemailer')

const pubsub = new PubSub()

/**
 * @args id => signed token containing the user id
 * @description returns change password email html
 */
const changePasswordHtml = id => `
  <html>
    <head>
      <style>
        @import url('https://fonts.googleapis.com/css?family=Poppins');
      
        body {
          font-family: 'Poppins', Helvetica, Arial, sans-serif;
        }
        
        img {
          border-radius: 50%;
        }
        
        a {
          background: #d94234;
          color: #ffffff;
          padding: 15px;
          font-weight: bold;
          border-radius: 10px;
        }
      </style>
    </head>
    <body>
    <center>
      <img src="data:image/png;base64,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" alt="">
      <h1>Mesa places</h1>
      <h2>Alterar senha</h2>
      <a href="https://mesa-places.herokuapp.com/#/${id}">Clique aqui para continuar</a>
      <h4>Você será direcionado para nossa página de alteração</h4>
    </center>
    </body>
  </html>
`

const emailRegex = new RegExp(
  /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
)

/**
 * @description Sets up email transporter with gmail service
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: MAIL.auth
})

/**
 * @args id => User id
 * @args expiration => token age in seconds
 * @description returns change password email html
 */
function signJWT(id, expiration) {
  return sign({ id }, authentication.secret, {
    expiresIn: expiration || authentication.expiration
  })
}

/**
 * @args models => signed token containing the user id
 * @args placeId => place's id
 * @description reusable function for fetching a place reviews
 */
function getReviews(models, { placeId }) {
  return models.Avaliation.findAndCountAll({
    where: { placeId: placeId },
    include: [{ model: models.User }]
  }).then(({ rows }) =>
    rows.map(({ User, rating, comment }) => ({
      name: User.name,
      placeId: placeId,
      email: User.email,
      profileImg: User.profileImg,
      rating: Number(rating),
      comment
    }))
  )
}

module.exports = {
  Mutation: {
    registerUser: async (parent, args, { models }) => {
      if (!emailRegex.test(args.email)) return new Error('Email inválido')
      if (args.password.length < 8)
        return new Error('Senha muito curta (Min. 8 caracteres)')
      args.profileImg = gravatar.url(
        args.email,
        { s: '200', r: 'x', d: 'retro' },
        true
      )
      return models.User.create(args)
        .then(({ id, email, name, profileImg }) => ({
          email,
          name,
          profileImg,
          token: signJWT(id),
          favorites: []
        }))
        .catch(err => {
          console.log(err.message)
          if (err.message === 'Validation error')
            return new Error('Este email já está em uso')
          else return new Error('Não foi possível efetuar o cadastro')
        })
    },
    addAvaliation: async (parent, args, { models, req }) => {
      if (!req.user) return new Error('Sessão inválida')
      const reviews = await models.Avaliation.findOrCreate({
        where: {
          userEmail: args.userEmail,
          placeId: args.placeId
        },
        defaults: args
      }).then(([avaliation, created]) => {
        if (!created) return new Error('Você já avaliou este lugar')
        return 'Avaliação criada'
      })
      const pubsubReviews = await getReviews(models, args)
      pubsub.publish('avaliationAdded', { avaliationAdded: pubsubReviews })
      return reviews
    },
    changePasswordRequest: async (parent, args, { req }) => {
      if (!req.user) return new Error('Sessão inválida')
      return transporter
        .sendMail({
          from: '"Mesa places" <suportemesaplaces@gmail.com>', // sender address
          to: req.user.email, // list of receivers
          subject: 'Alterar senha', // Subject line
          html: changePasswordHtml(signJWT(req.user.id, 60 * 5)) // html body
        })
        .then(message => {
          console.log(message)
          return 'Acesse seu email para continuar'
        })
    },
    changeName: async (parent, { name }, { models, req }) => {
      if (!req.user) return new Error('Sessão inválida')
      return req.user
        .update({
          name
        })
        .then(user => ({ name: user.name }))
    },
    setFavorite: async (
      parent,
      { placeId, placeName, placeIcon },
      { models, req }
    ) => {
      if (!req.user) return new Error('Sessão inválida')
      return models.Favorite.findOrCreate({
        where: {
          user: req.user.id,
          placeId
        },
        defaults: {
          placeName,
          placeIcon
        }
      }).then(([favorite, created]) => {
        console.log(created)
        if (!created) {
          favorite.destroy()
          return 'Favorito removido'
        }
        return 'Favorito adicionado'
      })
    },
    changePassword: async (
      parent,
      { password, newPassword },
      { models, req }
    ) => {
      if (!req.user) return new Error('Sessão inválida')
      const isValid = await req.user.comparePassword(password)
      if (!isValid) return new Error('Invalid password')
      await req.user.setNewPassword(newPassword)
      return 'Senha alterada com sucesso!'
    }
  },
  Query: {
    getPlace: async (parent, { place, lat, lng, radius }, { models }) => {
      let url = new URL(
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
      )
      url.searchParams.append('location', `${lat},${lng}`)
      url.searchParams.append('key', GOOGLE_API_KEY)
      url.searchParams.append('radius', radius * 1000)
      url.searchParams.append('name', place)
      url.searchParams.append('language', 'pt-BR')
      console.log(url.href)
      let response = await fetch(url.href)
      response = await response.json()
      return response.results.map(el => ({
        id: el.place_id,
        icon: el.icon,
        name: el.name,
        address: el.formatted_address,
        phone: el.formatted_phone_number,
        rating: el.rating,
        website: el.website,
        isOpen: el.opening_hours && el.opening_hours.open_now,
        lat: el.geometry.location.lat,
        lng: el.geometry.location.lng
      }))
    },
    login: async (parent, { email, password }, { models }) => {
      const user = await models.User.findOne({ where: { email } })
      if (!user) return new Error('Email ou senha incorretos')
      const isPasswordValid = await user.comparePassword(password)
      if (!isPasswordValid) return new Error('Email ou senha incorretos')
      const favorites = await models.Favorite.findAll({
        where: { user: user.id }
      })
      return {
        email: user.email,
        name: user.name,
        token: signJWT(user.id),
        profileImg: user.profileImg,
        favorites
      }
    },
    fbLogin: async (parent, { accessToken }, { models }) => {
      const { email, name } = await new Promise((resolve, reject) => {
        FB.api(
          '/me',
          { fields: 'email,name', access_token: accessToken },
          res => resolve(res)
        )
      })
      if (email && name) {
        return models.User.findOrCreate({
          where: {
            email,
            name
          },
          attributes: {
            exclude: ['password']
          },
          defaults: {
            password: '-',
            profileImg: gravatar.url(
              email,
              { s: '200', r: 'x', d: 'retro' },
              true
            )
          }
        }).then(async ([{ dataValues }, created]) => {
          let favorites = []
          if (!created) {
            favorites = await models.Favorite.findAll({
              where: { user: dataValues.id }
            })
          }
          return {
            ...dataValues,
            token: signJWT(dataValues.id),
            favorites
          }
        })
      } else return new Error('Não foi possível realizar a autenticação')
    },
    getAvaliations: async (parent, args, { models, req }) =>
      getReviews(models, args)
  },
  Subscription: {
    avaliationAdded: {
      subscribe: () => pubsub.asyncIterator('avaliationAdded')
    }
  }
}

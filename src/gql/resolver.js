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
      <img src="https://mesa-places-client.herokuapp.com/img/logo.0750b83f.png" alt="Logo">
      <h1>Mesa places</h1>
      <h2>Alterar senha</h2>
      <a href="https://mesa-places-client.herokuapp.com/#/${id}">Clique aqui para continuar</a>
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

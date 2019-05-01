require('dotenv').config()

module.exports = {
  port: process.env.PORT || 3000,
  SALT_FACTOR: 10,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
  MAIL: {
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  },
  db: {
    database: process.env.DB_NAME || 'test',
    options: {
      dialect: process.env.DIALECT || 'sqlite',
      storage: './safe.lite',
      logging: false
    }
  },
  authentication: {
    secret: process.env.SECRET,
    expiration: 60 * 60
  }
}

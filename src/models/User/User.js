const Promise = require('bluebird')
const bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'))
const { SALT_FACTOR } = require('../../config')

const hashPassword = (user, options) => {
  if (!user.changed('password')) {
    return
  }
  return bcrypt
    .genSaltAsync(SALT_FACTOR)
    .then(salt => bcrypt.hashAsync(user.password, salt, null))
    .then(hash => {
      user.setDataValue('password', hash)
    })
}

const comparePassword = async function(password) {
  return bcrypt.compareAsync(password, this.password)
}

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING(128).BINARY,
        unique: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(128).BINARY,
        allowNull: false
      },
      password: {
        type: DataTypes.STRING(128).BINARY,
        allowNull: false
      },
      profileImg: {
        type: DataTypes.STRING(128).BINARY
      }
    },
    {
      hooks: {
        beforeCreate: hashPassword
      }
    }
  )

  User.prototype.comparePassword = comparePassword

  User.prototype.setNewPassword = function(newPassword) {
    const SALT_FACTOR = 10
    bcrypt
      .genSaltAsync(SALT_FACTOR)
      .then(salt => bcrypt.hashAsync(newPassword, salt, null))
      .then(hash => {
        this.update({
          password: hash
        })
      })
  }

  User.associate = function(models) {
    // Set Associations
    // User.belongsTo(models.Wallet, {foreignKey: 'wallet'})
  }

  return User
}

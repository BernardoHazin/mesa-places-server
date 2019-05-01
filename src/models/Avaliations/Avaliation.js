module.exports = (sequelize, DataTypes) => {
  const Avaliation = sequelize.define('Avaliation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    placeId: {
      type: DataTypes.STRING(128).BINARY,
      allowNull: false
    },
    rating: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    comment: {
      type: DataTypes.STRING(200).BINARY
    }
  })

  Avaliation.associate = function(models) {
    // Set Associations
    Avaliation.belongsTo(models.User, {
      foreignKey: 'userEmail',
      targetKey: 'email'
    })
  }

  return Avaliation
}

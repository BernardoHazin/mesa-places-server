module.exports = (sequelize, DataTypes) => {
  const Favorite = sequelize.define('Favorite', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    placeId: {
      type: DataTypes.STRING(128).BINARY,
      allowNull: false
    },
    placeName: {
      type: DataTypes.STRING(128).BINARY
    },
    placeIcon: {
      type: DataTypes.STRING(128).BINARY
    }
  })

  Favorite.associate = function(models) {
    // Set Associations
    Favorite.belongsTo(models.User, {
      foreignKey: 'user',
      targetKey: 'id'
    })
  }

  return Favorite
}

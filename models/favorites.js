'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Favorites extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    Favorites.init({
        favoriteId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            required: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            required: true,
        },
        postId: {
            type: DataTypes.INTEGER,
            required: true,
        }
    }, {
        sequelize,
        modelName: 'Favorites',
    });
    Favorites.associate = function (models) {
        models.Favorites.hasMany(models.Users, {
            foreignKey: 'userId',
            onDelete: 'cascade',
        })
        models.Favorites.hasMany(models.Posts, {
            foreignKey: 'postId',
            onDelete: 'cascade',
        })
    }

    return Favorites;
};
'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Follows extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    Follows.init({
        followId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            required: true
        },
        followUserId: {
            type: DataTypes.INTEGER,
            required: true
        },
        followerUserId: {
            type: DataTypes.INTEGER,
            required: true
        }
    }, {
        sequelize,
        modelName: 'Follows',
    });
    Follows.associate = function (models) {
        models.Follows.hasMany(models.Users, {
            foreignKey:'followUserId',
            onDelete:'cascade',
        })
        models.Follows.hasMany(models.Users, {
            foreignKey:'followerUserId',
            onDelete:'cascade',
        })
    }
    return Follows;

};
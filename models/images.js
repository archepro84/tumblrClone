'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Images extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    Images.init({
        imageId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            required: true,
        },
        postId: {
            type: DataTypes.INTEGER,
            required: true,
        },
        img: {
            type: DataTypes.STRING(1000),
            required: true,
        },
    }, {
        sequelize,
        modelName: 'Images',
    });

    Images.associate = function (models) {
        models.Images.hasMany(models.Posts, {
            foreignKey: 'postId',
            onDelete: 'cascade',
        })
    }
    return Images;
};
'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Alarms extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    Alarms.init({
        alarmId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            required: true,
        },
        giverUserId: {
            type: DataTypes.INTEGER,
            required: true,
        },
        receiverUserId: {
            type: DataTypes.INTEGER,
            required: true,
        },
        type: {
            type: DataTypes.TINYINT,
            required: true,
        }
    }, {
        sequelize,
        modelName: 'Alarms',
    });

    Alarms.associate = function (models) {
        //참조할 때 Users 테이블에서 참조하는 기본키를 지정해줘야한다.
        models.Alarms.hasMany(models.Users, {
            foreignKey: 'userId',
            onDelete: 'cascade',
        })
    }

    return Alarms;
};
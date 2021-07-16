'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Alarms', {
            alarmId: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            giverUserId: {
                type: Sequelize.INTEGER
            },
            receiverUserId: {
                type: Sequelize.INTEGER
            },
            type: {
                type: Sequelize.TINYINT
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Alarms');
    }
};
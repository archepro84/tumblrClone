'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Follows', {
            followId: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            followUserId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'userId'
                },
                onDelete: 'cascade',
            },
            followerUserId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'userId'
                },
                onDelete: 'cascade',
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        })
            .then(() => {
                const TR_Follows_Alarm_Query = `
                CREATE TRIGGER TR_Follows_Alarm
                AFTER INSERT ON Follows
                FOR EACH ROW
                BEGIN
                    INSERT INTO Alarms (giverUserId, receiverUserId, type, createdAt, updatedAt) values
                        (NEW.followUserId, NEW.followerUserId, 1, NOW(), NOW() );
                END`
                queryInterface.sequelize.query(TR_Follows_Alarm_Query)
            });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Follows');
    }
};
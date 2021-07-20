'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Favorites', {
            favoriteId: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'userId'
                },
                onDelete: 'cascade',
            },
            postId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Posts',
                    key: 'postId'
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
                const TR_Favorites_Alarm = `
                CREATE TRIGGER TR_Favorites_Alarm
                AFTER INSERT ON Favorites
                FOR EACH ROW
                BEGIN
                    INSERT INTO Alarms (giverUserId, receiverUserId, type, createdAt, updatedAt) values
                        (NEW.userId, (SELECT userId FROM Posts WHERE postId = NEW.postId), 3, NOW(), NOW() );
                END `
                queryInterface.sequelize.query(TR_Favorites_Alarm)

            });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Favorites');
    }
};
'use strict';
module.exports = {
    up: async (queryInterface, Sequelize, migration) => {
        await queryInterface.createTable('Posts', {
            postId: {
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
            reBlog: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Posts',
                    key: 'postId'
                },
                onDelete: 'set null',
            },
            title: {
                type: Sequelize.STRING
            },
            content: {
                type: Sequelize.STRING(3000)
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
                const TR_Posts_Query = `
                    CREATE TRIGGER TR_Posts
                    AFTER UPDATE ON Posts
                    FOR EACH ROW
                    BEGIN
                        DELETE FROM Images WHERE postId = old.postId;
                        DELETE FROM Tags WHERE postId = old.postId;
                    END `
                queryInterface.sequelize.query(TR_Posts_Query)
            })
            .then(() => {
                const TR_Posts_reBlog_Alarm = `
                CREATE TRIGGER TR_Posts_reBlog_Alarm
                AFTER INSERT ON Posts
                FOR EACH ROW
                BEGIN
                    IF (NEW.reBlog IS NOT NULL) THEN 
                        INSERT INTO Alarms (giverUserId, receiverUserId, type, createdAt, updatedAt) values
                            (NEW.userId, (SELECT userId FROM Posts WHERE postId = NEW.reBlog), 2, NOW(), NOW() );
                    END IF;
                END`
                queryInterface.sequelize.query(TR_Posts_reBlog_Alarm)
            });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Posts');
    }
};
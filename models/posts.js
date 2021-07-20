'use strict';
const {
    Model
} = require('sequelize');


module.exports = (sequelize, DataTypes) => {
    class Posts extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    Posts.init({
        postId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            required: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            required: true,
        },
        reBlog: {
            type: DataTypes.INTEGER
        },
        title: {
            type: DataTypes.STRING,
        },
        content: {
            type: DataTypes.STRING(3000),
        },
    }, {
        modelName: 'Posts',
        sequelize,
    });

    Posts.associate = function (models) {
        models.Posts.hasMany(models.Users, {
            foreignKey: 'userId',
            onDelete: 'cascade',
        })
    }

    // Posts.addHook('afterBulkUpdate', (post, options) => {
    //     console.log("post");
    //     console.log(post);
    //     const postId = post.where.postId;
    //     models.Images.destroy({
    //         where: {postId}
    //     })
    // })

    return Posts;
};
const express = require("express");
const router = express.Router();
const authMiddleware = require('../middlewares/auth-middleware')
const authMiddlewareAll = require("../middlewares/auth-middlewareAll")
const {Posts, Images, Tags, sequelize, Sequelize} = require("../models");
const Joi = require("joi");

const startLimitSchema = Joi.object({
    start: Joi.number().min(0).required(),
    limit: Joi.number().min(1).required(),
})
const detailSchema = Joi.object({
    postId: Joi.number().min(1).required(),
    start: Joi.number().min(0).required(),
    limit: Joi.number().min(1).required(),
})
const postIdSchema = Joi.number().required();

//reBlog : 숫자형이면서 null도 허용한다.
const writePostSchema = Joi.object({
    title: Joi.string().min(1).max(50).allow(null, '').required(),
    reBlog: Joi.number().allow(null).required(),
    img: Joi.array().required(),
    content: Joi.string().min(1).max(1000).required(),
    tag: Joi.array().required(),
})

const modifyPostSchema = Joi.object({
    postId: Joi.number().min(1).required(),
    title: Joi.string().min(1).max(50).allow(null, '').required(),
    reBlog: Joi.number().allow(null).required(),
    img: Joi.array().required(),
    content: Joi.string().min(1).max(1000).required(),
    tag: Joi.array().required(),
})

router.route('/')
    .get(authMiddlewareAll, async (req, res) => {
        try {
            let result = Array()
            const userId = res.locals.user ? res.locals.user.userId : 0
            const {postId, start, limit} = await detailSchema.validateAsync(
                Object.keys(req.query).length ? req.query : req.body
            )

            const query = `
                SELECT u.userId, u.nickname, u.profileImg, p.postId, p.reBlog, p.title,
                (SELECT GROUP_CONCAT(img ORDER BY img ASC SEPARATOR ', ')
                    FROM Images
                    WHERE postId = p.postId
                    GROUP BY postId) AS img,
                p.content,
                (SELECT GROUP_CONCAT(tag ORDER BY tag ASC SEPARATOR ', ')
                    FROM Tags
                    WHERE postId = p.postId
                    GROUP BY postId) AS tag,
                CASE WHEN p.postId IN (SELECT postId FROM Favorites WHERE userId=${userId}) THEN "Y" ELSE "N" END AS favorite,
                (SELECT COALESCE(MIN('Y'), 'N')
                    FROM Follows
                    WHERE EXISTS (SELECT 1 FROM  Follows WHERE followUserId=${userId} AND followerUserId=p.userId)) AS follow,
                (SELECT COUNT(*) FROM Favorites WHERE postId=p.postId) +
                    (SELECT COUNT(*) FROM Posts WHERE reBlog=p.postId) AS reactionCount,
                p.createdAt
                FROM Posts AS p
                INNER JOIN Users AS u
                USING(userId)
                ORDER BY 
                    CASE WHEN postId=${postId} THEN 1
                    ELSE 0 END DESC,
                    createdAt DESC,
                    postId DESC
                LIMIT ${start}, ${limit}`

            await sequelize.query(query, {type: Sequelize.QueryTypes.SELECT})
                .then((searchArray) => {
                    for (const search of searchArray) {
                        let img = Array(), tag = Array();
                        if (search.img)
                            img = search.img.split(', ')
                        if (search.tag)
                            tag = search.tag.split(', ')

                        result.push(
                            {
                                userId: search.userId,
                                nickname: search.nickname,
                                profileImg: search.profileImg,
                                postId: search.postId,
                                reBlog: search.reBlog,
                                title: search.title,
                                img,
                                content: search.content,
                                tag,
                                reactionCount: search.reactionCount,
                                favorite: search.favorite,
                                follow: search.follow,
                                createdAt: search.createdAt
                            }
                        )
                    }
                })
            res.send({result})
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412).send(
                {errorMessage: "게시글을 정상적으로 가져오지 못했습니다."}
            )
        }
    })
    .post(authMiddleware, async (req, res) => {
        try {
            const {userId} = res.locals.user
            const {title, reBlog, img, content, tag} = await writePostSchema.validateAsync(req.body)
            const tagArray = Array(), imgArray = Array();

            // create를할 때 reBlog에 해당하는 postId가 없을 경우 에러가 발생한다.
            const postId = await Posts.create({userId, title, reBlog, content})
                .then((post) => {
                    // post.null의 데이터는 생성된 post의 postId
                    return post.null;
                })


            if (Object.keys(tag).length) {
                for (const t of tag) {
                    tagArray.push({postId, tag: t})
                }
                await Tags.bulkCreate(tagArray)
            }

            if (Object.keys(img).length) {
                for (const i of img) {
                    imgArray.push({postId, img: i})
                }
                await Images.bulkCreate(imgArray)
            }

            res.send({postId})
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412).send(
                {errorMessage: "게시글 작성에 실패하였습니다."}
            )
        }
    })

    // 트리거를 사용해서 Posts의 데이터가 수정되었을 경우 Images, Tags를 삭제하도록 하자
    .put(authMiddleware, async (req, res) => {
        try {
            const userId = res.locals.user.userId
            const {postId, title, reBlog, img, content, tag} = await modifyPostSchema.validateAsync(req.body)
            const tagArray = Array(), imgArray = Array();

            await Posts.findOne({
                where: {userId, postId}
            })
                .then((user) => {
                    if (!user) throw new Error("Post 작성자와 일치하지 않습니다.")
                })

            await Posts.update({title, reBlog, content}, {
                where: {userId, postId}
            })
                .then((updateCount) => {
                    if (updateCount < 1)
                        throw new Error("변경된 데이터가 존재하지 않습니다.")
                })

            if (Object.keys(tag).length) {
                for (const t of tag) {
                    tagArray.push({postId, tag: t})
                }
                await Tags.bulkCreate(tagArray)
            }

            if (Object.keys(img).length) {
                for (const i of img) {
                    imgArray.push({postId, img: i})
                }
                await Images.bulkCreate(imgArray)
            }

            res.send()
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412).send(
                {errorMessage: "게시글을 정상적으로 가져오지 못했습니다."}
            )
        }
    })
    .delete(authMiddleware, async (req, res) => {
        try {
            const {userId} = res.locals.user;
            const postId = await postIdSchema.validateAsync(req.body.postId);

            await Posts.destroy({
                where: {
                    postId,
                    userId,
                },
            }).then((deleteCount) => {
                if (deleteCount < 1) {
                    res.status(400).send({
                        errorMessage: "데이터가 삭제되지 않았습니다.",
                    });
                }
            });
            res.status(200).send();
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412).send(
                {errorMessage: "게시글 삭제에 실패하였습니다."}
            );
        }
    });

router.route('/posts')
    .get(authMiddlewareAll, async (req, res) => {
        try {
            // userId가 존재하지 않을경우 0으로 삽입한다.
            const userId = res.locals.user ? res.locals.user.userId : 0
            const {start, limit} = await startLimitSchema.validateAsync(
                Object.keys(req.query).length ? req.query : req.body)
            let result = Array()

            const query = `
                SELECT u.userId, u.nickname, u.profileImg, p.postId, p.reBlog, p.title,
                (SELECT GROUP_CONCAT(img ORDER BY img ASC SEPARATOR ', ')
                    FROM Images
                    WHERE postId = p.postId
                    GROUP BY postId) AS img,
                p.content,
                (SELECT GROUP_CONCAT(tag ORDER BY tag ASC SEPARATOR ', ')
                    FROM Tags
                    WHERE postId = p.postId
                    GROUP BY postId) AS tag,
                CASE WHEN p.postId IN (SELECT postId FROM Favorites WHERE userId=${userId}) THEN "Y" ELSE "N" END AS favorite,
                (SELECT COALESCE(MIN('Y'), 'N')
                    FROM Follows
                    WHERE EXISTS (SELECT 1 FROM  Follows WHERE followUserId = ${userId} AND followerUserId=p.userId)) AS follow,
                (SELECT COUNT(*) FROM Favorites WHERE postId=p.postId) AS reactionCount,
                p.createdAt
                FROM Posts AS p
                INNER JOIN Users AS u
                USING(userId)
                ORDER BY p.createdAt DESC, p.postId DESC
                LIMIT ${start},${limit}`

            //Sequelize.query에서 에러가 발생할 경우 catch로 들어간다.
            await sequelize.query(query, {type: Sequelize.QueryTypes.SELECT})
                .then((searchArray) => {
                    for (const search of searchArray) {
                        let img = Array(), tag = Array();
                        if (search.img)
                            img = search.img.split(', ')
                        if (search.tag)
                            tag = search.tag.split(', ')

                        result.push(
                            {
                                userId: search.userId,
                                nickname: search.nickname,
                                profileImg: search.profileImg,
                                postId: search.postId,
                                reBlog: search.reBlog,
                                title: search.title,
                                img,
                                content: search.content,
                                tag,
                                reactionCount: search.reactionCount,
                                favorite: search.favorite,
                                follow: search.follow,
                                createdAt: search.createdAt
                            }
                        )
                    }
                })
            res.send({result})

        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412).send(
                {errorMessage: "데이터 검색에 실패하였습니다."}
            )
        }
    })

router.route('/user')
    .get(authMiddleware, async (req, res) => {
        try {
            const {userId} = res.locals.user
            const {start, limit} = await startLimitSchema.validateAsync(
                Object.keys(req.query).length ? req.query : req.body
            )
            let result = Array()
            const query = `
                SELECT userId, postId, reBlog, title, 
                (SELECT GROUP_CONCAT(img ORDER BY img ASC SEPARATOR ', ')
                    FROM Images
                    WHERE postId = p.postId
                    GROUP BY postId) AS img,
                content,
                (SELECT GROUP_CONCAT(tag ORDER BY tag ASC SEPARATOR ', ')
                    FROM Tags
                    WHERE postId = p.postId
                    GROUP BY postId) AS tag,
                (SELECT COUNT(*) FROM Favorites WHERE postId=p.postId) +
                    (SELECT COUNT(*) FROM Posts WHERE reBlog=p.postId) AS reactionCount
                FROM Posts AS p
                where userId=${userId}
                ORDER BY createdAt DESC, 
                    postId DESC
                LIMIT ${start},${limit}`

            await sequelize.query(query, {type: Sequelize.QueryTypes.SELECT})
                .then((searchArray) => {
                    for (const search of searchArray) {
                        let img = Array(), tag = Array();
                        if (search.img)
                            img = search.img.split(', ')
                        if (search.tag)
                            tag = search.tag.split(', ')

                        result.push({
                            postId: search.postId,
                            reBlog: search.reBlog,
                            title: search.title,
                            img,
                            content: search.content,
                            tag,
                            reactionCount: search.reactionCount,
                            createdAt: search.createdAt
                        })
                    }
                })
            res.send({result})
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412).send(
                {errorMessage: "작성게시글을 가져올 수 없습니다."}
            )
        }
    })

router.route('/like')
    .get(authMiddleware, async (req, res) => {
        try {
            const userId = res.locals.user.userId
            const {start, limit} = await startLimitSchema.validateAsync(
                Object.keys(req.query).length ? req.query : req.body
            )
            let result = Array()
            const query = `
                SELECT DISTINCT u.userId, u.nickname, u.profileImg, p.postId, p.reBlog, p.title, 
                (SELECT GROUP_CONCAT(img ORDER BY img ASC SEPARATOR ', ')
                    FROM Images
                    WHERE postId = p.postId
                    GROUP BY postId) AS img,
                p.content,
                (SELECT GROUP_CONCAT(tag ORDER BY tag ASC SEPARATOR ', ')
                    FROM Tags
                    WHERE postId = p.postId
                    GROUP BY postId) AS tag,
                (SELECT COUNT(*) FROM Favorites WHERE postId=p.postId) +
                    (SELECT COUNT(*) FROM Posts WHERE reBlog=p.postId) AS reactionCount,
                (SELECT COALESCE(MIN('Y'), 'N')
                    FROM Follows
                    WHERE EXISTS (SELECT 1 FROM  Follows WHERE followUserId = ${userId} AND followerUserId=p.userId)) AS follow,
                f.createdAt
                FROM Posts AS p
                INNER JOIN Users AS u
                ON p.userId = u.userId 
                INNER JOIN Favorites AS f
                ON f.userId = ${userId}
                WHERE f.postId = p.postId
                ORDER BY createdAt DESC,
                    postId DESC
                LIMIT ${start},${limit}`
            await sequelize.query(query, {type: Sequelize.QueryTypes.SELECT})
                .then((searchArray) => {
                    for (const search of searchArray) {
                        let img = Array(), tag = Array();
                        if (search.img)
                            img = search.img.split(', ')
                        if (search.tag)
                            tag = search.tag.split(', ')

                        result.push({
                            userId: search.userId,
                            nickname: search.nickname,
                            profileImg: search.profileImg,
                            postId: search.postId,
                            reBlog: search.reBlog,
                            title: search.title,
                            img,
                            content: search.content,
                            tag,
                            reactionCount: search.reactionCount,
                            createdAt: search.createdAt
                        })
                    }
                })

            res.send({result})
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412).send(
                {errorMessage: "좋아요를 추가한 게시글을 가져올 수 없습니다."}
            )
        }
    })

router.route('/blogs')
    .get(authMiddleware, async (req, res) => {
        try {
            const {userId} = res.locals.user
            const limit = 5;
            const query = `
            SELECT userId, nickname, profileImg FROM Users
            WHERE userId NOT IN (SELECT followerUserId FROM Follows WHERE followUserId = ${userId})
            AND userId != ${userId}
            ORDER BY RAND()
            LIMIT ${limit}`
            await sequelize.query(query, {type: Sequelize.QueryTypes.SELECT})
                .then((result) => {
                    res.send(result)
                })


        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412).send(
                {errorMessage: "추천 블로그를 가져올 수 없습니다."}
            )
        }
    })

module.exports = router;

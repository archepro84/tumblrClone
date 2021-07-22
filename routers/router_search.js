const express = require("express");
const router = express.Router();
const {sequelize, Sequelize} = require("../models")
const Joi = require("joi")
const authMiddlewareAll = require("../middlewares/auth-middlewareAll")

// TODO 검색 정규표현식을 좀더 구체화 시키도록 하자
const searchSchema = Joi.object({
    keyword: Joi.string().pattern(new RegExp("^[ㄱ-ㅎ|ㅏ-ㅣ|가-힣\\s|0-9a-zA-z]{1,30}$")).required(),
    start: Joi.number().min(0).required(),
    limit: Joi.number().min(1).required()
})
router.route('/')
    .get(authMiddlewareAll, async (req, res) => {
        try {
            // userId가 존재하지 않을경우 0으로 삽입한다.
            const userId = res.locals.user ? res.locals.user.userId : 0
            const {keyword, start, limit} = await searchSchema.validateAsync(
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
                WHERE p.title LIKE '%${keyword}%' 
                    OR p.content LIKE '%${keyword}%'
                    OR postId IN (SELECT postId FROM Tags WHERE tag LIKE '%${keyword}%') 
                ORDER BY p.createdAt DESC
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

module.exports = router;
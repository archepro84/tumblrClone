const express = require("express");
const router = express.Router();
const {sequelize, Sequelize} = require("../models")
const Joi = require("joi")

const postIdStartLimitSchema = Joi.object({
    postId: Joi.number().min(1).required(),
    start: Joi.number().min(0).required(),
    limit: Joi.number().min(1).required()
})
router.route('/')
    .get(async (req, res) => {
        try {
            const {postId, start, limit} = await postIdStartLimitSchema.validateAsync(
                Object.keys(req.query).length ? req.query : req.body
            )
            const query = `
            SELECT u.userId, u.nickname, 1 AS type, u.profileImg, p.createdAt
            FROM Posts AS p
            INNER JOIN Users AS u
            ON p.userId = u.userId 
            WHERE reBlog = ${postId}
            
            UNION ALL
            
            SELECT u.userId, u.nickname, 3 AS type, u.profileImg, f.createdAt
            FROM Favorites AS f
            INNER JOIN Users AS u
            ON f.userId = u.userId
            WHERE f.postId = ${postId}
            ORDER BY createdAt DESC
            LIMIT ${start},${limit}`

            const result = await sequelize.query(query, {type: Sequelize.QueryTypes.SELECT})

            res.send({result})
        } catch (error) {
            res.status(412).send(
                {errorMessage: "데이터 검색에 실패 하였습니다."}
            )
        }
    })

module.exports = router;
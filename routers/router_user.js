const express = require("express")
const authMiddleware = require("../middlewares/auth-middleware");
// const connection = require("../assets/mySqlLib");
const {Users, sequelize, Sequelize} = require("../models");
const router = express.Router();
const Joi = require("joi");

const followSchema = Joi.object({
    start: Joi.number().min(0).required(),
    limit: Joi.number().min(1).required(),
});

const profileSchema = Joi.object({
    profileImg: Joi.string().required()
})

router.route('/me')
    .post(authMiddleware, async (req, res) => {
        try {
            const {userId, nickname, profileImg} = res.locals.user;
            res.send({userId, nickname, profileImg})
        } catch (error) {
            res.status(400).send(
                {errorMessage: "인증에 실패하였습니다."}
            )
        }
    })

router.route('/profile')
    .post(authMiddleware, async (req, res) => {
        try {
            const {userId} = res.locals.user
            const {profileImg} = await profileSchema.validateAsync(req.body)

            await Users.update({profileImg}, {where: {userId}})
                .then((updateCount) => {
                    if (updateCount < 1)
                        throw new Error("프로필 수정이 정상적으로 처리되지 않았습니다.")
                })
            res.send()
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412).send(
                {errorMessage: "프로필 수정에 실패하였습니다."}
            )
        }
    })

router.route("/follower")
    .get(authMiddleware, async (req, res) => {
        try {
            let result = Array()
            const {start, limit} = await followSchema.validateAsync(
                Object.keys(req.query).length ? req.query : req.body
            );
            const {userId} = res.locals.user;
            const query_result = `
                SELECT DISTINCT userId, nickname, profileImg,
                (SELECT COALESCE(MIN('Y'), 'N')
                    FROM Follows
                    WHERE EXISTS (SELECT 1 FROM  Follows WHERE followUserId = ${userId} AND followerUserId=userId)) AS follow
                FROM Users
                WHERE userId IN (SELECT followUserId FROM Follows where followerUserId = ${userId})
                LIMIT ${start},${limit}`; // LIMIT 마지막에 써주어야 함!

            await sequelize.query(query_result, {type: Sequelize.QueryTypes.SELECT})
                .then((searchList) => {
                    if (searchList.length < 1) {
                        res.status(400).send({errorMessage: "데이터 검색이 실패했습니다."});
                        return;
                    }
                    for (const search of searchList) {
                        result.push({
                            userId: search.userId,
                            nickname: search.nickname,
                            profileImg: search.profileImg,
                            follows: search.follow == 'Y' ? true : false
                        })
                    }
                    res.status(200).send({followerCount: result.length, result});
                })
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res
                .status(412)
                .send({errorMessage: "입력한 데이터 형식이 일치하지 않습니다."});
        }
    })

router.route("/following")
    .get(authMiddleware, async (req, res) => {
        try {
            const {start, limit} = await followSchema.validateAsync(
                Object.keys(req.query).length ? req.query : req.body
            );
            const {userId} = res.locals.user;

            const query_result = `
                SELECT userId, nickname, profileImg
                FROM Users
                WHERE userId IN (SELECT followerUserId FROM Follows where followUserId = ${userId})
                LIMIT ${start},${limit}`; // LIMIT 마지막에 써주어야 함!

            await sequelize.query(query_result, {type: Sequelize.QueryTypes.SELECT})
                .then((result) => {
                    if (result.length < 1) {
                        res.status(400).send({errorMessage: "데이터 검색이 실패했습니다."});
                        return;
                    }
                    res.status(200).send({followingCount: result.length, result});
                })
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res
                .status(412)
                .send({errorMessage: "입력한 데이터 형식이 일치하지 않습니다."});
        }
    });


module.exports = router;
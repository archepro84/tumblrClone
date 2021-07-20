const express = require("express");
const router = express.Router();
const Joi = require("joi")
const authMiddleware = require("../middlewares/auth-middleware")
const {Users, Follows, sequelize, Sequelize} = require("../models")
const {Op} = require("sequelize")

const userIdSchema = Joi.number().min(1).required()
router.route('/')
    // TODO 팔로우 추가를 좀더 DB를 적게 통신해서 확인할 수 없을까?
    .post(authMiddleware, async (req, res) => {
        try {
            const followUserId = res.locals.user.userId
            const followerUserId = await userIdSchema.validateAsync(req.body.userId)
            if (followUserId == followerUserId)
                throw new Error("자신을 팔로우 추가할 수 없습니다.")

            const query = `
                SELECT
                CASE WHEN ${followerUserId} IN (SELECT userId FROM Users) THEN 'Y' ELSE 'N' END AS isExist,
                COALESCE(MIN('Y'), 'N') AS Following
                FROM Follows
                WHERE EXISTS ( SELECT 1 
                             FROM Follows 
                             WHERE followUserId = ${followUserId} AND followerUserId = ${followerUserId});`
            const queryResult = await sequelize.query(query, {type: Sequelize.QueryTypes.SELECT})
            const {isExist, Following} = queryResult[0]

            if (isExist == 'N')
                throw new Error("팔로우하려는 계정이 존재하지 않습니다.")
            else if (Following == 'Y')
                throw new Error("이미 팔로우되어 있습니다.")
            else {
                await Follows.create({followUserId, followerUserId})
                res.send()
            }
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412).send(
                {errorMessage: "팔로우 추가에 실패하였습니다."}
            )
        }
    })
    .delete(authMiddleware, async (req, res) => {
        try {
            const followUserId = res.locals.user.userId
            const followerUserId = await userIdSchema.validateAsync(req.body.userId)
            if (followUserId == followerUserId)
                throw new Error("자신을 팔로우 삭제할 수 없습니다.")

            const query = `
                SELECT
                CASE WHEN ${followerUserId} IN (SELECT userId FROM Users) THEN 'Y' ELSE 'N' END AS isExist,
                COALESCE(MIN('Y'), 'N') AS Following
                FROM Follows
                WHERE EXISTS ( SELECT 1 
                             FROM Follows 
                             WHERE followUserId = ${followUserId} AND followerUserId = ${followerUserId});`
            const queryResult = await sequelize.query(query, {type: Sequelize.QueryTypes.SELECT})
            const {isExist, Following} = queryResult[0]

            if (isExist == 'N')
                throw new Error("팔로우 취소하려는 계정이 존재하지 않습니다.")
            else if (Following == 'N')
                throw new Error("상대방과 팔로우 상태가 아닙니다.")
            else {
                await Follows.destroy({
                    where: {followUserId, followerUserId}
                })
                    .then((destoryCount) => {
                        if (destoryCount < 1)
                            throw new Error("팔로우 삭제에 실패하였습니다.")
                        res.send()
                    })
            }
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412).send(
                {errorMessage: "팔로우 삭제에 실패하였습니다."}
            )
        }
    })
    // TODO 테스트용 삭제가 필요
    .get(async (req, res) => {
        try {
            const user = await sequelize.query('SELECT * FROM Posts', {type: Sequelize.QueryTypes.SELECT})
            console.log(user);
            res.send(user)
        } catch (error) {
            res.status(400).send({
                errorMessage: "Error "
            })
        }
    })

module.exports = router;
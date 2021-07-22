const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth-middleware");
const Joi = require("joi")
const {Favorites} = require("../models");

const postIdSchema = Joi.object({
    postId: Joi.number().min(1).required()
})
router.route("/")
    .post(authMiddleware, async (req, res) => {
        try {
            const {userId} = res.locals.user;
            const {postId} = await postIdSchema.validateAsync(req.body);

            //상대 포스트가 없다면?
            await Favorites.findAll({
                where: {userId, postId},
            }).then((find) => {
                if (find.length) {
                    res.status(412).send({
                        errorMessage: "이미 좋아요를 했습니다.",
                    });
                    return;
                }
            });
            await Favorites.create({
                userId,
                postId,
            }).then((result) => {
                res.status(200).send();
            });
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412)
                .send({errorMessage: "데이터베이스에 저장하는데 실패했습니다."});
        }
    })
    .delete(authMiddleware, async (req, res) => {
        try {
            const userId = res.locals.user.userId;
            const {postId} = await postIdSchema.validateAsync(req.body);

            await Favorites.findAll({
                where: {userId, postId},
            }).then((find) => {
                if (find.length == 0) {
                    res.status(412).send({
                        errorMessage: "이미 좋아요가 해제되어 있습니다.",
                    });
                    return;
                }
            });

            await Favorites.destroy({
                where: {
                    userId,
                    postId,
                },
            }).then((result) => {
                res.status(200).send();
            });
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412).send({
                errorMessage: "좋아요 해제가 정상적으로 처리되지 않았습니다.",
            });
        }
    });

module.exports = router;

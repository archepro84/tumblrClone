const express = require("express");
const router = express.Router();
const {Users} = require("../models")
const {Op} = require("sequelize")
const Joi = require("joi")
const loginCheckMiddleware = require("../middlewares/login-check-middleware");

const signSchema = Joi.object({
    email: Joi.string().pattern(new RegExp(
        "^[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*\\.[a-zA-Z]{2,6}$")).required(),
    password: Joi.string().pattern(new RegExp(
        "^(?=.*[a-zA-Z0-9])((?=.*\\d)|(?=.*\\W)).{6,20}$")).required(),
    nickname: Joi.string().pattern(new RegExp(
        "^[ㄱ-ㅎ|ㅏ-ㅣ|가-힣\\s|0-9a-zA-z]{3,20}$")).required()
})

router.route('/')
    .post(loginCheckMiddleware, async (req, res) => {
            try {
                const {email, nickname, password} = await signSchema.validateAsync(req.body)
                const user = await Users.findOne({
                    where: {[Op.or]: [{email}, {nickname}]}
                })
                if (user != null) {
                    res.send(false)
                    return;
                }
                await Users.create({email, nickname, password})
                res.send(true)
            } catch (error) {
                console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
                res.send(false)
            }
        }
    )

module.exports = router;
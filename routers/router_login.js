const express = require("express");
const {Users} = require("../models");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const loginCheckMiddleware = require("../middlewares/login-check-middleware")
const router = express.Router();
require("dotenv").config();

const loginSchema = Joi.object({
    email: Joi.string()
        .required()
        .pattern(
            /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,6}$/i
        ),
    password: Joi.string()
        .required()
        .pattern(/^(?=.*[a-zA-Z0-9])((?=.*\d)|(?=.*\W)).{6,20}$/),
});

const emailSchema = Joi.object({
    email: Joi.string()
        .required()
        .pattern(
            /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,6}$/i
        ),
});

router.route("/")
    .post(loginCheckMiddleware, async (req, res) => {
        try {
            const {email, password} = await loginSchema.validateAsync(req.body);
            const user = await Users.findOne({
                where: {email, password},
            })
                .then((user) => {
                    return user['dataValues'];
                });
            if (!user) {
                res.status(401).send({
                    errorMessage: "이메일 또는 패스워드가 잘못되었습니다.",
                });
                return;
            }
            const token = jwt.sign({userId: user.userId}, process.env.SECRET_KEY);

            res.cookie("authorization", token);
            res.send({
                token,
                userId: user.userId,
                nickname: user.nickname,
                profileImg: user.profileImg
            });

        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412).send({
                errorMessage: "요청한 데이터가 올바르지 않습니다.",
            });
        }
    });

router.route("/email")
    .post(loginCheckMiddleware, async (req, res) => {
        try {
            const {email} = await emailSchema.validateAsync(req.body);

            const existUsers = await Users.findAll({
                where: {email}, // 변수는 변수 한개만 넣어줘도 모든 속성 값에서 찾아줄 수 있다.
            });

            if (existUsers.length)
                throw new Error("이미 이메일이 존재 합니다.")
            else
                res.status(200).send();

        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(401).send(
                {errorMessage: "이메일 중복 검사에 실패하였습니다."}
            )
        }
    });


module.exports = router;
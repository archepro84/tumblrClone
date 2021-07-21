const jwt = require("jsonwebtoken")
const Joi = require("joi")
const {Users} = require("../models");
require('dotenv').config();

const authorizationSchema = Joi.string().required()
module.exports = async (req, res, next) => {
    try {
        const Authorization = await authorizationSchema.validateAsync(
            req.cookies.Authorization ? req.cookies.Authorization : req.headers.authorization)
        const {userId} = jwt.verify(Authorization, process.env.SECRET_KEY);

        await Users.findByPk(userId)
            .then((user) => {
                res.locals.user = user['dataValues']
            })
        next()
    } catch (error) {
        // cookie 값이 없거나, 인증에 실패하였을 경우 실행된다.
        // userId의 형식이 다르더라도 findByPk에서 에러가 발생하기 때문에 Catch에서 처리된다.
        res.status(401).send(
            {errorMessage: "사용자 인증에 실패하였습니다."}
        )
    }
}
const jwt = require("jsonwebtoken")
const Joi = require("joi")
const {Users} = require("../models");
require('dotenv').config();

const authorizationSchema = Joi.string().required()
module.exports = async (req, res, next) => {
    try {
        const Authorization = await authorizationSchema.validateAsync(req.cookies.Authorization)
        const {userId} = jwt.verify(Authorization, process.env.SECRET_KEY);

        await Users.findByPk(userId)
            .then((user) => {
                res.locals.user = user['dataValues']
            })
        next()
    } catch (error) {
        // cookie 값이 없거나, 인증에 실패하였을 경우 실행된다.
        res.status(401).send(
            {errorMessage: "사용자 인증에 실패하였습니다."}
        )
    }
}
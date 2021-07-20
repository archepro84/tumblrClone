const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth-middleware")

router.route('/')
    .get(async (req, res) => {
        res.send({result: "HELLO"})
    })
    .post(async (req, res) => {
        res.send({result: "my Posts"})
    })

router.route('/me')
    .post(authMiddleware, async (req, res) => {
        try {
            const {userId, nickname} = res.locals.user;
            res.send({userId, nickname})
        } catch (error) {
            res.status(400).send(
                {errorMessage: "인증에 실패하였습니다."}
            )
        }
    })

module.exports = router;
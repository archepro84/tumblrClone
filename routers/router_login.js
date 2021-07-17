const express = require("express");
const {Users} = require("../models")
const jwt = require("jsonwebtoken")
const router = express.Router();
const authMiddleware = require("../middlewares/auth-middleware")
require('dotenv').config()

router.route('/')
    .get(async (req, res) => {
        const userId = 1
        const token = jwt.sign({userId}, process.env.SECRET_KEY)
        res.cookie('Authorization', token)
        res.send()
    })


module.exports = router;
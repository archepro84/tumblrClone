const express = require("express");
const router = express.Router();
// require('dotenv').config();

router.route('/')
    .get(async (req, res) => {
        res.send({result: "HELLO"})
    })
    .post(async (req, res) => {
        res.send({result: "my Posts"})
    })

module.exports = router;
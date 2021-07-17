const express = require("express");
const router = express.Router();
const authMiddleware = require('../middlewares/auth-middleware')

router.route('/')
    .get(authMiddleware, async (req, res) => {
        console.log(res.locals.user);

        res.send()
    })

module.exports = router;
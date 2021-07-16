const express = require("express");
const router_user = require("./router_user")
const router_like = require("./router_like")
const router_post = require("./router_post")
const router_sign = require("./router_sign")
const router_search = require("./router_search")
const router_login = require("./router_login")
const router_alarm = require("./router_alarm")
const router_follow = require("./router_follow")
const router_reaction = require("./router_reaction")


const router = express.Router();

router.use("/user", router_user)
router.use("/like", router_like)
router.use("/post", router_post)
router.use("/sign", router_sign)
router.use("/search", router_search)
router.use("/login", router_login)
router.use("/alarm", router_alarm)
router.use("/follow", router_follow)
router.use("/reaction", router_reaction)

module.exports = router
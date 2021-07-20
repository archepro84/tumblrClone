const express = require("express");
const { Users } = require("../models");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const router = express.Router();
require("dotenv").config();

const loginSchema = Joi.object({
  email: Joi.string()
    .required()
    .pattern(
      /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i
    ),
  password: Joi.string()
    .required()
    .pattern(/^[a-zA-Z0-9]{4,20}$/),
});

const emailSchema = Joi.object({
  email: Joi.string()
    .required()
    .pattern(
      /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i
    ),
});

router.route("/").post(async (req, res) => {
  try {
    console.log(req.cookies.Authorization);
    if (req.cookies.Authorization != null) {
      res.status(401).send({
        errorMessage: "이미 로그인한 상태입니다.",
      });
      return;
    }

    const { email, password } = await loginSchema.validateAsync(req.body);
    const user = await Users.findOne({
      where: { email, password },
    });

    if (!user) {
      res.status(401).send({
        errorMessage: "이메일 또는 패스워드가 잘못되었습니다.",
      });
      return;
    }

    const token = jwt.sign({ userId: user.userId }, process.env.SECRET_KEY);

    res.cookie("Authorization", token);
    res.send();
  } catch {
    res.status(401).send({
      errorMessage: "요청한 데이터가 올바르지 않습니다.",
    });
  }
});

router.route("/email").post(async (req, res) => {
  const { email } = await nicknameSchema.validateAsync(req.body);

  const existUsers = await Users.findAll({
    where: { email }, // 변수는 변수 한개만 넣어줘도 모든 속성 값에서 찾아줄 수 있다.
  });

  if (existUsers.length) {
    res.status(200).send(false);
    return;
  } else {
    res.status(200).send(true);
    return;
  }
});

module.exports = router;
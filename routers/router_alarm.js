const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth-middleware");
const connection = require("../assets/mySqlLib");
const Joi = require("joi");

const alarmSchema = Joi.object({
  alarmType: Joi.number().required().min(0).max(3),
  start: Joi.number().required(),
  limit: Joi.number().required(),
});

const userIdSchema = Joi.number().required();

router.route("/").get(async (req, res) => {
  try {
    const { alarmType, start, limit } = await alarmSchema.validateAsync(
      Object.keys(req.query).length ? req.query : req.body  // req.query와 req.body 중 어느것이 들어와도 작동할 수 있게 한다.
    );
    const { userId } = await userIdSchema.validateAsync(res.locals.user);
    const query_result = `SELECT u.userId, u.nickname, u.profileImg, a.type,
        CASE when a.receiverUserId IN (SELECT followUserId FROM Follows where followerUserId = a.giverUserId) then "true" else "false" end as follow
        FROM Alarms as a
        JOIN Users as u
        ON u.userId = a.giverUserId and a.receiverUserId = ${userId} and a.type = ${alarmType}
        LIMIT ${start},${limit}`;

    connection.query(query_result, function (error, result) {
      if (error) {
        res.status(400).send({
          errorMessage: "데이터 검색이 실패했습니다.",
        });
        return;
      }
      res.status(200).send({ result });
    });
  } catch (error) {
    res.status(412).send({
      errorMessage: "입력받은 데이터 형식이 일치하지 않습니다.",
    });
  }
});

module.exports = router;

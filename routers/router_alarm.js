const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth-middleware");
const { sequelize, Sequelize } = require("../models");
const Joi = require("joi");

const alarmSchema = Joi.object({
  alarmType: Joi.number().required().min(0).max(3),
  start: Joi.number().min(0).required(),
  limit: Joi.number().min(1).required(),
});

router
  .route("/")
  .get(authMiddleware, async (req, res) => {
    try {
      const { alarmType, start, limit } = await alarmSchema.validateAsync(
        Object.keys(req.query).length ? req.query : req.body // req.query와 req.body 중 어느것이 들어와도 작동할 수 있게 한다.
      );
      const { userId } = res.locals.user;
      let query_result;
      if (alarmType === 0) {
        query_result = `
                SELECT u.userId, u.nickname, u.profileImg, a.type,
                CASE when a.receiverUserId IN (SELECT followUserId FROM Follows where followerUserId = a.giverUserId) then "true" else "false" end as follow
                FROM Alarms as a
                JOIN Users as u
                ON u.userId = a.giverUserId and a.receiverUserId = ${userId} 
                LIMIT ${start},${limit}`;
      } else {
        query_result = `
                SELECT u.userId, u.nickname, u.profileImg, a.type,
                CASE when a.receiverUserId IN (SELECT followUserId FROM Follows where followerUserId = a.giverUserId) then "true" else "false" end as follow
                FROM Alarms as a
                JOIN Users as u
                ON u.userId = a.giverUserId and a.receiverUserId = ${userId} and a.type = ${alarmType}
                LIMIT ${start},${limit}`;
      }
      await sequelize
        .query(query_result, { type: Sequelize.QueryTypes.SELECT })
        .then((result) => {
          res.status(200).send({ result });
        })
        .catch((error) => {
          res.status(400).send({
            errorMessage: "데이터 검색이 실패했습니다.",
          });
          return;
        });
    } catch (error) {
      console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
      res.status(412).send({
        errorMessage: "입력받은 데이터 형식이 일치하지 않습니다.",
      });
    }
  })

  .delete(authMiddleware, async (req, res) => {
    try {
      const { userId } = res.locals.user;

      await Alarms.findAll({
        where: { receiverUserId: userId },
      }).then((find) => {
        if (find.length == 0) {
          res.status(412).send({
            errorMessage: "삭제할 알람이 없습니다.",
          });
          return;
        }
      });

      await Alarms.destroy({
        where: {
          receiverUserId: userId,
        },
      }).then(() => {
        res.status(200).send();
      });
    } catch (error) {
      res.status(412).send({
        errorMessage: "입력받은 데이터 형식이 일치하지 않습니다.",
      });
    }
  });

module.exports = router;

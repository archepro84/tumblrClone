const authMiddleware = require("../middlewares/auth-middleware");
const connection = require("../assets/mySqlLib");
const { Follows, Users } = require("../models");
const Joi = require("joi");

const followSchema = Joi.object({
  start: Joi.number().required(),
  limit: Joi.number().required(),
});

router
  .route("/follower")
  .get(authMiddleware, async (req, res) => {
    try {
      const { start, limit } = await followSchema.validateAsync(
        Object.keys(req.query).length ? req.query : req.body
      );
      const { userId } = res.locals.user;

      const query_result = `SELECT userId, nickname, profileImg
        FROM Users
        WHERE userId IN (SELECT followerUserId FROM Follows where followUserId = ${userId})
        LIMIT ${start},${limit}`; // LIMIT 마지막에 써주어야 함!

      connection.query(query_result, function (error, result) {
        if (error) {
            console.log("쿼리 에러메세지:", error);
          res.status(400).send({
            errorMessage: "데이터 검색이 실패했습니다.",
          });
          return;
        }
        res.status(200).send({ followerCount: result.length, result });
      });
    } catch (error) {
        console.log("에러메세지:", error);
        res
          .status(412)
          .send({ errorMessage: "입력한 데이터 형식이 일치하지 않습니다." });
    }
  })

  router
  .route("/following")
  .get(authMiddleware, async (req, res) => {
    try {
      const { start, limit } = await followSchema.validateAsync(
        Object.keys(req.query).length ? req.query : req.body
      );
      const { userId } = res.locals.user;

      const query_result = `SELECT userId, nickname, profileImg
        FROM Users
        WHERE userId IN (SELECT followUserId FROM Follows where followerUserId = ${userId})
        LIMIT ${start},${limit}`; // LIMIT 마지막에 써주어야 함!

      connection.query(query_result, function (error, result) {
        if (error) {
          console.log("쿼리 에러메세지:", error);
          res.status(400).send({
            errorMessage: "데이터 검색이 실패했습니다.",
          });
          return;
        }
        res.status(200).send({ followingCount: result.length, result });
      });
    } catch (error) {
      console.log("에러메세지:", error);
      res
        .status(412)
        .send({ errorMessage: "입력한 데이터 형식이 일치하지 않습니다." });
    }
  });

module.exports = router;
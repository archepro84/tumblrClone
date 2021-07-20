const express = require("express");
const router = express.Router();
const authMiddleware = require('../middlewares/auth-middleware')
const authMiddlewareAll = require("../middlewares/auth-middlewareAll")
const {Users, Posts, Images, Tags, sequelize, Sequelize} = require("../models");
const Joi = require("joi");

const startLimitSchema = Joi.object({
    start: Joi.number().min(0).required(),
    limit: Joi.number().min(1).required(),
})
const detailSchema = Joi.object({
    postId: Joi.number().min(1).required(),
    start: Joi.number().min(0).required(),
    limit: Joi.number().min(1).required(),
})

//reBlog : 숫자형이면서 null도 허용한다.
const writePostSchema = Joi.object({
    // title의 패턴을 삭제함
    title: Joi.string().min(1).max(50).allow(null, '').required(),
    reBlog: Joi.number().allow(null).required(),
    img: Joi.array().required(),
    content: Joi.string().min(1).max(1000).required(),
    tag: Joi.array().required(),
})

const modifyPostSchema = Joi.object({
    // title의 패턴을 삭제함
    postId: Joi.number().min(1).required(),
    title: Joi.string().min(1).max(50).allow(null, '').required(),
    reBlog: Joi.number().allow(null).required(),
    img: Joi.array().required(),
    content: Joi.string().min(1).max(1000).required(),
    tag: Joi.array().required(),
})

router.route('/')
    .post(authMiddleware, async (req, res) => {
        try {
            const {userId} = res.locals.user
            const {title, reBlog, img, content, tag} = await writePostSchema.validateAsync(req.body)
            const tagArray = Array(), imgArray = Array();
            console.log(title, reBlog, img, content, tag);

            // create를할 때 reBlog에 해당하는 postId가 없을 경우 에러가 발생한다.
            const postId = await Posts.create({userId, title, reBlog, content})
                .then((post) => {
                    // post.null의 데이터는 생성된 post의 postId
                    return post.null;
                })

            if (Object.keys(tag).length) {
                for (const t of tag) {
                    tagArray.push({postId, tag: t})
                }
                await Tags.bulkCreate(tagArray)
            }

            if (Object.keys(img).length) {
                for (const i of img) {
                    imgArray.push({postId, img: i})
                }
                await Images.bulkCreate(imgArray)
            }

            res.send()
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412).send(
                {errorMessage: "게시글 작성에 실패하였습니다."}
            )
        }
    })
    .get(authMiddlewareAll, async (req, res) => {
        try {
            let result = Array()
            const userId = res.locals.user ? res.locals.user.userId : 0
            const {postId, start, limit} = await detailSchema.validateAsync(
                Object.keys(req.query).length ? req.query : req.body
            )

            const query = `
                SELECT u.userId, u.nickname, u.profileImg, p.postId, p.reBlog, p.title,
                (SELECT GROUP_CONCAT(img ORDER BY img ASC SEPARATOR ', ')
                    FROM Images
                    WHERE postId = p.postId
                    GROUP BY postId) AS img,
                p.content,
                (SELECT GROUP_CONCAT(tag ORDER BY tag ASC SEPARATOR ', ')
                    FROM Tags
                    WHERE postId = p.postId
                    GROUP BY postId) AS tag,
                CASE WHEN p.postId IN (SELECT postId FROM Favorites WHERE userId=${userId}) THEN "Y" ELSE "N" END AS favorite,
                (SELECT COALESCE(MIN('Y'), 'N')
                    FROM Follows
                    WHERE EXISTS (SELECT 1 FROM  Follows WHERE followUserId=${userId} AND followerUserId=p.userId)) AS follow,
                (SELECT COUNT(*) FROM Favorites WHERE postId=p.postId) +
                    (SELECT COUNT(*) FROM Posts WHERE reBlog=p.postId) AS reactionCount,
                p.createdAt
                FROM Posts AS p
                INNER JOIN Users AS u
                USING(userId)
                ORDER BY 
                    CASE WHEN postId=${postId} THEN 1
                    ELSE 0 END DESC,
                    postId DESC,
                    createdAt DESC
                LIMIT ${start}, ${limit}`

            await sequelize.query(query, {type: Sequelize.QueryTypes.SELECT})
                .then((searchArray) => {
                    for (const search of searchArray) {
                        let img = Array(), tag = Array();
                        if (search.img)
                            img = search.img.split(', ')
                        if (search.tag)
                            tag = search.tag.split(', ')

                        result.push(
                            {
                                userId: search.userId,
                                nickname: search.nickname,
                                profileImg: search.profileImg,
                                postId: search.postId,
                                reBlog: search.reBlog,
                                title: search.title,
                                img,
                                content: search.content,
                                tag,
                                reactionCount: search.reactionCount,
                                favorite: search.favorite,
                                follow: search.follow,
                                createdAt: search.createdAt
                            }
                        )
                    }
                })
            res.send({result})
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412).send(
                {errorMessage: "게시글을 정상적으로 가져오지 못했습니다."}
            )
        }
    })
    // FIXME 해당하는 Tag 또는 Image들을 전부 삭제한 후 추가하는게 과연 효율적일까?
    // 트리거를 사용해서 Posts의 데이터가 수정되었을 경우 Images, Tags를 삭제하도록 하자
    .put(authMiddleware, async (req, res) => {
        try {
            const userId = res.locals.user.userId
            const {postId, title, reBlog, img, content, tag} = await modifyPostSchema.validateAsync(req.body)
            const tagArray = Array(), imgArray = Array();

            await Posts.findOne({
                where: {userId, postId}
            })
                .then((user) => {
                    if (!user) throw new Error("Post 작성자와 일치하지 않습니다.")
                })

            await Posts.update({title, reBlog, content}, {
                where: {userId, postId}
            })
                .then((updateCount) => {
                    if (updateCount < 1)
                        throw new Error("변경된 데이터가 존재하지 않습니다.")
                })

            if (Object.keys(tag).length) {
                for (const t of tag) {
                    tagArray.push({postId, tag: t})
                }
                await Tags.bulkCreate(tagArray)
            }

            if (Object.keys(img).length) {
                for (const i of img) {
                    imgArray.push({postId, img: i})
                }
                await Images.bulkCreate(imgArray)
            }

            res.send()
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412).send(
                {errorMessage: "게시글을 정상적으로 가져오지 못했습니다."}
            )
        }
    })

router.route('/posts')
    .get(authMiddlewareAll, async (req, res) => {
        try {
            // userId가 존재하지 않을경우 0으로 삽입한다.
            const userId = res.locals.user ? res.locals.user.userId : 0
            const {start, limit} = await startLimitSchema.validateAsync(
                Object.keys(req.query).length ? req.query : req.body)
            let result = Array()

            const query = `
                SELECT u.userId, u.nickname, u.profileImg, p.postId, p.reBlog, p.title,
                (SELECT GROUP_CONCAT(img ORDER BY img ASC SEPARATOR ', ')
                    FROM Images
                    WHERE postId = p.postId
                    GROUP BY postId) AS img,
                p.content,
                (SELECT GROUP_CONCAT(tag ORDER BY tag ASC SEPARATOR ', ')
                    FROM Tags
                    WHERE postId = p.postId
                    GROUP BY postId) AS tag,
                CASE WHEN p.postId IN (SELECT postId FROM Favorites WHERE userId=${userId}) THEN "Y" ELSE "N" END AS favorite,
                (SELECT COALESCE(MIN('Y'), 'N')
                    FROM Follows
                    WHERE EXISTS (SELECT 1 FROM  Follows WHERE followUserId = ${userId} AND followerUserId=p.userId)) AS follow,
                (SELECT COUNT(*) FROM Favorites WHERE postId=p.postId) AS reactionCount,
                p.createdAt
                FROM Posts AS p
                INNER JOIN Users AS u
                USING(userId)
                ORDER BY p.createdAt DESC
                LIMIT ${start},${limit}`
            //Sequelize.query에서 에러가 발생할 경우 catch로 들어간다.
            await sequelize.query(query, {type: Sequelize.QueryTypes.SELECT})
                .then((searchArray) => {
                    for (const search of searchArray) {
                        let img = Array(), tag = Array();
                        if (search.img)
                            img = search.img.split(', ')
                        if (search.tag)
                            tag = search.tag.split(', ')

                        result.push(
                            {
                                userId: search.userId,
                                nickname: search.nickname,
                                profileImg: search.profileImg,
                                postId: search.postId,
                                reBlog: search.reBlog,
                                title: search.title,
                                img,
                                content: search.content,
                                tag,
                                reactionCount: search.reactionCount,
                                favorite: search.favorite,
                                follow: search.follow,
                                createdAt: search.createdAt
                            }
                        )
                    }
                })
            // TODO 프로미스 내부에 작성해야 할까?
            res.send({result})
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412).send(
                {errorMessage: "데이터 검색에 실패하였습니다."}
            )
        }
    })
router.route('/user')
    .get(authMiddleware, async (req, res) => {
        try {
            const {start, limit} = await startLimitSchema.validateAsync(
                Object.keys(req.query).length ? req.query : req.body
            )
            let result = Array()
            const query = `
                SELECT userId, postId, reBlog, title, 
                (SELECT GROUP_CONCAT(img ORDER BY img ASC SEPARATOR ', ')
                    FROM Images
                    WHERE postId = p.postId
                    GROUP BY postId) AS img,
                content,
                (SELECT GROUP_CONCAT(tag ORDER BY tag ASC SEPARATOR ', ')
                    FROM Tags
                    WHERE postId = p.postId
                    GROUP BY postId) AS tag,
                (SELECT COUNT(*) FROM Favorites WHERE postId=p.postId) +
                    (SELECT COUNT(*) FROM Posts WHERE reBlog=p.postId) AS reactionCount
                FROM Posts AS p
                where userId=1
                ORDER BY createdAt DESC, 
                    postId DESC
                LIMIT ${start},${limit}`
            await sequelize.query(query, {type: Sequelize.QueryTypes.SELECT})
                .then((searchArray) => {
                    for (const search of searchArray) {
                        let img = Array(), tag = Array();
                        if (search.img)
                            img = search.img.split(', ')
                        if (search.tag)
                            tag = search.tag.split(', ')

                        result.push({
                            posId: search.postId,
                            reBlog: search.reBlog,
                            title: search.title,
                            img,
                            content: search.content,
                            tag,
                            reactionCount: search.reactionCount,
                            createdAt: search.createdAt
                        })
                    }
                })

            res.send({result})
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412).send(
                {errorMessage: "작성게시글을 가져올 수 없습니다."}
            )
        }
    })
router.route('/like')
    .get(authMiddleware, async (req, res) => {
        try {
            const userId = res.locals.user.userId
            const {start, limit} = await startLimitSchema.validateAsync(
                Object.keys(req.query).length ? req.query : req.body
            )
            let result = Array()
            const query = `
                SELECT DISTINCT u.userId, u.nickname, u.profileImg, p.postId, p.reBlog, p.title, 
                (SELECT GROUP_CONCAT(img ORDER BY img ASC SEPARATOR ', ')
                    FROM Images
                    WHERE postId = p.postId
                    GROUP BY postId) AS img,
                p.content,
                (SELECT GROUP_CONCAT(tag ORDER BY tag ASC SEPARATOR ', ')
                    FROM Tags
                    WHERE postId = p.postId
                    GROUP BY postId) AS tag,
                (SELECT COUNT(*) FROM Favorites WHERE postId=p.postId) +
                    (SELECT COUNT(*) FROM Posts WHERE reBlog=p.postId) AS reactionCount,
                f.createdAt
                FROM Posts AS p
                INNER JOIN Users AS u
                ON p.userId = u.userId 
                INNER JOIN Favorites AS f
                ON f.userId = ${userId}
                WHERE f.postId = p.postId
                ORDER BY createdAt DESC,
                    postId DESC
                LIMIT ${start},${limit}`
            await sequelize.query(query, {type: Sequelize.QueryTypes.SELECT})
                .then((searchArray) => {
                    for (const search of searchArray) {
                        let img = Array(), tag = Array();
                        if (search.img)
                            img = search.img.split(', ')
                        if (search.tag)
                            tag = search.tag.split(', ')

                        result.push({
                            userId: search.userId,
                            nickname: search.nickname,
                            profileImg: search.profileImg,
                            posId: search.postId,
                            reBlog: search.reBlog,
                            title: search.title,
                            img,
                            content: search.content,
                            tag,
                            reactionCount: search.reactionCount,
                            createdAt: search.createdAt
                        })
                    }
                })

            res.send({result})
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(412).send(
                {errorMessage: "좋아요를 추가한 게시글을 가져올 수 없습니다."}
            )
        }
    })
    
const { Posts, Images, Tags } = require("../models");
const Joi = require("joi");
const authMiddleware = require("../middlewares/auth-middleware");

const postIdSchema = Joi.number().required();
const postPutSchema = Joi.object({
  postId: Joi.number().required(),
  title: Joi.string().required(),
  img: Joi.string(),
  content: Joi.string().required(),
  tag: Joi.array().items(Joi.string()),
});

router
  .route("/")
  .put(authMiddleware, async (req, res) => {
    try {
      const { postId, title, img, content, tag } =
        await postPutSchema.validateAsync(req.body);

      //update의 반환값은 튜플이 몇개 변경되었는지 나타내는 수
      await Posts.update(
        { title, content },
        {
          where: { postId },
        }
      ).then((updateCount) => {
        if (updateCount < 1) {
          // 변경된 데이터가 없을 경우
          res.status(400).send();
          return;
        }
      });

      await Images.update(
        { img },
        {
          where: { postId },
        }
      ).then((updateCount) => {
        if (updateCount < 1) {
          // 변경된 데이터가 없을 경우
          res.status(400).send();
          return;
        }
      });

      for (let tagReceive of tag) {
        await Tags.update(
          { tag: tagReceive },
          {
            where: { postId }, // 각각의 태그들을 하나씩 불러오려면 조건을 어떻게 해주어야 하는가?
          }
        ).then((updateCount) => {
          if (updateCount < 1) {
            // 변경된 데이터가 없을 경우
            res.status(400).send();
            return;
          }
        });
      }
    } catch (error) {
      res.status(412).send();
      return;
    }
  })

  .delete(authMiddleware, async (req, res) => {
    try {
      const { userId } = res.locals.user;
      const postId = await postIdSchema.validateAsync(req.body.postId);

      await Posts.destroy({
        where: {
          postId,
          userId,
        },
      }).then((deleteCount) => {
        if (deleteCount < 1) {
          res.status(400).send({
            errorMessage: "데이터가 삭제되지 않았습니다.",
          });
        }
      });

      res.status(200).send();
    } catch (error) {
      res.status(412).send();
      return;
    }
  });

module.exports = router;

const app = require("../app")
const supertest = require("supertest")

// jest.mock("../models")


test('/api/post/posts page Test', async () => {
    const res = await supertest(app)
        .get("/api/post/posts")
        .send({start:0, limit:5})
    expect(res.status).toEqual(200);
})


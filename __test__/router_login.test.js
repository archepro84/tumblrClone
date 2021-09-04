const app = require("../app")
const supertest = require("supertest")

// jest.mock("../models")


test('/api/login page Success', async () => {
    const res = await supertest(app)
        .post("/api/login")
        .send({
            "email": "league1113@gmail.com",
            "password": "41414141"
        })
    expect(res.status).toEqual(200);
    expect(res.body.nickname).toEqual("4321");
    expect(res.body.userId).toEqual(4);
})

test('/api/login page Joi value Error', async () => {
    const res = await supertest(app)
        .post("/api/login")
        .send({
            "email": "league1113@gmail.com",
        })
    expect(res.status).toEqual(412);
})



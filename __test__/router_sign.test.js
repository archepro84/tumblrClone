const app = require("../app")
const supertest = require("supertest")

// jest.mock("../models")


// test('/api/sign page Success', async () => {
//     let res = await supertest(app)
//         .post("/api/sign")
//         .send({
//             "email": "archdd2@gmail.com",
//             "password": "14141414*",
//             "nickname": "HeyBrother"
//         })
//     expect(res.status).toEqual(200);
//     expect(res.body).toBe(true);
// })

test('/api/sign Joi Password required Error', async () => {
    let res = await supertest(app)
        .post("/api/sign")
        .send({
            "email": "archddT@gmail.com",
            "nickname": "HeyBrother"
        })
    expect(res.status).toEqual(200);
    expect(res.body).toBe(false);
})

test('/api/sign Joi Email pattern Error', async () => {
    let res = await supertest(app)
        .post("/api/sign")
        .send({
            "email": "archddT@gmail",
            "password": "14141414*",
            "nickname": "HeyBrother2"
        })
    expect(res.status).toEqual(200);
    expect(res.body).toBe(false);

    res = await supertest(app)
        .post("/api/sign")
        .send({
            "email": "archddT@gmail.cococok",
            "password": "14141414*",
            "nickname": "HeyBrother2"
        })
    expect(res.status).toEqual(200);
    expect(res.body).toBe(false);

    res = await supertest(app)
        .post("/api/sign")
        .send({
            "email": "archddT@@gmail.com",
            "password": "14141414*",
            "nickname": "HeyBrother2"
        })
    expect(res.status).toEqual(200);
    expect(res.body).toBe(false);

    res = await supertest(app)
        .post("/api/sign")
        .send({
            "email": "arch ddT@gmail",
            "password": "14141414*",
            "nickname": "HeyBrother2"
        })
    expect(res.status).toEqual(200);
    expect(res.body).toBe(false);
})

test('/api/sign Joi Password Pattern Error', async () => {
    let res = await supertest(app)
        .post("/api/sign")
        .send({
            "email": "archddT@gmail.com",
            "password": "1414",
            "nickname": "HeyBrother2"
        })
    expect(res.status).toEqual(200);
    expect(res.body).toBe(false);

    res = await supertest(app)
        .post("/api/sign")
        .send({
            "email": "archddT@gmail.com",
            "password": "*4533",
            "nickname": "HeyBrother2"
        })
    expect(res.status).toEqual(200);
    expect(res.body).toBe(false);

    res = await supertest(app)
        .post("/api/sign")
        .send({
            "email": "archddT@gmail.com",
            "password": "141434534534141434534534141434534534",
            "nickname": "HeyBrother2"
        })
    expect(res.status).toEqual(200);
    expect(res.body).toBe(false);
})

test('/api/sign Joi nickname Pattern Error', async () => {
    let res = await supertest(app)
        .post("/api/sign")
        .send({
            "email": "archddT@gmail.com",
            "password": "14141414*",
            "nickname": "He"
        })
    expect(res.status).toEqual(200);
    expect(res.body).toBe(false);

    res = await supertest(app)
        .post("/api/sign")
        .send({
            "email": "archddT@gmail.com",
            "password": "14141414*",
            "nickname": "H"
        })
    expect(res.status).toEqual(200);
    expect(res.body).toBe(false);

    res = await supertest(app)
        .post("/api/sign")
        .send({
            "email": "archddT@gmail.com",
            "password": "14141414*",
            "nickname": "HeHeHeHeHeHeHeHeHeHe힝"
        })
    expect(res.status).toEqual(200);
    expect(res.body).toBe(false);
})
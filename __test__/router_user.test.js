const supertest = require("supertest");
const app = require("../app");
test('/api/login page Test', async () => {
    const res = await supertest(app)
        .post("/api/user/me")
        .set("authorization", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTYyNjg3NDQyMX0.3R2oNUB7vZAo_InTndsqAW2MBxvlyjIwI5IL3vP0m5Q")
        .send()
    expect(res.status).toEqual(200);
})




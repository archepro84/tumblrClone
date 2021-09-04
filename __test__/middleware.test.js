const supertest = require("supertest");
const app = require("../app");
const authMiddleware = require("../middlewares/auth-middleware")
const authMiddlewareAll = require("../middlewares/auth-middlewareAll")
const loginCheckMiddleware = require("../middlewares/login-check-middleware")

const {Users} = require("../models")
jest.mock("../models")

test('auth-middleware header Nothing', async () => {
    const mockedSend = jest.fn()
    const req = {
        headers: {
            authorization: "xcvbbwerfsdfsdf"
        },
        cookies: {}
    }
    const res = {
        status: () => (
            {
                send: mockedSend,
            }
        ),
        locals: {},
    }
    const next = () => {
        console.log("authmiddleware next()");
    }
    authMiddleware(req, res, next)
    expect(mockedSend).toHaveBeenCalledWith({
        errorMessage: "사용자 인증에 실패하였습니다."
    })
    // expect(Users.findByPk).toHaveBeenCalledTimes(0)
})

test('auth-middleware header True', async () => {

    const mockedSend = jest.fn()
    const mockedLocals = jest.fn()
    Users.findByPk = jest.fn()
    const req = {
        headers: {
            authorization: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTYyNjg3NDQyMX0.3R2oNUB7vZAo_InTndsqAW2MBxvlyjIwI5IL3vP0m5Q"
        },
        cookies: {}
    }
    const res = {
        locals: {
            user: mockedLocals,
        },
        status: () => ({
            send: mockedSend,
        }),
    }
    const next = () => {
        console.log("authmiddleware next()");
    }
    authMiddleware(req, res, next)
    expect(Users.findByPk).toHaveBeenCalledTimes(1)
    // expect(mockedLocals).toHaveBeenCalledWith({
    // })
    // expect(mockedSend).toHaveBeenCalledWith({
    //     errorMessage: "사용자 인증에 실패하였습니다."
    // })
})
const express = require("express")
const Http = require("http")
const router = require("./routers/router")
const cors = require("cors")
const cookieParser = require("cookie-parser")

const app = express()
const http = Http.createServer(app);

app.use(cors({
    // 맨 뒤에 .shop/중에서 /를 삭제해야 사용할 수 있다.
    origin: "http://tumblrclone.shop",
    credentials: true
}))


// TODO app.use로 설정하게 된다면 경유지가 많아지기 때문에 속도저하가 발생하지 않을까?
app.use(express.urlencoded({extended: false}));
app.use(express.json())
app.use(cookieParser())

app.use("/api", router);

module.exports = http
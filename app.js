const express = require("express")
const Http = require("http")
const router = require("./routers/router")
const cors = require("cors")
const cookieParser = require("cookie-parser")

const app = express()
const http = Http.createServer(app);
const port = 4000

// TODO app.use로 설정하게 된다`면 경유지가 많아지기 때문에 속도저하가 발생하지 않을까?
app.use(express.urlencoded({extended: false}));
app.use(express.json())
app.use(cookieParser())
app.use(cors())

app.use("/api", router);

http.listen(port, () => {
    console.log(`Server Start Listen http://localhost:${port}`);
})






const express = require("express")
const Http = require("http")
const nunjucks = require("nunjucks")
const cors = require("cors")
const router = require("./routers/router")

const app = express()
const http = Http.createServer(app);
const port = 4000

app.use(express.urlencoded({extended: false}));
app.use(express.json())
app.use(cors())

// html을 테스트할 때만 사용.
app.set("view engine", "html")
nunjucks.configure("views", {
    express: app,
    watch: true,
})

app.use("/api", router);

http.listen(port, () => {
    console.log(`Server Start Listen http://localhost:${port}`);
})






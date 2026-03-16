const express = require("express");
const router = require("./router/user.routes.js");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const app = express();
const PORT = 8080;
dotenv.config();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use("/", router);
app.listen(PORT, ()=>{
    console.log(`Server đang lắng nghe http://localhost:${PORT}`);
})
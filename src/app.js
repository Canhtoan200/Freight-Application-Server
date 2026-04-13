const express = require("express");
const userRouter = require("./router/user.routes.js");
const orderRouter = require("./router/order.routes.js");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require('cors'); // 1. Import cors
const app = express();

app.use(cors()); // 2. Sử dụng cors
app.use(express.json());
const PORT = 8080;
dotenv.config();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// Đăng ký các router
app.use("/api/v1/users", userRouter);
app.use("/api/v1/orders", orderRouter); 

app.listen(PORT, ()=>{
    console.log(`Server đang lắng nghe http://localhost:${PORT}`);
})
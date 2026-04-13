const express = require("express");
const AuthController = require("../controllers/auth.controller.js");
const userRouter = express.Router();

// Tạo api lấy hết tất cả danh sách các user
userRouter.post("/login", (req, res) =>{
    AuthController.login(req, res);
});
userRouter.post("/register", (req, res) =>{
    AuthController.register(req, res);
});
module.exports = userRouter;
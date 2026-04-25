const express = require("express");
const OrderController = require("../controllers/order.controller.js");
const orderRouter = express.Router();

// Tạo api lấy hết tất cả danh sách các đơn hàng
orderRouter.get("/getAllOrders", (req, res) =>{
    OrderController.getAllOrders(req, res);
});
orderRouter.post("/getAllOrderByStatus", (req, res) =>{
    OrderController.getAllOrderByStatus(req, res);
});
orderRouter.post("/createGuestOrder", (req, res) =>{
    OrderController.createGuestOrder(req, res);
});
module.exports = orderRouter;
const express = require("express");
const OrderController = require("../controllers/order.controller.js");
const { requireAuthenticatedUser } = require("../middleware/auth.middleware.js");
const orderRouter = express.Router();

// Tạo api lấy hết tất cả danh sách các đơn hàng
orderRouter.get("/getAllOrders", (req, res) =>{
    OrderController.getAllOrders(req, res);
});
orderRouter.get(
    "/getAllOrdersByOrganization",
    requireAuthenticatedUser,
    (req, res) => OrderController.getAllOrdersByOrganization(req, res)
);
orderRouter.get(
    "/getOrdersForTracking",
    requireAuthenticatedUser,
    (req, res) => OrderController.getOrdersForAuthenticatedOrganization(req, res)
);
orderRouter.get("/getOrderByID", (req, res) =>{
    OrderController.getOrderByID(req, res);
});
orderRouter.get("/getAllOrderByStatus", (req, res) =>{
    OrderController.getAllOrderByStatus(req, res);
});
orderRouter.post("/getAllOrderByStatus", (req, res) =>{
    OrderController.getAllOrderByStatus(req, res);
});
orderRouter.post("/createGuestOrder", requireAuthenticatedUser, (req, res) =>{
    OrderController.createGuestOrder(req, res);
});
orderRouter.put("/updateShippingStatus", (req, res) =>{
    OrderController.updateShippingStatus(req, res);
});
orderRouter.post("/searchOrders", (req, res) =>{
    OrderController.searchOrders(req, res);
});
module.exports = orderRouter;
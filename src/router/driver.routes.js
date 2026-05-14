const express = require("express");
const DriverController = require("../controllers/driver.controller.js");
const driverRouter = express.Router();

// Tạo api lấy hết tất cả danh sách các tài xế
driverRouter.get("/getAllDrivers", (req, res) =>{
    DriverController.getAllDrivers(req, res);
});
driverRouter.get("/getAllDriverOrders", (req, res) =>{
    DriverController.getAllDriverOrders(req, res);
});
driverRouter.post("/createDriver", (req, res) =>{
    DriverController.createDriver(req, res);
});
driverRouter.post("/createDriverOrderDetail", (req, res) =>{
    DriverController.createDriverOrderDetail(req, res);
});
module.exports = driverRouter;
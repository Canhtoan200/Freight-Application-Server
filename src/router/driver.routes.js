const express = require("express");
const DriverController = require("../controllers/driver.controller.js");
const driverRouter = express.Router();

// Tạo api lấy hết tất cả danh sách các tài xế
driverRouter.get("/getAllDrivers", (req, res) =>{
    DriverController.getAllDrivers(req, res);
});
driverRouter.post("/createDriver", (req, res) =>{
    DriverController.createDriver(req, res);
});

module.exports = driverRouter;
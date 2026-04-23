const express = require("express");
const WagonController = require("../controllers/wagon.controller.js");
const wagonRouter = express.Router();

// Tạo api lấy hết tất cả danh sách các đơn hàng
wagonRouter.get("/getAllWagons", (req, res) =>{
    WagonController.getAllWagons(req, res);
});
wagonRouter.post("/createWagonOrder", (req, res) =>{
    WagonController.createWagonOrder(req, res);
});
wagonRouter.get("/getWagonDetailID", (req, res) =>{
    WagonController.getWagonDetailID(req, res);
});
wagonRouter.post("/createWagonDetail", (req, res) =>{
    WagonController.createWagonDetail(req, res);
});

module.exports = wagonRouter;
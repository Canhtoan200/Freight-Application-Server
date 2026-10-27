const wagonService = require("../services/wagon.service.js");

async function getAllWagons (req, res){
    const wagons = await wagonService.getAllWagons();
    console.log(wagons);
    res.status(200).json({
        data: wagons
    })
}
async function createWagonOrder (req, res){
    const { wagon_number, wagon_departure_date, wagon_arrival_date, wagon_route, wagon_type } = req.body;
    try {
        const wagonId = await wagonService.createWagonOrder(
            wagon_number,
            wagon_departure_date,
            wagon_arrival_date,
            wagon_route,
            wagon_type
        );
        return res.status(200).json({
            message: "Create new wagon success with ID: " + wagonId
        });
    } catch (error) {
        if (error.statusCode === 400) {
            return res.status(400).json({ message: error.message });
        }
        console.error("Lỗi tạo toa tàu:", error);
        return res.status(500).json({ message: "Không thể tạo toa tàu." });
    }
}
async function convertWagonToUnloading(req, res) {
    try {
        const wagon = await wagonService.convertWagonToUnloading(req.body?.WagonID);
        return res.status(200).json({
            message: "Đã chuyển toa xếp sang toa dỡ.",
            data: wagon
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error("Lỗi chuyển toa xếp sang toa dỡ:", error);
        return res.status(500).json({ message: "Không thể chuyển toa sang toa dỡ." });
    }
}
async function getWagonDetailID (req, res){
    const { WagonIDs } = req.body;
    const wagonDetails = await wagonService.getWagonDetailID(WagonIDs);
    res.status(200).json({
        data: wagonDetails
    })
}
async function createWagonDetail (req, res){
    const { WagonIDs, OrderIDs } = req.body;
    try {
        const result = await wagonService.createWagonDetail(WagonIDs, OrderIDs);
        const { statusCode = 200, ...response } = result;
        res.status(statusCode).json(response);
    } catch (error) {
        console.error("Lỗi khi thêm đơn hàng vào toa tàu:", error);
        res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : "Không thể thêm đơn hàng vào toa tàu."
        });
    }
}
module.exports = {
    getAllWagons,
    createWagonOrder,
    convertWagonToUnloading,
    getWagonDetailID,
    createWagonDetail
}
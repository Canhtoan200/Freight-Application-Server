const driverService = require("../services/driver.service.js");

async function getAllDrivers (req, res){
    const drivers = await driverService.getAllDrivers();
    console.log(drivers);
    res.status(200).json({
        data: drivers
    })
}
async function getAllDriverOrders (req, res){
    const driverOrders = await driverService.getAllDriverOrders();
    console.log(driverOrders);
    res.status(200).json({
        data: driverOrders
    })
}
async function getDriverPosition (req, res) {
    const rawPositionID = req.query.positionID;
    const rawDriverID = req.query.driverID;
    const positionID = rawPositionID == null ? null : Number(rawPositionID);
    const driverID = rawDriverID == null ? null : Number(rawDriverID);
    if ((positionID !== null && (!Number.isInteger(positionID) || positionID <= 0)) ||
        (driverID !== null && (!Number.isInteger(driverID) || driverID <= 0))) {
        return res.status(400).json({ message: "Mã vị trí tài xế không hợp lệ." });
    }
    try {
        const driverPosition = await driverService.getDriverPosition(positionID, driverID);
        if (!driverPosition || (Array.isArray(driverPosition) && driverPosition.length === 0)) {
            return res.status(404).json({ message: "Không tìm thấy vị trí của tài xế." });
        }
        return res.status(200).json({ data: driverPosition });
    } catch (error) {
        console.error("Không thể tải vị trí tài xế:", error);
        return res.status(500).json({ message: "Không thể tải vị trí tài xế." });
    }}
async function updateDriverPosition(req, res) {
    const driverID = Number(req.body?.driverID);
    const latitude = Number(req.body?.latitude);
    const longitude = Number(req.body?.longitude);
    if (!Number.isInteger(driverID) || driverID <= 0 ||
        !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        return res.status(400).json({ message: "Mã tài xế hoặc tọa độ không hợp lệ." });
    }
    try {
        const position = await driverService.updateDriverPosition(driverID, latitude, longitude);
        return res.status(200).json({ message: "Đã cập nhật vị trí tài xế.", data: position });
    } catch (error) {
        if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
        console.error("Không thể cập nhật vị trí tài xế:", error);
        return res.status(500).json({ message: "Không thể cập nhật vị trí tài xế." });
    }
}
async function getAllDriverOrders (req, res){
    const driverOrders = await driverService.getAllDriverOrders();
    console.log(driverOrders);
    res.status(200).json({
        data: driverOrders
    })
}
async function getAllDriverOrders (req, res){
    const driverOrders = await driverService.getAllDriverOrders();
    console.log(driverOrders);
    res.status(200).json({
        data: driverOrders
    })
}
async function getDriverByDriverID (req, res){
    const { driverID } = req.query;
    const driver = await driverService.getDriverByDriverID(driverID);
    res.status(200).json({
        data: driver
    })
}
async function getDriverIDBasedOnUserID (req, res){
    const { userID } = req.query;
    const driverID = await driverService.getDriverIDBasedOnUserID(userID);
    res.status(200).json({
        data: driverID
    })
}
async function getDriverOrderBasedOnDriverID (req, res){
    const { driverID } = req.query;
    const driverOrders = await driverService.getDriverOrderBasedOnDriverID(driverID);
    res.status(200).json({
        data: driverOrders
    })
}
async function createDriver (req, res){
    const { driver_name, driver_link, driver_license_plate_number, driver_phone_number, amount_of_gas, money_amount_of_gas, the_remaining_volume_of_the_car, the_remaining_weight_of_the_car, drop_off_distance } = req.body;
    const driverId = await driverService.createDriver(driver_name, driver_link, driver_license_plate_number, driver_phone_number, amount_of_gas, money_amount_of_gas, the_remaining_volume_of_the_car, the_remaining_weight_of_the_car, drop_off_distance);
    res.status(200).json({
        message: "Create new driver success with ID: " + driverId
    })
}
async function createDriverOrderDetail (req, res){
    const { DriverIDs, OrderIDs } = req.body;
    const result = await driverService.createDriverOrderDetail(DriverIDs, OrderIDs);
    res.status(200).json(result);
}
async function getAllDriverPartners(req, res) {
    try {
        const drivers = await driverService.getAllDriverPartners();
        return res.status(200).json({ data: drivers });
    } catch (error) {
        console.error("Không thể tải đội xe đối tác:", error);
        return res.status(500).json({ message: "Không thể tải đội xe đối tác." });
    }
}
async function getDriverPartnerIDBasedOnUserID(req, res) {
    const userID = Number(req.query.userID);
    if (!Number.isInteger(userID) || userID <= 0) {
        return res.status(400).json({ message: "Mã tài khoản không hợp lệ." });
    }
    try {
        const driverID = await driverService.getDriverPartnerIDBasedOnUserID(userID);
        if (!driverID) return res.status(404).json({ message: "Không tìm thấy hồ sơ tài xế đối tác." });
        return res.status(200).json({ data: driverID });
    } catch (error) {
        console.error("Không thể tải hồ sơ tài xế đối tác:", error);
        return res.status(500).json({ message: "Không thể tải hồ sơ tài xế đối tác." });
    }
}
async function getDriverPartnerByID(req, res) {
    const driverID = Number(req.query.driverPartnerID);
    if (!Number.isInteger(driverID) || driverID <= 0) {
        return res.status(400).json({ message: "Mã tài xế không hợp lệ." });
    }
    try {
        const driver = await driverService.getDriverPartnerByID(driverID);
        if (!driver) return res.status(404).json({ message: "Không tìm thấy tài xế đối tác." });
        return res.status(200).json({ data: driver });
    } catch (error) {
        console.error("Không thể tải hồ sơ tài xế đối tác:", error);
        return res.status(500).json({ message: "Không thể tải hồ sơ tài xế đối tác." });
    }
}
async function getDriverPartnerOrdersByID(req, res) {
    const driverID = Number(req.query.driverPartnerID);
    if (!Number.isInteger(driverID) || driverID <= 0) {
        return res.status(400).json({ message: "Mã tài xế không hợp lệ." });
    }
    try {
        const orders = await driverService.getDriverPartnerOrdersByID(driverID);
        return res.status(200).json({ data: orders });
    } catch (error) {
        console.error("Không thể tải đơn được phân công cho tài xế đối tác:", error);
        return res.status(500).json({ message: "Không thể tải đơn được phân công." });
    }
}
async function createDriverPartnerOrderDetail(req, res) {
    const { DriverPartnerIDs, OrderIDs } = req.body || {};
    try {
        const result = await driverService.createDriverPartnerOrderDetail(DriverPartnerIDs, OrderIDs);
        return res.status(200).json(result);
    } catch (error) {
        if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
        console.error("Không thể phân công đơn cho tài xế đối tác:", error);
        return res.status(500).json({ message: "Không thể phân công đơn cho tài xế đối tác." });
    }
}
module.exports = {
    getAllDrivers,
    getAllDriverOrders,
    getDriverPosition,
    updateDriverPosition,
    getDriverByDriverID,
    getDriverIDBasedOnUserID,
    getDriverOrderBasedOnDriverID,
    createDriver,
    createDriverOrderDetail,
    getAllDriverPartners,
    getDriverPartnerIDBasedOnUserID,
    getDriverPartnerByID,
    getDriverPartnerOrdersByID,
    createDriverPartnerOrderDetail
}
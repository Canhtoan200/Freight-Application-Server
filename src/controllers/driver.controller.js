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
module.exports = {
    getAllDrivers,
    getAllDriverOrders,
    createDriver,
    createDriverOrderDetail
}
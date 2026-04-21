const wagonService = require("../services/wagon.service.js");

async function getAllWagons (req, res){
    const wagons = await wagonService.getAllWagons();
    console.log(wagons);
    res.status(200).json({
        data: wagons
    })
}
async function createWagonOrder (req, res){
    const { wagon_number, wagon_departure_date } = req.body;
    const wagonId = await wagonService.createWagonOrder(wagon_number, wagon_departure_date);
    res.status(200).json({
        message: "Create new wagon success with ID: " + wagonId
    })
}
async function getAllWagonDetails (req, res){
    const wagonDetails = await wagonService.getAllWagonDetails();
    console.log(wagonDetails);
    res.status(200).json({
        data: wagonDetails
    })
}
async function createWagonDetail (req, res){
    const { WagonIDs, OrderIDs } = req.body;
    const result = await wagonService.createWagonDetail(WagonIDs, OrderIDs);
    res.status(200).json(result);
}

module.exports = {
    getAllWagons,
    createWagonOrder,
    getAllWagonDetails,
    createWagonDetail
}
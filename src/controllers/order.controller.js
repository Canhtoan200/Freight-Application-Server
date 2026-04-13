const orderService = require("../services/order.service.js");

async function getAllOrders (req, res){
    const orders = await orderService.getAllOrders();
    console.log(orders);
    res.status(200).json({
        data: orders
    })
}
async function createGuestOrder (req, res){
    const { order_name, sender_name, receiver_name, sender_address, receiver_address, sender_phone_number, receiver_phone_number, goods_quantity, goods_weight, goods_volume, note, handling_instruction, shipping_status } = req.body;
    const orderId = await orderService.createGuestOrder(order_name, sender_name, receiver_name, sender_address, receiver_address, sender_phone_number, receiver_phone_number, goods_quantity, goods_weight, goods_volume, note, handling_instruction, shipping_status);
    res.status(200).json({
        message: "Create new order success with ID: " + orderId
    })
}
module.exports = {
    getAllOrders,
    createGuestOrder
}
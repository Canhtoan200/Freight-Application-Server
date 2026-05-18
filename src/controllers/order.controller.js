const orderService = require("../services/order.service.js");

async function getAllOrders (req, res){
    const orders = await orderService.getAllOrders();
    console.log(orders);
    res.status(200).json({
        data: orders
    })
}
async function getAllOrderByStatus (req, res){
     const { shipping_status } = req.body;
    const orders = await orderService.getAllOrderByStatus(shipping_status);
    console.log(orders);
    res.status(200).json({
        data: orders
    })
}
async function createGuestOrder (req, res){
    const { order_name, sender_name, receiver_name, sender_address, receiver_address, sender_phone_number, receiver_phone_number, goods_quantity, goods_weight, goods_volume, note, handling_instruction, shipping_status, organization } = req.body;
    const orderId = await orderService.createGuestOrder(order_name, sender_name, receiver_name, sender_address, receiver_address, sender_phone_number, receiver_phone_number, goods_quantity, goods_weight, goods_volume, note, handling_instruction, shipping_status, organization);
    res.status(200).json({
        message: "Create new order success with ID: " + orderId
    })
}
async function updateShippingStatus(req, res) {
    const { OrderID, shipping_status } = req.body;
    if (!OrderID || !shipping_status) {
        return res.status(400).json({ message: "OrderID và shipping_status là bắt buộc." });
    }
    const success = await orderService.updateShippingStatus(OrderID, shipping_status);
    if (success) {
        res.status(200).json({ message: "Cập nhật trạng thái thành công." });
    } else {
        res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }
}
module.exports = {
    getAllOrders,
    getAllOrderByStatus,
    createGuestOrder,
    updateShippingStatus
}
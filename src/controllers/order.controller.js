const orderService = require("../services/order.service.js");
const database = require("../configs/db.configs.js");
const ExcelJS = require("exceljs");

async function getAllOrders (req, res){
    const orders = await orderService.getAllOrders();
    res.status(200).json({
        data: orders
    })
}
async function getAllOrdersByOrganization(req, res) {
    const userID = req.authenticatedUser?.id;
    if (!userID) {
        return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ." });
    }
    const [users] = await database.execute(
        "SELECT position, organization FROM user WHERE ID = ?",
        [userID]
    );
    const user = users[0];
    if (!user || user.position !== "Guest") {
        return res.status(403).json({ message: "Tài khoản không có quyền theo dõi đơn hàng." });
    }
    if (!user.organization) {
        return res.status(400).json({ message: "Tài khoản chưa thuộc tổ chức nào." });
    }
    const orders = await orderService.getOrdersByOrganization(user.organization);
    return res.status(200).json({ data: orders });
}
async function getOrdersForAuthenticatedOrganization(req, res) {
    return getAllOrdersByOrganization(req, res);
}
async function getOrderByID (req, res){
    const { OrderID } = req.query;
    const order = await orderService.getOrderByID(OrderID);
    res.status(200).json({
        data: order
    })
}
async function getAllOrderByStatus (req, res){
    const shipping_status = req.query.shipping_status ?? req.body?.shipping_status;
    const orders = await orderService.getAllOrderByStatus(shipping_status);
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
async function searchOrders(req, res) {
    try {
        const { wagon_departure_date, wagon_number, sender_name, receiver_name } = req.body;
        const orders = await orderService.searchOrders({
            wagon_departure_date,
            wagon_number,
            sender_name,
            receiver_name
        });
        res.status(200).json({ data: orders });
    } catch (error) {
        if (error.statusCode === 400) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Lỗi tìm kiếm đơn hàng." });
    }
}

module.exports = {
    getAllOrders,
    getAllOrdersByOrganization,
    getOrdersForAuthenticatedOrganization,
    getOrderByID,
    getAllOrderByStatus,
    createGuestOrder,
    updateShippingStatus,
    searchOrders
}
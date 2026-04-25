const database = require("../configs/db.configs.js");
require("dotenv").config();

async function getAllOrders() {
    // thực hiện truy vấn để lấy tất cả các đơn hàng
    const [rows] = await database.execute('SELECT * FROM shipping_orders');
    return rows;
}
async function getAllOrderByStatus(shipping_status) {
    // thực hiện truy vấn để lấy tất cả các đơn hàng
    const [rows] = await database.execute('SELECT * FROM shipping_orders WHERE shipping_status = ?',[shipping_status]);
    return rows;
}
async function createGuestOrder(order_name, sender_name, receiver_name, sender_address, receiver_address, sender_phone_number, receiver_phone_number, goods_quantity, goods_weight, goods_volume, note, handling_instruction, shipping_status, organization) {
    try {
        // 1. Thực hiện câu lệnh INSERT để tạo đơn hàng mới
        const insertQuery = `
                INSERT INTO shipping_orders (
                    order_name, sender_name, receiver_name, 
                    sender_address, receiver_address, sender_phone_number, 
                    receiver_phone_number, goods_quantity, goods_weight, 
                    goods_volume, note, handling_instruction, shipping_status, organization
                ) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
        const [insertResult] = await database.execute(insertQuery, [
            order_name, sender_name, receiver_name,
            sender_address, receiver_address, sender_phone_number,
            receiver_phone_number, goods_quantity, goods_weight,
            goods_volume, note, handling_instruction, shipping_status, organization
        ]);
        // 3. Trả về ID mới
        if (insertResult && insertResult.insertId) {
            console.log("Đã tạo đơn hàng mới với ID:", insertResult.insertId);
            return insertResult.insertId;
        }

        return false;
    } catch (err) {
        console.error("Lỗi tạo đơn hàng:", err);
        throw err; // Ném lỗi để controller có thể xử lý
    }
}
module.exports = {
    getAllOrders,
    getAllOrderByStatus,
    createGuestOrder
}
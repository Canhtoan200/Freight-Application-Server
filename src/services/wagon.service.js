const database = require("../configs/db.configs.js");
require("dotenv").config();

async function getAllWagons() {
    // thực hiện truy vấn để lấy tất cả các đơn hàng
    const [rows] = await database.execute('SELECT * FROM shipping_wagons');
    return rows;
}
async function createWagonOrder(wagon_number, wagon_departure_date) {
    try {
        // 1. Thực hiện câu lệnh INSERT để tạo đơn hàng mới
        const insertQuery = `
                INSERT INTO shipping_wagons (
                    wagon_number, wagon_departure_date
                ) VALUES (?, ?)
            `;
        const [insertResult] = await database.execute(insertQuery, [
            wagon_number, wagon_departure_date
        ]);
        // 3. Trả về ID mới
        if (insertResult && insertResult.insertId) {
            console.log("Đã tạo toa tàu mới với ID:", insertResult.insertId);
            return insertResult.insertId;
        }

        return false;
    } catch (err) {
        console.error("Lỗi tạo toa tàu:", err);
        throw err; // Ném lỗi để controller có thể xử lý
    }
}
async function getWagonDetailID(WagonID) {
    // thực hiện truy vấn để lấy tất cả các đơn hàng
    const [rows] = await database.execute('SELECT * FROM wagon_details WHERE WagonIDs = ?', [WagonID]);
    const orderIDs = rows.map(row => row.OrderIDs);
    let allOrders = []; 
    for (const orderID of orderIDs) {
        const [orderRows] = await database.execute('SELECT * FROM shipping_orders WHERE OrderID = ?', [orderID]);
        if (orderRows.length > 0) {
            allOrders.push(orderRows[0]); // Thêm đơn hàng vào mảng
        }
    }
    return allOrders;
}
async function createWagonDetail (WagonIDs, OrderIDs){
    if (!WagonIDs || !OrderIDs || !Array.isArray(OrderIDs)) {
        return { message: "Dữ liệu không hợp lệ" };
    }
    // Chuẩn bị dữ liệu cho Bulk Insert: [[WagonIDs, id1], [WagonIDs, id2], ...]
    const values = OrderIDs.map(OrderIDs => [WagonIDs, OrderIDs]);

    const sql = "INSERT INTO wagon_details (WagonIDs, OrderIDs) VALUES ?";
    // Thêm số toa tàu vào bảng đơn hàng khi tạo chi tiết toa tàu
    const selectWagonNumberSql = "SELECT wagon_number FROM shipping_wagons WHERE WagonID = ?";
    const updateOrderSql = "UPDATE shipping_orders SET wagon_number = ? WHERE OrderID = ?";
    try {
        // Thực hiện chèn nhiều dòng cùng lúc
        const [result] = await database.query(sql, [values]);
        // Lấy số toa tàu từ bảng shipping_wagons
        const [wagonRows] = await database.execute(selectWagonNumberSql, [WagonIDs]);
        const wagonNumber = wagonRows.length > 0 ? wagonRows[0].wagon_number : null;
        // Cập nhật số toa tàu cho từng đơn hàng
        for (const orderID of OrderIDs) {
            await database.execute(updateOrderSql, [wagonNumber, orderID]);
        }
        return ({
            message: "Đã thêm đơn hàng vào chi tiết toa tàu thành công",
            affectedRows: result.affectedRows
        });
    } catch (error) {
        console.error("Lỗi khi tạo chi tiết toa tàu:", error);
        return { message: "Lỗi server", error: error.message };
    }
}
module.exports = {
    getAllWagons,
    createWagonOrder,
    createWagonDetail,
    getWagonDetailID
}
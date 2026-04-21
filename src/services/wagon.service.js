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
async function createWagonDetail (WagonIDs, OrderIDs){
    if (!WagonIDs || !OrderIDs || !Array.isArray(OrderIDs)) {
        return { message: "Dữ liệu không hợp lệ" };
    }
    // Chuẩn bị dữ liệu cho Bulk Insert: [[WagonIDs, id1], [WagonIDs, id2], ...]
    const values = OrderIDs.map(OrderIDs => [WagonIDs, OrderIDs]);

    const sql = "INSERT INTO wagon_details (WagonIDs, OrderIDs) VALUES ?";

    try {
        // Thực hiện chèn nhiều dòng cùng lúc
        const [result] = await database.query(sql, [values]);
        
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
    createWagonDetail
}
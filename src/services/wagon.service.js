const database = require("../configs/db.configs.js");
require("dotenv").config();

async function getAllWagons() {
    // thực hiện truy vấn để lấy tất cả các đơn hàng
    const [rows] = await database.execute('SELECT * FROM shipping_wagons');
    return rows;
}
async function createWagonOrder(wagon_number, wagon_departure_date, wagon_arrival_date, wagon_route) {
    try {
        // 1. Thực hiện câu lệnh INSERT để tạo đơn hàng mới
        const insertQuery = `
                INSERT INTO shipping_wagons (
                    wagon_number, wagon_departure_date, wagon_arrival_date, wagon_route
                ) VALUES (?, ?, ?, ?)
            `;
        const [insertResult] = await database.execute(insertQuery, [
            wagon_number, wagon_departure_date, wagon_arrival_date, wagon_route
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
    if (!WagonIDs || !OrderIDs) {
        return { message: "Dữ liệu không hợp lệ" };
    }
    try {
        // Kiểm tra đơn hàng đã được thêm vào toa nào chưa
        const [existing] = await database.execute(
            "SELECT * FROM wagon_details WHERE OrderIDs = ?",
            [OrderIDs]
        );
        if (existing.length > 0) {
            return { message: "Đơn hàng này đã được thêm vào một toa tàu rồi." };
        }

        const sql = "INSERT INTO wagon_details (WagonIDs, OrderIDs) VALUES (?, ?)";
        const selectWagonSql = "SELECT wagon_number, wagon_departure_date, wagon_arrival_date FROM shipping_wagons WHERE WagonID = ?";
        const updateOrderSql = "UPDATE shipping_orders SET wagon_number = ? WHERE OrderID = ?";
        const updateWargonDepartureDateSql = "UPDATE shipping_orders SET wagon_departure_date = ? WHERE OrderID = ?";
        const updateWargonArrivalDateSql = "UPDATE shipping_orders SET wagon_arrival_date = ?, shipping_status = 'Đã lên toa' WHERE OrderID = ?";

        const [result] = await database.execute(sql, [WagonIDs, OrderIDs]);
        const [wagonRows] = await database.execute(selectWagonSql, [WagonIDs]);
        const wagonNumber = wagonRows.length > 0 ? wagonRows[0].wagon_number : null;
        const wagonDepartureDate = wagonRows.length > 0 ? wagonRows[0].wagon_departure_date : null;
        const wagonArrivalDate = wagonRows.length > 0 ? wagonRows[0].wagon_arrival_date : null;

        await database.execute(updateOrderSql, [wagonNumber, OrderIDs]);
        await database.execute(updateWargonDepartureDateSql, [wagonDepartureDate, OrderIDs]);
        await database.execute(updateWargonArrivalDateSql, [wagonArrivalDate, OrderIDs]);

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
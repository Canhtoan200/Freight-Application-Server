const database = require("../configs/db.configs.js");
require("dotenv").config();

async function getAllDrivers() {
    // thực hiện truy vấn để lấy tất cả các tài xế
    const [rows] = await database.execute('SELECT * FROM drivers');
    return rows;
}
async function getAllDriverOrders() {
    // thực hiện truy vấn để lấy tất cả các đơn hàng của tài xế
    const [rows] = await database.execute('SELECT * FROM driver_order_details');
    return rows;
}
async function createDriver(driver_name, driver_link, driver_license_plate_number, driver_phone_number, amount_of_gas, money_amount_of_gas, the_remaining_volume_of_the_car, the_remaining_weight_of_the_car, drop_off_distance) {
    try {
        // 1. Thực hiện câu lệnh INSERT để tạo tài xế mới
        const insertQuery = `
                INSERT INTO drivers (
                    driver_name, driver_link, driver_license_plate_number, driver_phone_number, amount_of_gas, money_amount_of_gas, the_remaining_volume_of_the_car, the_remaining_weight_of_the_car, drop_off_distance
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
        const [insertResult] = await database.execute(insertQuery, [
            driver_name, driver_link, driver_license_plate_number, driver_phone_number, amount_of_gas, money_amount_of_gas, the_remaining_volume_of_the_car, the_remaining_weight_of_the_car, drop_off_distance
        ]);
        // 3. Trả về ID mới
        if (insertResult && insertResult.insertId) {
            console.log("Đã tạo tài xế mới với ID:", insertResult.insertId);
            return insertResult.insertId;
        }

        return false;
    } catch (err) {
        console.error("Lỗi tạo tài xế:", err);
        throw err; // Ném lỗi để controller có thể xử lý
    }
}
async function createDriverOrderDetail (DriverIDs, OrderIDs){
    if (!DriverIDs || !OrderIDs || !Array.isArray(OrderIDs)) {
        return { message: "Dữ liệu không hợp lệ" };
    }
    // Chuẩn bị dữ liệu cho Bulk Insert: [[DriverIDs, id1], [DriverIDs, id2], ...]
    const values = OrderIDs.map(id => [DriverIDs, id]);

    const sql = "INSERT INTO driver_order_details (DriverIDs, OrderIDs) VALUES ?";
    // Thêm thông tin tài xế vào bảng đơn hàng khi tạo chi tiết đơn hàng
    const selectDriverSql = "SELECT driver_name, driver_license_plate_number, driver_phone_number FROM drivers WHERE DriverIDs = ?";
    const updateOrderSql = "UPDATE shipping_orders SET driver_name = ?, driver_license_plate = ?, driver_phone_number = ? WHERE OrderID = ?";
    try {
        // Thực hiện chèn nhiều dòng cùng lúc
        const [result] = await database.query(sql, [values]);
        // Lấy tên tài xế, biển số xe và số điện thoại tài xế từ bảng drivers
        const [driverRows] = await database.execute(selectDriverSql, [DriverIDs]);
        const driverName = driverRows.length > 0 ? driverRows[0].driver_name : null;
        const driverLicensePlate = driverRows.length > 0 ? driverRows[0].driver_license_plate_number : null;
        const driverPhoneNumber = driverRows.length > 0 ? driverRows[0].driver_phone_number : null;
        // Cập nhật thông tin tài xế cho từng đơn hàng
        for (const orderID of OrderIDs) {
            await database.execute(updateOrderSql, [driverName, driverLicensePlate, driverPhoneNumber, orderID]);
        }
        return ({
            message: "Đã thêm đơn hàng vào chi tiết tài xế thành công",
            affectedRows: result.affectedRows
        });
    } catch (error) {
        console.error("Lỗi khi tạo chi tiết tài xế:", error);
        return { message: "Lỗi server", error: error.message };
    }
}
module.exports = {
    getAllDrivers,
    getAllDriverOrders,
    createDriver,
    createDriverOrderDetail
}
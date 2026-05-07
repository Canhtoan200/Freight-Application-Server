const database = require("../configs/db.configs.js");
require("dotenv").config();

async function getAllDrivers() {
    // thực hiện truy vấn để lấy tất cả các tài xế
    const [rows] = await database.execute('SELECT * FROM drivers');
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
module.exports = {
    getAllDrivers,
    createDriver
}
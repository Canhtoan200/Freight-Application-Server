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
async function getDriverPosition(positionID, driverID) {
    if (positionID) {
        const [rows] = await database.execute('SELECT * FROM driver_position WHERE positionID = ?', [positionID]);
        return rows[0] ?? null;
    }
    if (driverID) {
        const [rows] = await database.execute('SELECT * FROM driver_position WHERE driverID = ?', [driverID]);
        return rows[0] ?? null;
    }
    const [rows] = await database.execute('SELECT * FROM driver_position');
    return rows;
}
async function getDriverByDriverID(driverID) {
    const [rows] = await database.execute('SELECT * FROM drivers WHERE DriverIDs = ?', [driverID]);
    return rows.length > 0 ? rows[0] : null;
}
async function getDriverIDBasedOnUserID(userID) {
    const [rows] = await database.execute('SELECT DriverIDs FROM drivers WHERE accountID = ?', [userID]);
    return rows.length > 0 ? rows[0].DriverIDs : null;
}
async function getDriverOrderBasedOnDriverID(driverID) {
    const [rows] = await database.execute('SELECT * FROM driver_order_details WHERE DriverIDs = ?', [driverID]);
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
    const updateOrderSql = "UPDATE shipping_orders SET receiving_driver_name = ?, receiving_driver_license_plate = ?, receiving_driver_phone_number = ?, shipping_status = 'Tài xế đang đi!', order_dispatch_date = NOW() WHERE OrderID = ?";
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

async function getAllDriverPartners() {
    const [rows] = await database.execute(`
        SELECT DriverPartnerIDs AS DriverIDs, accountID, driver_name, driver_link,
            driver_license_plate_number, driver_phone_number, amount_of_gas,
            money_amount_of_gas, the_remaining_volume_of_the_car,
            the_remaining_weight_of_the_car, drop_off_distance, create_at
        FROM driver_partners
    `);
    return rows;
}
async function getDriverPartnerIDBasedOnUserID(userID) {
    const [rows] = await database.execute(
        'SELECT DriverPartnerIDs FROM driver_partners WHERE accountID = ?',
        [userID]
    );
    return rows.length > 0 ? rows[0].DriverPartnerIDs : null;
}
async function getDriverPartnerByID(driverPartnerID) {
    const [rows] = await database.execute(`
        SELECT DriverPartnerIDs AS DriverIDs, accountID, driver_name, driver_link,
            driver_license_plate_number, driver_phone_number
        FROM driver_partners
        WHERE DriverPartnerIDs = ?
        LIMIT 1
    `, [driverPartnerID]);
    return rows[0] ?? null;
}
async function getDriverPartnerOrdersByID(driverPartnerID) {
    const [rows] = await database.execute(
        'SELECT * FROM driver_partners_order_details WHERE DriverPartnerIDs = ?',
        [driverPartnerID]
    );
    return rows;
}
async function createDriverPartnerOrderDetail(driverPartnerID, orderIDs) {
    if (!Number.isInteger(Number(driverPartnerID)) || Number(driverPartnerID) <= 0 ||
        !Array.isArray(orderIDs) || orderIDs.length === 0 ||
        orderIDs.some((id) => !Number.isInteger(Number(id)) || Number(id) <= 0)) {
        const error = new Error("Mã tài xế hoặc danh sách đơn hàng không hợp lệ.");
        error.statusCode = 400;
        throw error;
    }

    const connection = await database.getConnection();
    try {
        await connection.beginTransaction();
        const [driverRows] = await connection.execute(
            `SELECT driver_name, driver_license_plate_number, driver_phone_number
             FROM driver_partners WHERE DriverPartnerIDs = ? FOR UPDATE`,
            [driverPartnerID]
        );
        if (driverRows.length === 0) {
            const error = new Error("Không tìm thấy tài xế đối tác.");
            error.statusCode = 404;
            throw error;
        }

        const driver = driverRows[0];
        let affectedRows = 0;
        for (const rawOrderID of orderIDs) {
            const orderID = Number(rawOrderID);
            const [orders] = await connection.execute(
                "SELECT OrderID FROM shipping_orders WHERE OrderID = ? FOR UPDATE",
                [orderID]
            );
            if (orders.length === 0) {
                const error = new Error(`Không tìm thấy đơn hàng #${orderID}.`);
                error.statusCode = 404;
                throw error;
            }
            const [existingAssignments] = await connection.execute(
                `SELECT DriverOrderID FROM driver_partners_order_details
                 WHERE OrderIDs = ?`,
                [orderID]
            );
            if (existingAssignments.length === 0) {
                await connection.execute(
                    "INSERT INTO driver_partners_order_details (DriverPartnerIDs, OrderIDs) VALUES (?, ?)",
                    [driverPartnerID, orderID]
                );
            } else {
                await connection.execute(
                    "DELETE FROM driver_partners_order_details WHERE OrderIDs = ?",
                    [orderID]
                );
                await connection.execute(
                    "INSERT INTO driver_partners_order_details (DriverPartnerIDs, OrderIDs) VALUES (?, ?)",
                    [driverPartnerID, orderID]
                );
            }
            await connection.execute(
                `UPDATE shipping_orders SET delivery_driver_name = ?, delivery_driver_license_plate = ?,
                    delivery_driver_phone_number = ?, shipping_status = 'Đang giao hàng',
                    order_dispatch_date = NOW() WHERE OrderID = ?`,
                [
                    driver.driver_name,
                    driver.driver_license_plate_number,
                    driver.driver_phone_number,
                    orderID
                ]
            );
            affectedRows += 1;
        }
        await connection.commit();
        return { message: "Đã phân công đơn hàng cho tài xế đối tác.", affectedRows };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
module.exports = {
    getAllDrivers,
    getAllDriverOrders,
    getDriverPosition,
    getDriverByDriverID,
    getDriverIDBasedOnUserID,
    getDriverOrderBasedOnDriverID,
    createDriver,
    createDriverOrderDetail,
    getAllDriverPartners,
    getDriverPartnerIDBasedOnUserID,
    getDriverPartnerByID,
    getDriverPartnerOrdersByID,
    createDriverPartnerOrderDetail
}
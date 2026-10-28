const database = require("../configs/db.configs.js");
require("dotenv").config();

async function getAllWagons() {
    // thực hiện truy vấn để lấy tất cả các đơn hàng
    const [rows] = await database.execute('SELECT * FROM shipping_wagons');
    return rows;
}
async function createWagonOrder(wagon_number, wagon_departure_date, wagon_arrival_date, wagon_route, wagon_type = "LOADING") {
    const wagonType = String(wagon_type || "LOADING").toUpperCase();
    if (!["LOADING", "UNLOADING"].includes(wagonType)) {
        const error = new Error("Loại toa tàu phải là LOADING hoặc UNLOADING.");
        error.statusCode = 400;
        throw error;
    }
    try {
        // 1. Thực hiện câu lệnh INSERT để tạo đơn hàng mới
        const insertQuery = `
                INSERT INTO shipping_wagons (
                    wagon_number, wagon_departure_date, wagon_arrival_date, wagon_route, wagon_type
                ) VALUES (?, ?, ?, ?, ?)
            `;
        const [insertResult] = await database.execute(insertQuery, [
            wagon_number, wagon_departure_date, wagon_arrival_date, wagon_route, wagonType
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
async function convertWagonToUnloading(WagonID) {
    const wagonId = Number(WagonID);
    if (!Number.isInteger(wagonId) || wagonId <= 0) {
        const error = new Error("Mã toa tàu không hợp lệ.");
        error.statusCode = 400;
        throw error;
    }

    const connection = await database.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
            "SELECT wagon_type FROM shipping_wagons WHERE WagonID = ? FOR UPDATE",
            [wagonId]
        );
        if (rows.length === 0) {
            const error = new Error("Không tìm thấy toa tàu.");
            error.statusCode = 404;
            throw error;
        }
        const wagon = rows[0];
        if (String(wagon.wagon_type || "LOADING").toUpperCase() !== "LOADING") {
            const error = new Error("Chỉ có thể chuyển toa xếp sang toa dỡ.");
            error.statusCode = 409;
            throw error;
        }
        await connection.execute(
            "UPDATE shipping_wagons SET wagon_type = 'UNLOADING' WHERE WagonID = ?",
            [wagonId]
        );

        const [details] = await connection.execute(
            "SELECT OrderIDs FROM wagon_details WHERE WagonIDs = ?",
            [wagonId]
        );
        let affectedOrders = 0;
        for (const detail of details) {
            const orderId = Number(detail.OrderIDs);
            if (!Number.isInteger(orderId) || orderId <= 0) continue;

            await connection.execute(
                `UPDATE shipping_orders
                 SET shipping_status = 'Đang dỡ hàng',
                     delivery_driver_name = NULL,
                     delivery_driver_license_plate = NULL,
                     delivery_driver_phone_number = NULL
                 WHERE OrderID = ?`,
                [orderId]
            );
            await connection.execute(
                "DELETE FROM driver_order_details WHERE OrderIDs = ?",
                [orderId]
            );
            await connection.execute(
                "DELETE FROM driver_partners_order_details WHERE OrderIDs = ?",
                [orderId]
            );
            affectedOrders += 1;
        }

        await connection.commit();
        return { WagonID: wagonId, wagon_type: "UNLOADING", affectedOrders };
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error("Lỗi rollback khi chuyển toa sang toa dỡ:", rollbackError);
        }
        throw error;
    } finally {
        connection.release();
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
    const orderIdValue = Array.isArray(OrderIDs)
        ? (OrderIDs.length === 1 ? OrderIDs[0] : NaN)
        : OrderIDs;
    const wagonId = Number(WagonIDs);
    const orderId = Number(orderIdValue);
    if (!Number.isInteger(wagonId) || wagonId <= 0 || !Number.isInteger(orderId) || orderId <= 0) {
        const error = new Error("Dữ liệu toa tàu hoặc đơn hàng không hợp lệ");
        error.statusCode = 400;
        throw error;
    }

    const connection = await database.getConnection();
    try {
        await connection.beginTransaction();

        const [wagonRows] = await connection.execute(
            "SELECT wagon_number, wagon_departure_date, wagon_arrival_date FROM shipping_wagons WHERE WagonID = ? FOR UPDATE",
            [wagonId]
        );
        if (wagonRows.length === 0) {
            await connection.rollback();
            return { message: "Không tìm thấy toa tàu.", affectedRows: 0, statusCode: 404 };
        }

        const [orderRows] = await connection.execute(
            "SELECT OrderID FROM shipping_orders WHERE OrderID = ? FOR UPDATE",
            [orderId]
        );
        if (orderRows.length === 0) {
            await connection.rollback();
            return { message: "Không tìm thấy đơn hàng.", affectedRows: 0, statusCode: 404 };
        }

        const [existing] = await connection.execute(
            "SELECT OrderIDs FROM wagon_details WHERE OrderIDs = ? FOR UPDATE",
            [orderId]
        );
        if (existing.length > 0) {
            await connection.rollback();
            return { message: "Đơn hàng này đã được thêm vào một toa tàu rồi.", affectedRows: 0, statusCode: 409 };
        }

        const sql = "INSERT INTO wagon_details (WagonIDs, OrderIDs) VALUES (?, ?)";
        const wagon = wagonRows[0];
        const [result] = await connection.execute(sql, [wagonId, orderId]);
        await connection.execute(
            "UPDATE shipping_orders SET wagon_number = ?, wagon_departure_date = ?, wagon_arrival_date = ?, shipping_status = 'Đã lên toa' WHERE OrderID = ?",
            [wagon.wagon_number, wagon.wagon_departure_date, wagon.wagon_arrival_date, orderId]
        );
        await connection.commit();

        return ({
            message: "Đã thêm đơn hàng vào chi tiết toa tàu thành công",
            affectedRows: result.affectedRows,
            statusCode: 200
        });
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error("Lỗi rollback khi thêm đơn hàng vào toa tàu:", rollbackError);
        }
        throw error;
    } finally {
        connection.release();
    }
}
module.exports = {
    getAllWagons,
    createWagonOrder,
    convertWagonToUnloading,
    createWagonDetail,
    getWagonDetailID
}
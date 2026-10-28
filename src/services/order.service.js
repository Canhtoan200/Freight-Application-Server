const database = require("../configs/db.configs.js");
require("dotenv").config();

async function getAllOrders() {
    const [rows] = await database.execute(`
        SELECT o.*, dp.driver_link AS delivery_driver_link
        FROM shipping_orders o
        LEFT JOIN driver_partners_order_details dpod ON dpod.OrderIDs = o.OrderID
        LEFT JOIN driver_partners dp ON dp.DriverPartnerIDs = dpod.DriverPartnerIDs
    `);
    return rows;
}
async function getOrdersByOrganization(organization) {
    const [rows] = await database.execute(`
        SELECT o.*, dp.driver_link AS delivery_driver_link
        FROM shipping_orders o
        LEFT JOIN driver_partners_order_details dpod ON dpod.OrderIDs = o.OrderID
        LEFT JOIN driver_partners dp ON dp.DriverPartnerIDs = dpod.DriverPartnerIDs
        WHERE o.organization = ?
    `, [organization]);
    return rows;
}
async function getOrderByID(OrderID) {
    const [rows] = await database.execute(`
        SELECT o.*, dp.driver_link AS delivery_driver_link
        FROM shipping_orders o
        LEFT JOIN driver_partners_order_details dpod ON dpod.OrderIDs = o.OrderID
        LEFT JOIN driver_partners dp ON dp.DriverPartnerIDs = dpod.DriverPartnerIDs
        WHERE o.OrderID = ? LIMIT 1
    `, [OrderID]);
    return rows[0];
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
async function updateShippingStatus(OrderID, shipping_status) {
    try {
        const [result] = await database.execute(
            'UPDATE shipping_orders SET shipping_status = ? WHERE OrderID = ?',
            [shipping_status, OrderID]
        );
        if (result.affectedRows > 0) return true;
        const [rows] = await database.execute(
            "SELECT OrderID FROM shipping_orders WHERE OrderID = ?",
            [OrderID]
        );
        return rows.length > 0;
    } catch (err) {
        console.error("Lỗi cập nhật trạng thái:", err);
        throw err;
    }
}
async function updateAccountantOrder(OrderID, fields) {
    const columnNames = {
        order_name: "order_name",
        sender_name: "sender_name",
        sender_address: "sender_address",
        sender_phone_number: "sender_phone_number",
        receiver_name: "receiver_name",
        receiver_address: "receiver_address",
        receiver_phone_number: "receiver_phone_number",
        goods_quantity: "goods_quantity",
        goods_weight: "goods_weight",
        goods_volume: "goods_volume",
        note: "note",
        handling_instruction: "handling_instruction"
    };
    const entries = Object.entries(fields).filter(([key]) => columnNames[key]);
    if (entries.length === 0) {
        const error = new Error("Không có thông tin hợp lệ để cập nhật.");
        error.statusCode = 400;
        throw error;
    }
    const setClause = entries.map(([key]) => `\`${columnNames[key]}\` = ?`).join(", ");
    const values = entries.map(([, value]) => value);
    values.push(OrderID);
    const [result] = await database.execute(
        `UPDATE shipping_orders SET ${setClause} WHERE OrderID = ?`,
        values
    );
    if (result.affectedRows > 0) return true;
    const [rows] = await database.execute(
        "SELECT OrderID FROM shipping_orders WHERE OrderID = ?",
        [OrderID]
    );
    return rows.length > 0;
}
async function getDeliveryEvidence(OrderID) {
    const [rows] = await database.execute(
        "SELECT endpoint, image_data, mime_type, file_name, updated_at FROM order_delivery_evidence WHERE OrderID = ?",
        [OrderID]
    );
    return rows.map((row) => ({
        endpoint: row.endpoint,
        imageData: row.image_data.toString("base64"),
        mimeType: row.mime_type,
        fileName: row.file_name,
        updatedAt: row.updated_at
    }));
}
async function saveDeliveryEvidence({ OrderID, endpoint, imageData, mimeType, fileName, userID }) {
    await database.execute(
        `INSERT INTO order_delivery_evidence
            (OrderID, endpoint, image_data, mime_type, file_name, updated_by)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            image_data = VALUES(image_data),
            mime_type = VALUES(mime_type),
            file_name = VALUES(file_name),
            updated_by = VALUES(updated_by),
            updated_at = CURRENT_TIMESTAMP`,
        [OrderID, endpoint, imageData, mimeType, fileName, userID]
    );
    return true;
}
async function searchOrders({ wagon_departure_date, wagon_number, sender_name, receiver_name }) {
    try {
        const conditions = [];
        const values = [];

        if (wagon_departure_date == null || String(wagon_departure_date).trim() === "") {
            const error = new Error("Chưa nhập ngày khởi hành của toa xe. Vui lòng nhập giá trị hợp lệ.");
            error.statusCode = 400;
            throw error;
        }

        const dateWindows = {
            "1 week ago": "1 WEEK",
            "1_week": "1 WEEK",
            "1 month ago": "1 MONTH",
            "1_month": "1 MONTH",
            "2 month ago": "2 MONTH",
            "2_month": "2 MONTH",
            "1 quarter ago": "3 MONTH",
            "1_quarter": "3 MONTH",
            "2 quarter ago": "6 MONTH",
            "2_quarter": "6 MONTH",
            "1 year ago": "1 YEAR",
            "1_year": "1 YEAR",
            "2 year ago": "2 YEAR",
            "2_year": "2 YEAR"
        };

        const dateFilter = String(wagon_departure_date).trim().toLowerCase();
        if (dateFilter !== "all") {
            const dateWindow = dateWindows[dateFilter];
            if (!dateWindow) {
                const error = new Error("Ngày khởi hành của toa xe không hợp lệ. Vui lòng sử dụng 'all', '1 week ago', '1 month ago', '2 month ago', '1 quarter ago', '2 quarter ago', '1 year ago', hoặc '2 year ago'.");
                error.statusCode = 400;
                throw error;
            }
            conditions.push(`wagon_departure_date >= DATE_SUB(CURDATE(), INTERVAL ${dateWindow})`);
        }

        if (wagon_number) {
            conditions.push("wagon_number LIKE ?");
            values.push(`%${wagon_number}%`);
        }
        if (sender_name) {
            conditions.push("sender_name LIKE ?");
            values.push(`%${sender_name}%`);
        }
        if (receiver_name) {
            conditions.push("receiver_name LIKE ?");
            values.push(`%${receiver_name}%`);
        }

        const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
        const [rows] = await database.execute(`SELECT * FROM shipping_orders${whereClause}`, values);
        return rows;
    } catch (err) {
        console.error("Lỗi tìm kiếm đơn hàng:", err);
        throw err;
    }
}

module.exports = {
    getAllOrders,
    getOrdersByOrganization,
    getOrderByID,
    getAllOrderByStatus,
    createGuestOrder,
    updateShippingStatus,
    searchOrders,
    updateAccountantOrder,
    getDeliveryEvidence,
    saveDeliveryEvidence
}
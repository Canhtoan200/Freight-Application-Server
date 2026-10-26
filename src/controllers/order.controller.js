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
    try {
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
    } catch (error) {
        console.error("Lỗi lấy đơn hàng theo tổ chức:", error);
        return res.status(500).json({ message: "Không thể tải đơn hàng theo tổ chức. Hãy kiểm tra log backend." });
    }
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
    const userID = req.authenticatedUser?.id;
    if (!userID) {
        return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ." });
    }
    const [users] = await database.execute(
        "SELECT position, organization FROM user WHERE ID = ?",
        [userID]
    );
    const user = users[0];
    if (!user || !["Guest", "Admin"].includes(user.position)) {
        return res.status(403).json({ message: "Tài khoản không có quyền tạo đơn hàng." });
    }
    const organization = user.position === "Guest" ? user.organization : req.body.organization;
    if (!organization) {
        return res.status(400).json({ message: "Tài khoản chưa thuộc tổ chức nào." });
    }
    const { order_name, sender_name, receiver_name, sender_address, receiver_address, sender_phone_number, receiver_phone_number, goods_quantity, goods_weight, goods_volume, note, handling_instruction, shipping_status } = req.body;
    const orderId = await orderService.createGuestOrder(order_name, sender_name, receiver_name, sender_address, receiver_address, sender_phone_number, receiver_phone_number, goods_quantity, goods_weight, goods_volume, note, handling_instruction, shipping_status, organization);
    res.status(200).json({
        message: "Create new order success with ID: " + orderId,
        data: { OrderID: orderId }
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
function parseOrderId(value) {
    const orderId = Number(value);
    return Number.isInteger(orderId) && orderId > 0 ? orderId : null;
}
async function getAccountantOrder(req, res) {
    const orderId = parseOrderId(req.params.OrderID);
    if (!orderId) {
        return res.status(400).json({ message: "Mã đơn hàng không hợp lệ." });
    }
    try {
        const order = await orderService.getOrderByID(orderId);
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
        }
        const evidence = await orderService.getDeliveryEvidence(orderId);
        return res.status(200).json({ data: order, evidence });
    } catch (error) {
        console.error("Lỗi tải thông tin chỉnh sửa đơn hàng:", error);
        return res.status(500).json({ message: "Không thể tải thông tin đơn hàng." });
    }
}
async function updateAccountantOrder(req, res) {
    const orderId = parseOrderId(req.params.OrderID);
    if (!orderId) {
        return res.status(400).json({ message: "Mã đơn hàng không hợp lệ." });
    }
    const stringLimits = {
        order_name: 100,
        sender_name: 100,
        sender_address: 255,
        sender_phone_number: 20,
        receiver_name: 100,
        receiver_address: 255,
        receiver_phone_number: 20,
        note: 45,
        handling_instruction: 45
    };
    for (const [field, maxLength] of Object.entries(stringLimits)) {
        const value = req.body?.[field];
        if (value !== undefined && value !== null &&
            (typeof value !== "string" || value.length > maxLength)) {
            return res.status(400).json({ message: `Giá trị ${field} không hợp lệ.` });
        }
    }
    for (const field of ["goods_quantity", "goods_weight", "goods_volume"]) {
        const value = req.body?.[field];
        if (value !== undefined && value !== null &&
            (typeof value !== "number" || !Number.isFinite(value) || value < 0 ||
                (field === "goods_quantity" && !Number.isInteger(value)))) {
            return res.status(400).json({ message: `Giá trị ${field} không hợp lệ.` });
        }
    }
    try {
        const success = await orderService.updateAccountantOrder(orderId, req.body || {});
        if (!success) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
        }
        return res.status(200).json({ message: "Cập nhật đơn hàng thành công." });
    } catch (error) {
        if (error.statusCode === 400) {
            return res.status(400).json({ message: error.message });
        }
        console.error("Lỗi cập nhật đơn hàng kế toán:", error);
        return res.status(500).json({ message: "Không thể cập nhật đơn hàng." });
    }
}
async function saveDeliveryEvidence(req, res) {
    const orderId = parseOrderId(req.params.OrderID);
    const { endpoint } = req.params;
    const { imageData, mimeType, fileName } = req.body || {};
    if (!orderId || !["sender", "receiver"].includes(endpoint)) {
        return res.status(400).json({ message: "Mã đơn hàng hoặc đầu giao nhận không hợp lệ." });
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType) ||
        typeof imageData !== "string" ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(imageData)) {
        return res.status(400).json({ message: "Ảnh phải có định dạng JPEG, PNG hoặc WebP." });
    }
    const imageBuffer = Buffer.from(imageData, "base64");
    if (imageBuffer.length === 0 || imageBuffer.length > 6 * 1024 * 1024) {
        return res.status(413).json({ message: "Ảnh không được vượt quá 6 MB." });
    }
    const matchesMimeType =
        (mimeType === "image/jpeg" && imageBuffer[0] === 0xff && imageBuffer[1] === 0xd8 && imageBuffer[2] === 0xff) ||
        (mimeType === "image/png" && imageBuffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
        (mimeType === "image/webp" && imageBuffer.toString("ascii", 0, 4) === "RIFF" && imageBuffer.toString("ascii", 8, 12) === "WEBP");
    if (!matchesMimeType || imageBuffer.toString("base64").replace(/=+$/, "") !== imageData.replace(/=+$/, "")) {
        return res.status(400).json({ message: "Dữ liệu ảnh không hợp lệ hoặc không khớp định dạng." });
    }
    try {
        const order = await orderService.getOrderByID(orderId);
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
        }
        await orderService.saveDeliveryEvidence({
            OrderID: orderId,
            endpoint,
            imageData: imageBuffer,
            mimeType,
            fileName: typeof fileName === "string" ? fileName.slice(0, 255) : null,
            userID: req.authenticatedUser.id
        });
        return res.status(200).json({ message: "Đã lưu ảnh biên bản giao nhận." });
    } catch (error) {
        console.error("Lỗi lưu ảnh biên bản giao nhận:", error);
        return res.status(500).json({ message: "Không thể lưu ảnh biên bản giao nhận." });
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
    searchOrders,
    getAccountantOrder,
    updateAccountantOrder,
    saveDeliveryEvidence
}
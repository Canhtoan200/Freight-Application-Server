const jwt = require("jsonwebtoken");
require("dotenv").config();

function requireAuthenticatedUser(req, res, next) {
    const authorization = req.headers.authorization || "";
    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ message: "Cần đăng nhập để truy cập dữ liệu." });
    }

    const secret = process.env.SECRET_KEY_JWT;
    if (!secret) {
        return res.status(500).json({ message: "Máy chủ chưa cấu hình xác thực." });
    }

    try {
        req.authenticatedUser = jwt.verify(token, secret);
        return next();
    } catch (error) {
        if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
        }
        return next(error);
    }
}

function requireAccountant(req, res, next) {
    if (!["Accountant", "AccountantPartner"].includes(req.authenticatedUser?.position)) {
        return res.status(403).json({ message: "Chỉ kế toán mới được chỉnh sửa đơn hàng." });
    }
    return next();
}

module.exports = { requireAuthenticatedUser, requireAccountant };

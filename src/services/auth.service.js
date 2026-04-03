const database = require("../configs/db.configs.js");
const jwt = require("jsonwebtoken");
const bscrypt = require("bcrypt");
require("dotenv").config();

// async function login(username, password) {
//     const query = `SELECT * FROM user WHERE username = '${username}' AND password = '${password}'`;
//     let result = await database.execute(query);
//     const user = result[0][0];
//     if(user){
//         const token = jwt.sign({ id: user.id, username: user.username, password:user.password, role: user.role }, process.env.SECRET_KEY_JWT, { expiresIn: "1h" });
//         return {
//             token,
//         };
//     }
//     return null;
// }
async function login(email, password) {
    // tìm user trong database theo email
    const [rows] = await database.execute('SELECT * FROM user WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) return null;
    // nếu có user rồi thì so sánh password người dùng nhập vào với password đã được mã hóa trong database
    const match = await bscrypt.compare(password, user.password_hash);
    if (!match) return null;

    const secret = process.env.SECRET_KEY_JWT;
    if (!secret) throw new Error('Missing SECRET_KEY_JWT');
    // nếu password đúng rồi thì tạo token cho user
    const token = jwt.sign(
        { id: user.ID, position: user.position, email: user.email }, // không gửi password
        secret,
        { expiresIn: '1h' }
    );
    const position = user.position;

    return { position, token };
}
async function register(position, email, password) {
    try {
        // 1. Đợi mã hóa mật khẩu xong (Dùng await thay vì callback)
        const hashPassword = await bscrypt.hash(password, 10);

        // 2. Thực hiện câu lệnh INSERT
        // Dùng dấu ? để bảo mật (tránh SQL Injection)
        const query = 'INSERT INTO user (position, email, password_hash) VALUES (?, ?, ?)';
        const [result] = await database.execute(query, [position, email, hashPassword]);

        // 3. Trả về ID mới
        if (result && result.insertId) {
            console.log("Đã tạo User với ID:", result.insertId);
            return result.insertId;
        }

        return false;
    } catch (err) {
        console.error("Lỗi đăng ký:", err);
        return false;
    }
}
module.exports = {
    login,
    register
}
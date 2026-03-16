const database = require("../configs/db.configs.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
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
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return null;

    const secret = process.env.SECRET_KEY_JWT;
    if (!secret) throw new Error('Missing SECRET_KEY_JWT');
    // nếu password đúng rồi thì tạo token cho user
    const token = jwt.sign(
        { id: user.ID, position: user.position, email: user.email }, // không gửi password
        secret,
        { expiresIn: '1h' }
    );

    return { token };
}
async function register(position, email, password) {
    // trước khi thêm vào database thì phải mã hóa mật khẩu của user đi
    // để mã hóa dùng thư viện bscript
    bscript.hash(password,10,async (err, hashPassword)=>{
        if(err){
            console.log(err);
        }else{
            const query = `INSERT INTO user (position, email, password_hash) VALUES ('${position}', '${email}', '${hashPassword}');`;
            let result = await database.execute(query);
            if(result){
                return result[0].insertId;
            }
            return false;
        }
    })
}
module.exports = {
    login,
    register
}
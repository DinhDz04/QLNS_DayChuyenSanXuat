import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

// Tạo token chứa thông tin cần thiết của người dùng (không chứa mật khẩu!)
export function taoToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Giải mã + kiểm tra token có hợp lệ không
// Nếu token sai/hết hạn -> hàm jwt.verify sẽ tự ném lỗi (throw)
export function xacMinhToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

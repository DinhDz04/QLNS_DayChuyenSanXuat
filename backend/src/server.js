import dotenv from "dotenv";
import app from "./app.js";
import pool from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Thử kết nối database ngay khi khởi động server, để biết lỗi cấu hình
// (sai host/user/password/database) ngay lập tức
async function kiemTraKetNoiDatabase() {
    try {
        await pool.query("SELECT 1");
        console.log("✅ Kết nối database thành công");
    } catch (err) {
        console.error("❌ KHÔNG kết nối được database:", err.message);
        console.error("   Kiểm tra lại file .env: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME");
    }
}

app.listen(PORT, async () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
    await kiemTraKetNoiDatabase();
});
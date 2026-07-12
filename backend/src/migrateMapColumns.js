import pool from "./config/db.js";

async function main() {
    console.log("=== BẮT ĐẦU NÂNG CẤP DB CHO BẢN ĐỒ ===");
    try {
        await pool.query(`
            ALTER TABLE cong_doan 
            ADD COLUMN vi_tri_x INT DEFAULT NULL,
            ADD COLUMN vi_tri_y INT DEFAULT NULL,
            ADD COLUMN xoay INT DEFAULT 0;
        `);
        console.log("=== NÂNG CẤP DB THÀNH CÔNG ===");
    } catch (err) {
        console.error("Lỗi khi nâng cấp DB (nếu đã chạy rồi thì lỗi là bình thường):", err.message);
    }
}

main().then(() => process.exit(0));

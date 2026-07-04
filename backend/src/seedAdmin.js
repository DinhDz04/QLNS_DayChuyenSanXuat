/**
 * Script này dùng để tạo tài khoản ADMIN đầu tiên cho hệ thống.
 * Vì route /api/auth/register yêu cầu phải đăng nhập bằng ADMIN mới tạo được
 * tài khoản mới, nên tài khoản ADMIN đầu tiên phải được tạo bằng cách này.
 *
 * Cách chạy (đứng ở thư mục backend):
 *   node src/seedAdmin.js
 *
 * Chạy xong nhớ đổi mật khẩu mặc định bên dưới!
 */
import bcrypt from "bcrypt";
import pool from "./config/db.js";

const TEN_DANG_NHAP = "admin";
const MAT_KHAU = "Admin@123"; // đổi mật khẩu này sau khi đăng nhập lần đầu
const EMAIL = "admin@qlns.local";

async function chayScript() {
    const [rows] = await pool.query(
        "SELECT id FROM tai_khoan WHERE ten_dang_nhap = ?",
        [TEN_DANG_NHAP]
    );

    if (rows.length > 0) {
        console.log("Tài khoản admin đã tồn tại rồi, không cần tạo lại.");
        process.exit(0);
    }

    const mat_khau_da_ma_hoa = await bcrypt.hash(MAT_KHAU, 10);

    await pool.query(
        "INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, email, role) VALUES (?, ?, ?, 'ADMIN')",
        [TEN_DANG_NHAP, mat_khau_da_ma_hoa, EMAIL]
    );

    console.log("Đã tạo tài khoản admin thành công!");
    console.log("Tên đăng nhập:", TEN_DANG_NHAP);
    console.log("Mật khẩu:", MAT_KHAU);
    process.exit(0);
}

chayScript().catch((err) => {
    console.error("Lỗi khi tạo tài khoản admin:", err);
    process.exit(1);
});

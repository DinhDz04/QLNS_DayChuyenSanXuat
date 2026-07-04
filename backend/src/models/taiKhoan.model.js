import pool from "../config/db.js";

/**
 * Model chỉ làm 1 việc: nói chuyện với database (bảng tai_khoan).
 * Không xử lý logic nghiệp vụ ở đây, việc đó để cho "service".
 */

// Tìm 1 tài khoản theo tên đăng nhập (dùng khi đăng nhập)
export async function timTheoTenDangNhap(ten_dang_nhap) {
    const [rows] = await pool.query(
        "SELECT * FROM tai_khoan WHERE ten_dang_nhap = ? LIMIT 1",
        [ten_dang_nhap]
    );
    return rows[0] || null;
}

// Tìm 1 tài khoản theo id (dùng để lấy thông tin "tôi là ai")
export async function timTheoId(id) {
    const [rows] = await pool.query(
        "SELECT id, ten_dang_nhap, email, role, trang_thai, created_at FROM tai_khoan WHERE id = ? LIMIT 1",
        [id]
    );
    return rows[0] || null;
}

// Tạo tài khoản mới, trả về id vừa tạo
export async function taoTaiKhoan({ ten_dang_nhap, mat_khau_da_ma_hoa, email, role }) {
    const [ketQua] = await pool.query(
        "INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, email, role) VALUES (?, ?, ?, ?)",
        [ten_dang_nhap, mat_khau_da_ma_hoa, email || null, role]
    );
    return ketQua.insertId;
}

// Lấy tất cả tài khoản
export async function layTatCaTaiKhoan() {
    const [rows] = await pool.query(
        "SELECT id, ten_dang_nhap, email, role, trang_thai, created_at FROM tai_khoan ORDER BY created_at DESC"
    );
    return rows;
}

// Cập nhật thông tin tài khoản
export async function capNhatTaiKhoan(id, { ten_dang_nhap, email, role, trang_thai, mat_khau_da_ma_hoa }) {
    let sql = "UPDATE tai_khoan SET ten_dang_nhap = ?, email = ?, role = ?, trang_thai = ?";
    const params = [ten_dang_nhap, email || null, role, trang_thai];

    if (mat_khau_da_ma_hoa) {
        sql += ", mat_khau = ?";
        params.push(mat_khau_da_ma_hoa);
    }

    sql += " WHERE id = ?";
    params.push(id);

    const [ketQua] = await pool.query(sql, params);
    return ketQua.affectedRows > 0;
}

// Hủy liên kết tài khoản ở bảng nhan_vien trước khi xóa
export async function huyLienKetNhanVien(tai_khoan_id) {
    await pool.query(
        "UPDATE nhan_vien SET tai_khoan_id = NULL WHERE tai_khoan_id = ?",
        [tai_khoan_id]
    );
}

// Xóa tài khoản
export async function xoaTaiKhoan(id) {
    const [ketQua] = await pool.query("DELETE FROM tai_khoan WHERE id = ?", [id]);
    return ketQua.affectedRows > 0;
}


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
        `SELECT t.id, t.ten_dang_nhap, t.email, t.role, t.trang_thai, t.created_at, 
                nv.ho_ten, nv.gioi_tinh, nv.so_dien_thoai, nv.ma_nhan_vien, nv.chuc_vu, nv.day_chuyen_id
         FROM tai_khoan t
         LEFT JOIN nhan_vien nv ON t.id = nv.tai_khoan_id
         WHERE t.id = ? LIMIT 1`,
        [id]
    );
    return rows[0] || null;
}

// Tạo tài khoản mới, trả về id vừa tạo
export async function taoTaiKhoan({ ten_dang_nhap, mat_khau_da_ma_hoa, email, role }) {
    const [ketQua] = await pool.query(
        "INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, email, role, trang_thai) VALUES (?, ?, ?, ?, 1)",
        [ten_dang_nhap, mat_khau_da_ma_hoa, email || null, role || "NHAN_VIEN"]
    );
    return ketQua.insertId;
}

// Lấy tất cả tài khoản
export async function layTatCaTaiKhoan() {
    const [rows] = await pool.query(
        `SELECT t.id, t.ten_dang_nhap, t.email, t.role, t.trang_thai, t.created_at,
                nv.ho_ten, nv.gioi_tinh, nv.so_dien_thoai, nv.ma_nhan_vien, nv.chuc_vu, nv.day_chuyen_id,
                dc.ten_day_chuyen
         FROM tai_khoan t
         LEFT JOIN nhan_vien nv ON t.id = nv.tai_khoan_id
         LEFT JOIN day_chuyen dc ON nv.day_chuyen_id = dc.id
         ORDER BY t.created_at DESC`
    );
    return rows;
}

// Cập nhật thông tin tài khoản
export async function capNhatTaiKhoan(id, { ten_dang_nhap, email, role, trang_thai, mat_khau_da_ma_hoa, ho_ten, so_dien_thoai, gioi_tinh, day_chuyen_id }) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Cập nhật bảng tai_khoan
        let sql = "UPDATE tai_khoan SET ten_dang_nhap = ?, email = ?, role = ?, trang_thai = ?";
        const params = [ten_dang_nhap, email || null, role, trang_thai];

        if (mat_khau_da_ma_hoa) {
            sql += ", mat_khau = ?";
            params.push(mat_khau_da_ma_hoa);
        }

        sql += " WHERE id = ?";
        params.push(id);

        const [ketQuaTaiKhoan] = await connection.query(sql, params);

        // 2. Cập nhật bảng nhan_vien (nếu đã có thì UPDATE, chưa có thì INSERT)
        const [existingNv] = await connection.query(
            "SELECT id FROM nhan_vien WHERE tai_khoan_id = ?",
            [id]
        );

        if (existingNv.length > 0) {
            await connection.query(
                `UPDATE nhan_vien 
                 SET ho_ten = ?, gioi_tinh = ?, so_dien_thoai = ?, chuc_vu = ?, day_chuyen_id = ?
                 WHERE tai_khoan_id = ?`,
                [ho_ten, gioi_tinh || "Khac", so_dien_thoai || null, role, day_chuyen_id || null, id]
            );
        } else {
            // Sinh mã nhân viên ngẫu nhiên hoặc tự tăng
            const [rows] = await connection.query(
                `SELECT ma_nhan_vien FROM nhan_vien WHERE ma_nhan_vien LIKE 'DP%' ORDER BY id DESC`
            );
            let soLonNhat = 0;
            for (const row of rows) {
                const soTrongMa = parseInt((row.ma_nhan_vien || "").replace("DP", ""), 10);
                if (!isNaN(soTrongMa) && soTrongMa > soLonNhat) soLonNhat = soTrongMa;
            }
            const maNhanVien = `DP${soLonNhat + 1}`;

            await connection.query(
                `INSERT INTO nhan_vien (ma_nhan_vien, ho_ten, gioi_tinh, so_dien_thoai, ngay_vao_lam, tai_khoan_id, chuc_vu, trang_thai, day_chuyen_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'DANG_LAM', ?)`,
                [maNhanVien, ho_ten || ten_dang_nhap, gioi_tinh || "Khac", so_dien_thoai || null, new Date(), id, role, day_chuyen_id || null]
            );
        }

        await connection.commit();
        return true;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
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


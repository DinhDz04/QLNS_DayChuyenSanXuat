import pool from "../config/db.js";

/**
 * Model quản lý dữ liệu nhân viên
 */

// Lấy danh sách nhân viên kèm thông tin tài khoản, dây chuyền
export async function layDanhSachNhanVien({ q, day_chuyen_id, trang_thai }) {
    let sql = `
        SELECT nv.*, dc.ten_day_chuyen, tk.ten_dang_nhap, tk.email
        FROM nhan_vien nv
        LEFT JOIN day_chuyen dc ON nv.day_chuyen_id = dc.id
        LEFT JOIN tai_khoan tk ON nv.tai_khoan_id = tk.id
        WHERE 1=1
    `;
    const params = [];

    if (q) {
        sql += " AND (nv.ho_ten LIKE ? OR nv.ma_nhan_vien LIKE ? OR nv.so_dien_thoai LIKE ?)";
        const likeQ = `%${q}%`;
        params.push(likeQ, likeQ, likeQ);
    }

    if (day_chuyen_id) {
        sql += " AND nv.day_chuyen_id = ?";
        params.push(day_chuyen_id);
    }

    if (trang_thai) {
        sql += " AND nv.trang_thai = ?";
        params.push(trang_thai);
    }

    sql += " ORDER BY nv.id DESC";
    const [rows] = await pool.query(sql, params);
    return rows;
}

// Lấy chứng chỉ của 1 nhân viên
export async function layChungChiNhanVien(nhanVienId) {
    const [rows] = await pool.query(
        `SELECT ccnv.id, cc.ten_chung_chi, cc.mo_ta AS mo_ta_chung_chi, 
                ccnv.cap_do, ccnv.ngay_cap, ccnv.ngay_het_han, ccnv.trang_thai
         FROM chung_chi_nhan_vien ccnv
         JOIN chung_chi cc ON ccnv.chung_chi_id = cc.id
         WHERE ccnv.nhan_vien_id = ?`,
        [nhanVienId]
    );
    return rows;
}

// Cập nhật thông tin nhân viên
export async function capNhatNhanVien(id, { ho_ten, gioi_tinh, so_dien_thoai, day_chuyen_id, chuc_vu, trang_thai }) {
    const [result] = await pool.query(
        `UPDATE nhan_vien 
         SET ho_ten = ?, gioi_tinh = ?, so_dien_thoai = ?, day_chuyen_id = ?, chuc_vu = ?, trang_thai = ?
         WHERE id = ?`,
        [ho_ten, gioi_tinh, so_dien_thoai || null, day_chuyen_id || null, chuc_vu, trang_thai, id]
    );
    return result.affectedRows > 0;
}

// Xóa nhân viên khỏi hệ thống (hoặc đổi trạng thái nghỉ việc)
export async function xoaNhanVien(id) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Lấy thông tin tài khoản liên kết để xóa
        const [nv] = await connection.query("SELECT tai_khoan_id FROM nhan_vien WHERE id = ?", [id]);
        if (nv.length > 0 && nv[0].tai_khoan_id) {
            const tkId = nv[0].tai_khoan_id;
            // Gỡ liên kết trước
            await connection.query("UPDATE nhan_vien SET tai_khoan_id = NULL WHERE id = ?", [id]);
            // Xóa tài khoản
            await connection.query("DELETE FROM tai_khoan WHERE id = ?", [tkId]);
        }

        // 2. Gỡ khỏi các bảng phân công, tăng ca, chứng chỉ liên quan
        await connection.query("DELETE FROM phan_cong_nhan_su WHERE nhan_vien_id = ?", [id]);
        await connection.query("DELETE FROM dang_ky_tang_ca WHERE nhan_vien_id = ?", [id]);
        await connection.query("DELETE FROM chung_chi_nhan_vien WHERE nhan_vien_id = ?", [id]);
        await connection.query("DELETE FROM lich_su_dieu_dong WHERE nhan_vien_id = ?", [id]);
        await connection.query("DELETE FROM thong_bao WHERE nguoi_nhan_id = ?", [id]);

        // 3. Xóa nhân viên
        const [result] = await connection.query("DELETE FROM nhan_vien WHERE id = ?", [id]);

        await connection.commit();
        return result.affectedRows > 0;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

import pool from "../config/db.js";

/**
 * Model quản lý dữ liệu tài khoản
 */
class TaiKhoanModel {
    static async timTheoTenDangNhap(ten_dang_nhap) {
        const [rows] = await pool.query(
            "SELECT * FROM tai_khoan WHERE ten_dang_nhap = ? LIMIT 1",
            [ten_dang_nhap]
        );
        return rows[0] || null;
    }

    static async timTheoId(id) {
        const [rows] = await pool.query(
            `SELECT t.id, t.ten_dang_nhap, t.email, t.role, t.trang_thai, t.created_at, 
                    nv.ho_ten, nv.gioi_tinh, nv.so_dien_thoai, nv.ma_nhan_vien, nv.chuc_vu, nv.day_chuyen_id, nv.ca_lam_id, nv.dia_chi, nv.ngay_sinh, nv.co_xoay_ca
             FROM tai_khoan t
             LEFT JOIN nhan_vien nv ON t.id = nv.tai_khoan_id
             WHERE t.id = ? LIMIT 1`,
            [id]
        );
        return rows[0] || null;
    }

    static async taoTaiKhoan({ ten_dang_nhap, mat_khau_da_ma_hoa, email, role }) {
        const [ketQua] = await pool.query(
            "INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, email, role, trang_thai) VALUES (?, ?, ?, ?, 1)",
            [ten_dang_nhap, mat_khau_da_ma_hoa, email || null, role || "NHAN_VIEN"]
        );
        return ketQua.insertId;
    }

    static async layTatCaTaiKhoan() {
        const [rows] = await pool.query(
            `SELECT t.id, t.ten_dang_nhap, t.email, t.role, t.trang_thai, t.created_at,
                    nv.id AS nhan_vien_id, nv.ho_ten, nv.gioi_tinh, nv.so_dien_thoai, nv.ma_nhan_vien, nv.chuc_vu, nv.day_chuyen_id, nv.ca_lam_id, nv.dia_chi, nv.ngay_sinh, nv.co_xoay_ca,
                    dc.ten_day_chuyen, cl.ten_ca AS ten_ca_lam
             FROM tai_khoan t
             LEFT JOIN nhan_vien nv ON t.id = nv.tai_khoan_id
             LEFT JOIN day_chuyen dc ON nv.day_chuyen_id = dc.id
             LEFT JOIN ca_lam_viec cl ON nv.ca_lam_id = cl.id
             ORDER BY t.created_at DESC`
        );
        return rows;
    }

    static async capNhatTaiKhoan(id, { ten_dang_nhap, email, role, trang_thai, mat_khau_da_ma_hoa, ho_ten, so_dien_thoai, gioi_tinh, day_chuyen_id, ca_lam_id, dia_chi, ngay_sinh, co_xoay_ca }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Lấy thông tin role và password cũ để ghi nhận thay đổi
            const [oldTkRows] = await connection.query(
                "SELECT role, ten_dang_nhap FROM tai_khoan WHERE id = ?",
                [id]
            );
            const oldRole = oldTkRows[0]?.role;

            let sql = "UPDATE tai_khoan SET ten_dang_nhap = ?, email = ?, role = ?, trang_thai = ?";
            const params = [ten_dang_nhap, email || null, role, trang_thai];

            if (mat_khau_da_ma_hoa) {
                sql += ", mat_khau = ?";
                params.push(mat_khau_da_ma_hoa);
            }

            sql += " WHERE id = ?";
            params.push(id);

            await connection.query(sql, params);

            const [existingNv] = await connection.query(
                "SELECT id, day_chuyen_id, ca_lam_id FROM nhan_vien WHERE tai_khoan_id = ?",
                [id]
            );

            if (existingNv.length > 0) {
                const nvId = existingNv[0].id;
                const oldDayChuyenId = existingNv[0].day_chuyen_id;
                const newDayChuyenId = day_chuyen_id ? Number(day_chuyen_id) : null;
                const oldCaLamId = existingNv[0].ca_lam_id;
                const newCaLamId = ca_lam_id ? Number(ca_lam_id) : null;

                await connection.query(
                    `UPDATE nhan_vien 
                     SET ho_ten = ?, gioi_tinh = ?, so_dien_thoai = ?, chuc_vu = ?, day_chuyen_id = ?, ca_lam_id = ?, dia_chi = ?, ngay_sinh = ?, co_xoay_ca = ?
                     WHERE tai_khoan_id = ?`,
                    [ho_ten, gioi_tinh || "Khac", so_dien_thoai || null, role, day_chuyen_id || null, ca_lam_id || null, dia_chi || null, ngay_sinh || null, co_xoay_ca !== undefined ? Number(co_xoay_ca) : 1, id]
                );

                // Ghi nhận lịch sử nếu dây chuyền thay đổi
                if (oldDayChuyenId !== newDayChuyenId) {
                    await connection.query(
                        `INSERT INTO lich_su_dieu_dong (nhan_vien_id, tu_day_chuyen_id, den_day_chuyen_id, ly_do, loai_thay_doi)
                         VALUES (?, ?, ?, ?, 'DAY_CHUYEN')`,
                        [nvId, oldDayChuyenId, newDayChuyenId, 'Thay đổi dây chuyền cố định (Admin)']
                    );
                }

                // Ghi nhận lịch sử nếu ca làm thay đổi
                if (oldCaLamId !== newCaLamId) {
                    let tenCaCu = "Chưa gán";
                    let tenCaMoi = "Chưa gán";
                    
                    if (oldCaLamId) {
                        const [rowsCu] = await connection.query("SELECT ten_ca FROM ca_lam_viec WHERE id = ?", [oldCaLamId]);
                        if (rowsCu.length > 0) tenCaCu = rowsCu[0].ten_ca;
                    }
                    if (newCaLamId) {
                        const [rowsMoi] = await connection.query("SELECT ten_ca FROM ca_lam_viec WHERE id = ?", [newCaLamId]);
                        if (rowsMoi.length > 0) tenCaMoi = rowsMoi[0].ten_ca;
                    }

                    await connection.query(
                        `INSERT INTO lich_su_dieu_dong (nhan_vien_id, ly_do, loai_thay_doi)
                         VALUES (?, ?, 'CA_LAM')`,
                        [nvId, `Thay đổi ca làm cố định từ [${tenCaCu}] sang [${tenCaMoi}] (Admin)`]
                    );
                }

                // Ghi nhận lịch sử nếu Mật khẩu thay đổi
                if (mat_khau_da_ma_hoa) {
                    await connection.query(
                        `INSERT INTO lich_su_dieu_dong (nhan_vien_id, ly_do, loai_thay_doi)
                         VALUES (?, 'Thay đổi mật khẩu tài khoản (Admin)', 'MAT_KHAU')`,
                        [nvId]
                    );
                }

                // Ghi nhận lịch sử nếu Vai trò thay đổi
                if (oldRole !== role) {
                    await connection.query(
                        `INSERT INTO lich_su_dieu_dong (nhan_vien_id, ly_do, loai_thay_doi)
                         VALUES (?, ?, 'VAI_TRO')`,
                        [nvId, `Thay đổi vai trò từ [${oldRole}] sang [${role}] (Admin)`]
                    );
                }
            } else {
                // Tự tăng mã nhân viên dạng DP_01, DP_02...
                const [rows] = await connection.query(
                    `SELECT ma_nhan_vien FROM nhan_vien WHERE ma_nhan_vien LIKE 'DP_%' ORDER BY id DESC`
                );
                let soLonNhat = 0;
                for (const row of rows) {
                    const soTrongMa = parseInt((row.ma_nhan_vien || "").replace("DP_", ""), 10);
                    if (!isNaN(soTrongMa) && soTrongMa > soLonNhat) soLonNhat = soTrongMa;
                }
                const soTiepTheo = soLonNhat + 1;
                const maNhanVien = `DP_${soTiepTheo < 10 ? '0' + soTiepTheo : soTiepTheo}`;

                // Nếu username là tạm thời thì đổi sang maNhanVien
                if (ten_dang_nhap.startsWith("temp_user_") || ten_dang_nhap === "") {
                    await connection.query(
                        "UPDATE tai_khoan SET ten_dang_nhap = ? WHERE id = ?",
                        [maNhanVien, id]
                    );
                }

                await connection.query(
                    `INSERT INTO nhan_vien (ma_nhan_vien, ho_ten, gioi_tinh, so_dien_thoai, ngay_vao_lam, tai_khoan_id, chuc_vu, trang_thai, day_chuyen_id, ca_lam_id, dia_chi, ngay_sinh, co_xoay_ca) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'DANG_LAM', ?, ?, ?, ?, ?)`,
                    [
                        maNhanVien,
                        ho_ten || ten_dang_nhap,
                        gioi_tinh || "Khac",
                        so_dien_thoai || null,
                        new Date(),
                        id,
                        role,
                        day_chuyen_id || null,
                        ca_lam_id || null,
                        dia_chi || null,
                        ngay_sinh || null,
                        co_xoay_ca !== undefined ? Number(co_xoay_ca) : 1
                    ]
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

    static async huyLienKetNhanVien(tai_khoan_id) {
        await pool.query(
            "UPDATE nhan_vien SET tai_khoan_id = NULL WHERE tai_khoan_id = ?",
            [tai_khoan_id]
        );
    }

    static async xoaTaiKhoan(id) {
        const [ketQua] = await pool.query("DELETE FROM tai_khoan WHERE id = ?", [id]);
        return ketQua.affectedRows > 0;
    }
}

export default TaiKhoanModel;

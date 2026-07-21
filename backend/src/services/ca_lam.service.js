import pool from "../config/db.js";
import ApiError from "../utils/api_error.js";

class CaLamService {
    // ================= CA LÀM VIỆC SERVICES =================
    static async layDanhSachCaLam() {
        const [rows] = await pool.query(
            `SELECT c.*, l.ten_lich 
             FROM ca_lam_viec c 
             LEFT JOIN lich_lam l ON c.lich_lam_id = l.id 
             ORDER BY c.ten_ca ASC`
        );
        return rows;
    }

    static async layCaLamTheoId(id) {
        const [rows] = await pool.query("SELECT * FROM ca_lam_viec WHERE id = ? LIMIT 1", [id]);
        return rows[0] || null;
    }

    static async taoCaLam({ ten_ca, gio_bat_dau, gio_ket_thuc, loai_ca, lich_lam_id }) {
        if (!ten_ca || !gio_bat_dau || !gio_ket_thuc) {
            throw new ApiError(400, "Thiếu thông tin bắt buộc cho ca làm việc");
        }

        const [kq] = await pool.query(
            "INSERT INTO ca_lam_viec (ten_ca, gio_bat_dau, gio_ket_thuc, loai_ca, lich_lam_id) VALUES (?, ?, ?, ?, ?)",
            [ten_ca, gio_bat_dau, gio_ket_thuc, loai_ca || "THUONG", lich_lam_id ? Number(lich_lam_id) : null]
        );

        return { id: kq.insertId, ten_ca, gio_bat_dau, gio_ket_thuc, loai_ca, lich_lam_id };
    }

    static async capNhatCaLam(id, { ten_ca, gio_bat_dau, gio_ket_thuc, loai_ca, lich_lam_id }) {
        if (!ten_ca || !gio_bat_dau || !gio_ket_thuc) {
            throw new ApiError(400, "Thiếu thông tin bắt buộc");
        }

        const [existing] = await pool.query("SELECT id FROM ca_lam_viec WHERE id = ? LIMIT 1", [id]);
        if (existing.length === 0) {
            throw new ApiError(404, "Không tìm thấy ca làm việc");
        }

        await pool.query(
            "UPDATE ca_lam_viec SET ten_ca = ?, gio_bat_dau = ?, gio_ket_thuc = ?, loai_ca = ?, lich_lam_id = ? WHERE id = ?",
            [ten_ca, gio_bat_dau, gio_ket_thuc, loai_ca || "THUONG", lich_lam_id ? Number(lich_lam_id) : null, id]
        );

        return { id, ten_ca, gio_bat_dau, gio_ket_thuc, loai_ca, lich_lam_id };
    }

    static async xoaCaLam(id) {
        const [existing] = await pool.query("SELECT id FROM ca_lam_viec WHERE id = ? LIMIT 1", [id]);
        if (existing.length === 0) {
            throw new ApiError(404, "Không tìm thấy ca làm việc");
        }

        // Gỡ ca làm khỏi nhân viên trước khi xóa
        await pool.query("UPDATE nhan_vien SET ca_lam_id = NULL WHERE ca_lam_id = ?", [id]);

        await pool.query("DELETE FROM ca_lam_viec WHERE id = ?", [id]);
        return { success: true };
    }

    // ================= LỊCH LÀM VIỆC SERVICES =================
    static async layDanhSachLichLam() {
        const [rows] = await pool.query(`
            SELECT *, 
                   CASE 
                     WHEN chu_ky_tuan > 0 AND DATEDIFF(CURRENT_DATE(), ngay_xoay_gan_nhat) >= (chu_ky_tuan * 7) THEN 1
                     ELSE 0
                   END AS can_xoay_ca
            FROM lich_lam 
            ORDER BY ten_lich ASC
        `);

        // Với mỗi lịch làm, lấy danh sách ca làm liên kết
        for (const row of rows) {
            const [caRows] = await pool.query(
                "SELECT id, ten_ca, gio_bat_dau, gio_ket_thuc FROM ca_lam_viec WHERE lich_lam_id = ?",
                [row.id]
            );
            row.ca_lam_list = caRows;
        }

        return rows;
    }

    static async taoLichLam({ ten_lich, chu_ky_tuan, ngay_bat_dau, ngay_ket_thuc, mo_ta, ca_lam_ids }) {
        if (!ten_lich) {
            throw new ApiError(400, "Tên lịch làm việc không được để trống");
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const today = new Date().toISOString().slice(0, 10);
            const [kq] = await connection.query(
                "INSERT INTO lich_lam (ten_lich, chu_ky_tuan, ngay_xoay_gan_nhat, mo_ta, ngay_bat_dau, ngay_ket_thuc) VALUES (?, ?, ?, ?, ?, ?)",
                [ten_lich, chu_ky_tuan || 0, today, mo_ta || null, ngay_bat_dau || null, ngay_ket_thuc || null]
            );
            const lichId = kq.insertId;

            // Liên kết các ca làm việc được chọn
            if (Array.isArray(ca_lam_ids) && ca_lam_ids.length > 0) {
                await connection.query(
                    "UPDATE ca_lam_viec SET lich_lam_id = ? WHERE id IN (?)",
                    [lichId, ca_lam_ids]
                );
            }

            await connection.commit();
            return { id: lichId, ten_lich, chu_ky_tuan, ngay_bat_dau, ngay_ket_thuc, mo_ta };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    static async capNhatLichLam(id, { ten_lich, chu_ky_tuan, ngay_bat_dau, ngay_ket_thuc, mo_ta, ca_lam_ids }) {
        if (!ten_lich) {
            throw new ApiError(400, "Tên lịch làm việc không được để trống");
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query(
                "UPDATE lich_lam SET ten_lich = ?, chu_ky_tuan = ?, mo_ta = ?, ngay_bat_dau = ?, ngay_ket_thuc = ? WHERE id = ?",
                [ten_lich, chu_ky_tuan || 0, mo_ta || null, ngay_bat_dau || null, ngay_ket_thuc || null, id]
            );

            // Gỡ các ca làm cũ thuộc lịch này
            await connection.query(
                "UPDATE ca_lam_viec SET lich_lam_id = NULL WHERE lich_lam_id = ?",
                [id]
            );

            // Liên kết các ca làm mới được chọn
            if (Array.isArray(ca_lam_ids) && ca_lam_ids.length > 0) {
                await connection.query(
                    "UPDATE ca_lam_viec SET lich_lam_id = ? WHERE id IN (?)",
                    [id, ca_lam_ids]
                );
            }

            await connection.commit();
            return { id, ten_lich, chu_ky_tuan, ngay_bat_dau, ngay_ket_thuc, mo_ta };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    static async xoaLichLam(id) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Gỡ ca làm khỏi lịch này trước khi xóa
            await connection.query(
                "UPDATE ca_lam_viec SET lich_lam_id = NULL WHERE lich_lam_id = ?",
                [id]
            );

            await connection.query("DELETE FROM lich_lam WHERE id = ?", [id]);

            await connection.commit();
            return { success: true };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    static async xoayCaLichLam(id) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Lấy danh sách ca làm thuộc lịch này
            const [caLamRows] = await connection.query(
                "SELECT id, ten_ca FROM ca_lam_viec WHERE lich_lam_id = ? ORDER BY id ASC",
                [id]
            );

            if (caLamRows.length < 2) {
                throw new ApiError(400, "Lịch làm việc cần ít nhất 2 ca làm để thực hiện xoay ca!");
            }

            const count = caLamRows.length;
            
            // Lấy danh sách nhân viên của từng ca để ghi log lịch sử (chỉ những người tham gia xoay ca)
            const caNvMap = {};
            for (const ca of caLamRows) {
                const [nvRows] = await connection.query(
                    "SELECT id, ho_ten FROM nhan_vien WHERE ca_lam_id = ? AND co_xoay_ca = 1",
                    [ca.id]
                );
                caNvMap[ca.id] = nvRows;
            }

            // Thực hiện xoay ca xoay vòng (ca0 -> ca1 -> ca2 ... -> ca0) cho các nhân viên tham gia xoay ca
            const caDau = caLamRows[0];
            await connection.query(
                "UPDATE nhan_vien SET ca_lam_id = -999 WHERE ca_lam_id = ? AND co_xoay_ca = 1",
                [caDau.id]
            );

            for (let i = 1; i < count; i++) {
                const caHienTai = caLamRows[i];
                const caTruoc = caLamRows[i - 1];
                await connection.query(
                    "UPDATE nhan_vien SET ca_lam_id = ? WHERE ca_lam_id = ? AND co_xoay_ca = 1",
                    [caTruoc.id, caHienTai.id]
                );
            }

            const caCuoi = caLamRows[count - 1];
            await connection.query(
                "UPDATE nhan_vien SET ca_lam_id = ? WHERE ca_lam_id = -999 AND co_xoay_ca = 1",
                [caCuoi.id]
            );

            // Ghi logs lịch sử điều động cho từng nhân viên bị đổi ca
            for (let i = 0; i < count; i++) {
                const caGoc = caLamRows[i];
                const caMoi = caLamRows[i === 0 ? count - 1 : i - 1];
                const listNv = caNvMap[caGoc.id] || [];

                for (const nv of listNv) {
                    await connection.query(
                        `INSERT INTO lich_su_dieu_dong (nhan_vien_id, ly_do, loai_thay_doi)
                         VALUES (?, ?, 'CA_LAM')`,
                        [nv.id, `Xoay ca định kỳ: từ [${caGoc.ten_ca}] sang [${caMoi.ten_ca}] (Hệ thống)`, 'CA_LAM']
                    );
                }
            }

            // Cập nhật ngày xoay ca gần nhất về hôm nay
            await connection.query(
                "UPDATE lich_lam SET ngay_xoay_gan_nhat = CURRENT_DATE() WHERE id = ?",
                [id]
            );

            await connection.commit();
            return { success: true, message: `Xoay ca làm việc thành công cho tất cả nhân sự thuộc lịch này!` };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }
}

export default CaLamService;

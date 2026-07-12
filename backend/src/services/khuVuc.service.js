import pool from "../config/db.js";

/**
 * Lấy tất cả khu vực kèm thông tin khách hàng và leader phụ trách
 */
export async function layDanhSachKhuVuc() {
    const [rows] = await pool.query(
        `SELECT kv.id, kv.ten_khu_vuc, kv.khach_hang_id, kv.leader_id,
                kh.ten_khach_hang,
                nv.ho_ten AS ten_leader, nv.ma_nhan_vien AS ma_leader
         FROM khu_vuc kv
         LEFT JOIN khach_hang kh ON kv.khach_hang_id = kh.id
         LEFT JOIN nhan_vien nv ON kv.leader_id = nv.id
         ORDER BY kv.id DESC`
    );
    return rows;
}

/**
 * Tìm khu vực theo ID
 */
export async function timKhuVucTheoId(id) {
    const [rows] = await pool.query(
        `SELECT kv.id, kv.ten_khu_vuc, kv.khach_hang_id, kv.leader_id,
                kh.ten_khach_hang,
                nv.ho_ten AS ten_leader, nv.ma_nhan_vien AS ma_leader
         FROM khu_vuc kv
         LEFT JOIN khach_hang kh ON kv.khach_hang_id = kh.id
         LEFT JOIN nhan_vien nv ON kv.leader_id = nv.id
         WHERE kv.id = ? LIMIT 1`,
        [id]
    );
    return rows[0] || null;
}

/**
 * Tạo khu vực mới
 */
export async function taoKhuVuc({ ten_khu_vuc, khach_hang_id, leader_id }) {
    if (!ten_khu_vuc || !khach_hang_id) {
        const loi = new Error("Tên khu vực và Khách hàng không được để trống");
        loi.statusCode = 400;
        throw loi;
    }

    const [ketQua] = await pool.query(
        "INSERT INTO khu_vuc (ten_khu_vuc, khach_hang_id, leader_id) VALUES (?, ?, ?)",
        [ten_khu_vuc, khach_hang_id, leader_id || null]
    );

    return { id: ketQua.insertId, ten_khu_vuc, khach_hang_id, leader_id };
}

/**
 * Cập nhật khu vực
 */
export async function capNhatKhuVuc(id, { ten_khu_vuc, khach_hang_id, leader_id }) {
    if (!ten_khu_vuc || !khach_hang_id) {
        const loi = new Error("Tên khu vực và Khách hàng không được để trống");
        loi.statusCode = 400;
        throw loi;
    }

    const khuVuc = await timKhuVucTheoId(id);
    if (!khuVuc) {
        const loi = new Error("Không tìm thấy khu vực");
        loi.statusCode = 404;
        throw loi;
    }

    await pool.query(
        "UPDATE khu_vuc SET ten_khu_vuc = ?, khach_hang_id = ?, leader_id = ? WHERE id = ?",
        [ten_khu_vuc, khach_hang_id, leader_id || null, id]
    );

    return { id, ten_khu_vuc, khach_hang_id, leader_id };
}

/**
 * Xóa khu vực
 */
export async function xoaKhuVuc(id) {
    const khuVuc = await timKhuVucTheoId(id);
    if (!khuVuc) {
        const loi = new Error("Không tìm thấy khu vực");
        loi.statusCode = 404;
        throw loi;
    }

    // Kiểm tra xem có dây chuyền nào đang thuộc khu vực này không
    const [dayChuyen] = await pool.query("SELECT id FROM day_chuyen WHERE khu_vuc_id = ? LIMIT 1", [id]);
    if (dayChuyen.length > 0) {
        const loi = new Error("Không thể xóa khu vực đang chứa dây chuyền hoạt động");
        loi.statusCode = 400;
        throw loi;
    }

    const [ketQua] = await pool.query("DELETE FROM khu_vuc WHERE id = ?", [id]);
    return ketQua.affectedRows > 0;
}

/**
 * Lấy danh sách nhân viên có chức vụ LEADER_KHU_VUC để gán làm trưởng khu vực
 */
export async function layDanhSachLeaderKhuVuc() {
    const [rows] = await pool.query(
        `SELECT id, ho_ten, ma_nhan_vien 
         FROM nhan_vien 
         WHERE chuc_vu = 'LEADER_KHU_VUC' AND trang_thai = 'DANG_LAM'`
    );
    return rows;
}

/**
 * Lấy danh sách khách hàng để chọn ở dropdown
 */
export async function layDanhSachKhachHang() {
    const [rows] = await pool.query("SELECT id, ten_khach_hang, mo_ta FROM khach_hang ORDER BY ten_khach_hang ASC");
    return rows;
}

/**
 * Lấy cấu hình bản đồ khu vực (danh sách dây chuyền và vị trí tọa độ các công đoạn)
 */
export async function layBanDoKhuVuc(khuVucId) {
    const khuVuc = await timKhuVucTheoId(khuVucId);
    if (!khuVuc) {
        const loi = new Error("Không tìm thấy khu vực");
        loi.statusCode = 404;
        throw loi;
    }

    const [dayChuyenRows] = await pool.query(
        `SELECT id, ten_day_chuyen, trang_thai FROM day_chuyen WHERE khu_vuc_id = ?`,
        [khuVucId]
    );

    const [congDoanRows] = await pool.query(
        `SELECT cd.id AS cong_doan_id, cd.ten_cong_doan, cd.vi_tri_x, cd.vi_tri_y, cd.xoay,
                yc.day_chuyen_id, yc.so_luong_can,
                dc.ten_day_chuyen,
                (SELECT COUNT(*) FROM phan_cong_nhan_su WHERE cong_doan_id = cd.id AND ngay = CURDATE()) AS so_luong_da_gan,
                (SELECT GROUP_CONCAT(nv.ho_ten ORDER BY nv.ho_ten ASC SEPARATOR ', ')
                 FROM phan_cong_nhan_su pc
                 JOIN nhan_vien nv ON pc.nhan_vien_id = nv.id
                 WHERE pc.cong_doan_id = cd.id AND pc.ngay = CURDATE()) AS danh_sach_nv
         FROM cong_doan cd
         JOIN yeu_cau_nhan_su yc ON cd.id = yc.cong_doan_id
         JOIN day_chuyen dc ON yc.day_chuyen_id = dc.id
         WHERE dc.khu_vuc_id = ?`,
        [khuVucId]
    );

    return {
        khu_vuc: khuVuc,
        day_chuyen: dayChuyenRows,
        cong_doan: congDoanRows
    };
}

/**
 * Lưu tọa độ và hướng xoay các công đoạn trên bản đồ khu vực
 */
export async function luuBanDoKhuVuc(khuVucId, { cong_doan_positions }) {
    if (!Array.isArray(cong_doan_positions)) {
        const loi = new Error("Dữ liệu vị trí công đoạn không hợp lệ");
        loi.statusCode = 400;
        throw loi;
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (const pos of cong_doan_positions) {
            const x = pos.vi_tri_x !== undefined && pos.vi_tri_x !== null ? Number(pos.vi_tri_x) : null;
            const y = pos.vi_tri_y !== undefined && pos.vi_tri_y !== null ? Number(pos.vi_tri_y) : null;
            const xoay = pos.xoay !== undefined && pos.xoay !== null ? Number(pos.xoay) : 0;
            const cdId = Number(pos.cong_doan_id);

            await connection.query(
                `UPDATE cong_doan SET vi_tri_x = ?, vi_tri_y = ?, xoay = ? WHERE id = ?`,
                [x, y, xoay, cdId]
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

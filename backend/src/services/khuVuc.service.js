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

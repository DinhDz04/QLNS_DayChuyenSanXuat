import pool from "../config/db.js";

/**
 * Lấy danh sách toàn bộ dây chuyền sản xuất có phân quyền lọc theo role
 */
export async function layDanhSachDayChuyen(nguoiDung) {
    let query = `
        SELECT dc.id, dc.ten_day_chuyen, dc.khu_vuc_id, dc.leader_id, dc.trang_thai,
               kv.ten_khu_vuc,
               nv.ho_ten AS ten_leader, nv.ma_nhan_vien AS ma_leader
        FROM day_chuyen dc
        LEFT JOIN khu_vuc kv ON dc.khu_vuc_id = kv.id
        LEFT JOIN nhan_vien nv ON dc.leader_id = nv.id
    `;
    const params = [];

    if (nguoiDung) {
        if (nguoiDung.role === "LEADER_LINE") {
            const [nvRows] = await pool.query("SELECT id FROM nhan_vien WHERE tai_khoan_id = ?", [nguoiDung.id]);
            if (nvRows.length > 0) {
                query += " WHERE dc.leader_id = ?";
                params.push(nvRows[0].id);
            } else {
                return []; // Không tìm thấy hồ sơ nhân viên liên kết
            }
        } else if (nguoiDung.role === "LEADER_KHU_VUC") {
            const [nvRows] = await pool.query("SELECT id FROM nhan_vien WHERE tai_khoan_id = ?", [nguoiDung.id]);
            if (nvRows.length > 0) {
                const nvId = nvRows[0].id;
                const [kvRows] = await pool.query("SELECT id FROM khu_vuc WHERE leader_id = ?", [nvId]);
                if (kvRows.length > 0) {
                    const kvIds = kvRows.map(k => k.id);
                    query += " WHERE dc.khu_vuc_id IN (?)";
                    params.push(kvIds);
                } else {
                    return []; // Leader khu vực chưa phụ trách khu vực nào
                }
            } else {
                return [];
            }
        }
    }

    query += " ORDER BY dc.id DESC";
    const [rows] = await pool.query(query, params);
    return rows;
}

/**
 * Tìm thông tin dây chuyền theo ID
 */
export async function timDayChuyenTheoId(id) {
    const [rows] = await pool.query(
        `SELECT dc.id, dc.ten_day_chuyen, dc.khu_vuc_id, dc.leader_id, dc.trang_thai,
                kv.ten_khu_vuc,
                nv.ho_ten AS ten_leader, nv.ma_nhan_vien AS ma_leader
         FROM day_chuyen dc
         LEFT JOIN khu_vuc kv ON dc.khu_vuc_id = kv.id
         LEFT JOIN nhan_vien nv ON dc.leader_id = nv.id
         WHERE dc.id = ? LIMIT 1`,
        [id]
    );
    return rows[0] || null;
}

function chuanHoaTenBoPhan(loai) {
    const map = {
        "lap rap": "Lắp ráp",
        "lắp ráp": "Lắp ráp",
        "cam tay": "Cắm tay",
        "cắm tay": "Cắm tay",
        "van hanh may": "Vận hành máy",
        "vận hành máy": "Vận hành máy",
        "may han": "Máy hàn",
        "máy hàn": "Máy hàn",
        "sau may han": "Sau máy hàn",
        "sau máy hàn": "Sau máy hàn",
        "van hanh aoi": "Vận hành AOI",
        "vận hành aoi": "Vận hành AOI",
        "qc": "QC"
    };
    return map[loai.toLowerCase().trim()] || loai;
}

function layTenChungChiTuCongDoan(tenCongDoan) {
    // Loại bỏ số thứ tự ở cuối tên công đoạn, ví dụ: "Lắp ráp 1" -> "Lắp ráp"
    return tenCongDoan.replace(/\s+\d+$/, "").trim();
}

/**
 * Tạo dây chuyền mới kèm theo cấu hình các bộ phận
 */
export async function taoDayChuyen({ ten_day_chuyen, khu_vuc_id, leader_id, trang_thai, bo_phan }) {
    if (!ten_day_chuyen || !khu_vuc_id) {
        const loi = new Error("Tên dây chuyền và Khu vực không được để trống");
        loi.statusCode = 400;
        throw loi;
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Thêm dây chuyền vào bảng day_chuyen
        const [kqDayChuyen] = await connection.query(
            "INSERT INTO day_chuyen (ten_day_chuyen, khu_vuc_id, leader_id, trang_thai) VALUES (?, ?, ?, ?)",
            [ten_day_chuyen, khu_vuc_id, leader_id || null, trang_thai || "HOAT_DONG"]
        );
        const dayChuyenId = kqDayChuyen.insertId;

        // 2. Thêm các bộ phận (nếu có gửi lên)
        if (bo_phan && Array.isArray(bo_phan) && bo_phan.length > 0) {
            // Bộ đếm thứ tự tăng dần cho từng loại bộ phận trong dây chuyền này
            const demBoPhan = {};

            for (const bp of bo_phan) {
                const loaiChuan = chuanHoaTenBoPhan(bp.loai_bo_phan);
                
                // Tăng thứ tự
                if (!demBoPhan[loaiChuan]) {
                    demBoPhan[loaiChuan] = 1;
                } else {
                    demBoPhan[loaiChuan]++;
                }

                const tenBoPhanMoi = `${loaiChuan} ${demBoPhan[loaiChuan]}`;
                const soLuongCan = Number(bp.so_luong_can) || 1;

                // A. Thêm vào bảng cong_doan
                const [kqCongDoan] = await connection.query(
                    "INSERT INTO cong_doan (ten_cong_doan, mo_ta) VALUES (?, ?)",
                    [tenBoPhanMoi, `Bộ phận ${tenBoPhanMoi} thuộc dây chuyền ${ten_day_chuyen}`]
                );
                const congDoanId = kqCongDoan.insertId;

                // B. Thêm vào bảng yeu_cau_nhan_su
                await connection.query(
                    "INSERT INTO yeu_cau_nhan_su (day_chuyen_id, cong_doan_id, so_luong_can) VALUES (?, ?, ?)",
                    [dayChuyenId, congDoanId, soLuongCan]
                );
            }
        }

        await connection.commit();
        return { id: dayChuyenId, ten_day_chuyen, khu_vuc_id, leader_id, trang_thai };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

/**
 * Cập nhật dây chuyền
 */
export async function capNhatDayChuyen(id, { ten_day_chuyen, khu_vuc_id, leader_id, trang_thai }) {
    if (!ten_day_chuyen || !khu_vuc_id) {
        const loi = new Error("Tên dây chuyền và Khu vực không được để trống");
        loi.statusCode = 400;
        throw loi;
    }

    const dayChuyen = await timDayChuyenTheoId(id);
    if (!dayChuyen) {
        const loi = new Error("Không tìm thấy dây chuyền");
        loi.statusCode = 404;
        throw loi;
    }

    await pool.query(
        "UPDATE day_chuyen SET ten_day_chuyen = ?, khu_vuc_id = ?, leader_id = ?, trang_thai = ? WHERE id = ?",
        [ten_day_chuyen, khu_vuc_id, leader_id || null, trang_thai || "HOAT_DONG", id]
    );

    return { id, ten_day_chuyen, khu_vuc_id, leader_id, trang_thai };
}

/**
 * Xóa dây chuyền
 */
export async function xoaDayChuyen(id) {
    const dayChuyen = await timDayChuyenTheoId(id);
    if (!dayChuyen) {
        const loi = new Error("Không tìm thấy dây chuyền");
        loi.statusCode = 404;
        throw loi;
    }

    // Kiểm tra xem có nhân viên nào đang làm việc ở dây chuyền này không
    const [nhanVien] = await pool.query("SELECT id FROM nhan_vien WHERE day_chuyen_id = ? LIMIT 1", [id]);
    if (nhanVien.length > 0) {
        const loi = new Error("Không thể xóa dây chuyền đang có nhân viên vận hành");
        loi.statusCode = 400;
        throw loi;
    }

    // Lấy tất cả công đoạn của dây chuyền này trong yeu_cau_nhan_su để xóa sạch
    const [yauCau] = await pool.query("SELECT cong_doan_id FROM yeu_cau_nhan_su WHERE day_chuyen_id = ?", [id]);
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Xóa yêu cầu nhân sự
        await connection.query("DELETE FROM yeu_cau_nhan_su WHERE day_chuyen_id = ?", [id]);

        // Xóa các công đoạn liên quan
        if (yauCau.length > 0) {
            const listIds = yauCau.map(y => y.cong_doan_id);
            await connection.query("DELETE FROM cong_doan WHERE id IN (?)", [listIds]);
        }

        // Xóa dây chuyền
        await connection.query("DELETE FROM day_chuyen WHERE id = ?", [id]);

        await connection.commit();
        return true;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

/**
 * Lấy danh sách nhân viên có chức vụ LEADER_LINE để gán làm trưởng dây chuyền (leader)
 */
export async function layDanhSachLeaderLine() {
    const [rows] = await pool.query(
        `SELECT id, ho_ten, ma_nhan_vien 
         FROM nhan_vien 
         WHERE chuc_vu = 'LEADER_LINE' AND trang_thai = 'DANG_LAM'`
    );
    return rows;
}

/**
 * Xem chi tiết cấu hình nhân sự và trạng thái thiếu/đủ của từng bộ phận trong dây chuyền
 */
export async function layChiTietDayChuyen(id, ngayYeuCau, nguoiDung) {
    const ngay = ngayYeuCau || new Date().toISOString().split("T")[0];

    const dayChuyen = await timDayChuyenTheoId(id);
    if (!dayChuyen) {
        const loi = new Error("Không tìm thấy dây chuyền");
        loi.statusCode = 404;
        throw loi;
    }

    if (nguoiDung) {
        if (nguoiDung.role === "LEADER_LINE") {
            const [nvRows] = await pool.query("SELECT id FROM nhan_vien WHERE tai_khoan_id = ?", [nguoiDung.id]);
            if (nvRows.length === 0 || dayChuyen.leader_id !== nvRows[0].id) {
                const loi = new Error("Bạn không có quyền xem chi tiết dây chuyền này!");
                loi.statusCode = 403;
                throw loi;
            }
        } else if (nguoiDung.role === "LEADER_KHU_VUC") {
            const [nvRows] = await pool.query("SELECT id FROM nhan_vien WHERE tai_khoan_id = ?", [nguoiDung.id]);
            if (nvRows.length > 0) {
                const nvId = nvRows[0].id;
                const [kvRows] = await pool.query("SELECT id FROM khu_vuc WHERE id = ? AND leader_id = ?", [dayChuyen.khu_vuc_id, nvId]);
                if (kvRows.length === 0) {
                    const loi = new Error("Bạn không có quyền xem chi tiết dây chuyền thuộc khu vực này!");
                    loi.statusCode = 403;
                    throw loi;
                }
            } else {
                const loi = new Error("Tài khoản chưa được liên kết với nhân viên");
                loi.statusCode = 403;
                throw loi;
            }
        }
    }

    // 1. Lấy danh sách các bộ phận yêu cầu của dây chuyền này
    const [boPhans] = await pool.query(
        `SELECT cd.id AS cong_doan_id, cd.ten_cong_doan, yc.so_luong_can
         FROM yeu_cau_nhan_su yc
         JOIN cong_doan cd ON yc.cong_doan_id = cd.id
         WHERE yc.day_chuyen_id = ?
         ORDER BY cd.ten_cong_doan ASC`,
        [id]
    );

    // 2. Lấy danh sách nhân sự đã được phân công vào từng bộ phận trong ngày yêu cầu
    const chiTietBoPhan = [];
    for (const bp of boPhans) {
        const [nhanSuDaGan] = await pool.query(
            `SELECT pc.id AS phan_cong_id, nv.id AS nhan_vien_id, nv.ho_ten, nv.ma_nhan_vien, nv.gioi_tinh, nv.so_dien_thoai
             FROM phan_cong_nhan_su pc
             JOIN nhan_vien nv ON pc.nhan_vien_id = nv.id
             WHERE pc.day_chuyen_id = ? AND pc.cong_doan_id = ? AND pc.ngay = ?`,
            [id, bp.cong_doan_id, ngay]
        );

        const soLuongDaGan = nhanSuDaGan.length;
        const soLuongCan = bp.so_luong_can;
        
        let trangThai = "DU";
        let thieuNguoi = 0;

        if (soLuongDaGan < soLuongCan) {
            trangThai = "THIEU";
            thieuNguoi = SampleMax(soLuongCan - soLuongDaGan, 0);
        }

        chiTietBoPhan.push({
            cong_doan_id: bp.cong_doan_id,
            ten_bo_phan: bp.ten_cong_doan,
            so_luong_can: soLuongCan,
            so_luong_da_gan: soLuongDaGan,
            trang_thai: trangThai,
            so_luong_thieu: thieuNguoi,
            nhan_vien: nhanSuDaGan
        });
    }

    return {
        day_chuyen: dayChuyen,
        ngay: ngay,
        bo_phan: chiTietBoPhan
    };
}

function SampleMax(a, b) {
    return a > b ? a : b;
}

/**
 * Lọc danh sách nhân viên ứng viên có chứng chỉ phù hợp cho bộ phận
 */
export async function layUngVienChoBoPhan(congDoanId) {
    // A. Lấy tên công đoạn
    const [cdRows] = await pool.query("SELECT ten_cong_doan FROM cong_doan WHERE id = ? LIMIT 1", [congDoanId]);
    if (cdRows.length === 0) {
        const loi = new Error("Không tìm thấy bộ phận này");
        loi.statusCode = 404;
        throw loi;
    }

    const tenBoPhan = cdRows[0].ten_cong_doan;
    const tenChungChiRequired = layTenChungChiTuCongDoan(tenBoPhan);

    // B. Tìm chứng chỉ tương ứng
    const [ccRows] = await pool.query("SELECT id FROM chung_chi WHERE ten_chung_chi = ? LIMIT 1", [tenChungChiRequired]);
    if (ccRows.length === 0) {
        // Nếu không có chứng chỉ này trong DB, trả về toàn bộ nhân viên chưa được phân công trong ngày
        const [allNhanVien] = await pool.query(
            `SELECT id, ho_ten, ma_nhan_vien 
             FROM nhan_vien 
             WHERE trang_thai = 'DANG_LAM'`
        );
        return allNhanVien;
    }
    const chungChiId = ccRows[0].id;

    // C. Tìm các nhân viên có chứng chỉ này còn hiệu lực
    const [candidates] = await pool.query(
        `SELECT nv.id, nv.ho_ten, nv.ma_nhan_vien, ccnv.cap_do
         FROM nhan_vien nv
         JOIN chung_chi_nhan_vien ccnv ON nv.id = ccnv.nhan_vien_id
         WHERE ccnv.chung_chi_id = ? AND ccnv.trang_thai = 'HIEU_LUC' AND nv.trang_thai = 'DANG_LAM'`,
        [chungChiId]
    );

    return candidates;
}

/**
 * Phân công nhân sự vào bộ phận của dây chuyền
 */
export async function phanCongNhanSu({ nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay }) {
    const ngayDinhDang = ngay || new Date().toISOString().split("T")[0];

    // 1. Kiểm tra xem nhân viên đã được phân công vào dây chuyền nào trong ngày đó chưa
    const [trungPhanCong] = await pool.query(
        "SELECT id FROM phan_cong_nhan_su WHERE nhan_vien_id = ? AND ngay = ?",
        [nhan_vien_id, ngayDinhDang]
    );

    if (trungPhanCong.length > 0) {
        const loi = new Error("Nhân viên này đã được phân công làm việc ở một bộ phận/dây chuyền khác trong ngày hôm nay!");
        loi.statusCode = 400;
        throw loi;
    }

    // 2. Lấy ca làm mặc định nếu không truyền
    let caLamId = ca_lam_id;
    if (!caLamId) {
        const [caLamList] = await pool.query("SELECT id FROM ca_lam_viec LIMIT 1");
        if (caLamList.length > 0) {
            caLamId = caLamList[0].id;
        } else {
            // Tạo ca làm mặc định
            const [kqCa] = await pool.query(
                "INSERT INTO ca_lam_viec (ten_ca, gio_bat_dau, gio_ket_thuc) VALUES ('Ca Hanh Chinh', '08:00:00', '17:00:00')"
            );
            caLamId = kqCa.insertId;
        }
    }

    // 3. Thực hiện phân công
    await pool.query(
        `INSERT INTO phan_cong_nhan_su (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, trang_thai)
         VALUES (?, ?, ?, ?, ?, 'DANG_LAM')`,
        [nhan_vien_id, day_chuyen_id, cong_doan_id, caLamId, ngayDinhDang]
    );

    return { success: true, message: "Phân công nhân sự thành công" };
}

/**
 * Gỡ nhân sự khỏi bộ phận
 */
export async function goPhanCongNhanSu({ nhan_vien_id, day_chuyen_id, cong_doan_id, ngay }) {
    const ngayDinhDang = ngay || new Date().toISOString().split("T")[0];

    await pool.query(
        "DELETE FROM phan_cong_nhan_su WHERE nhan_vien_id = ? AND day_chuyen_id = ? AND cong_doan_id = ? AND ngay = ?",
        [nhan_vien_id, day_chuyen_id, cong_doan_id, ngayDinhDang]
    );

    return { success: true, message: "Đã gỡ nhân sự khỏi bộ phận" };
}


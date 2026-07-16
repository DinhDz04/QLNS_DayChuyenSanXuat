import pool from "../config/db.js";
import ApiError from "../utils/api_error.js";

/**
 * Service quản lý nghiệp vụ Dây chuyền sản xuất
 */
class DayChuyenService {
    static async layDanhSachDayChuyen(nguoiDung) {
        let query = `
            SELECT dc.id, dc.ten_day_chuyen, dc.khu_vuc_id, dc.leader_id, dc.trang_thai,
                   kv.ten_khu_vuc,
                   nv.ho_ten AS ten_leader, nv.ma_nhan_vien AS ma_leader,
                   (SELECT COALESCE(SUM(so_luong_can), 0) FROM yeu_cau_nhan_su WHERE day_chuyen_id = dc.id) AS total_yeu_cau,
                   (SELECT COUNT(*) FROM phan_cong_nhan_su WHERE day_chuyen_id = dc.id AND ngay = CURDATE()) AS total_hien_co
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
                    return [];
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
                        return [];
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

    static async timDayChuyenTheoId(id) {
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

    static _chuanHoaTenBoPhan(loai) {
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

    static _layTenChungChiTuCongDoan(tenCongDoan) {
        return tenCongDoan.replace(/\s+\d+$/, "").trim();
    }

    static _isCaTangCa(caLam) {
        if (!caLam) return false;
        const tenCa = (caLam.ten_ca || "").toLowerCase();
        if (tenCa.includes("tăng ca") || tenCa.includes("tang ca") || tenCa.includes("ot")) {
            return true;
        }
        const gioBatDau = caLam.gio_bat_dau;
        if (gioBatDau) {
            // trước 5h hoặc 17h
            if (gioBatDau >= "17:00:00" || (gioBatDau >= "05:00:00" && gioBatDau < "08:00:00")) {
                return true;
            }
        }
        return false;
    }

    static async taoDayChuyen({ ten_day_chuyen, khu_vuc_id, leader_id, trang_thai, bo_phan }) {
        if (!ten_day_chuyen || !khu_vuc_id) {
            throw new ApiError(400, "Tên dây chuyền và Khu vực không được để trống");
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [trungDayChuyen] = await connection.query(
                "SELECT id FROM day_chuyen WHERE ten_day_chuyen = ? AND khu_vuc_id = ? LIMIT 1",
                [ten_day_chuyen, khu_vuc_id]
            );
            if (trungDayChuyen.length > 0) {
                throw new ApiError(409, "Tên dây chuyền đã tồn tại trong khu vực này");
            }

            const [kqDayChuyen] = await connection.query(
                "INSERT INTO day_chuyen (ten_day_chuyen, khu_vuc_id, leader_id, trang_thai) VALUES (?, ?, ?, ?)",
                [ten_day_chuyen, khu_vuc_id, leader_id || null, trang_thai || "HOAT_DONG"]
            );
            const dayChuyenId = kqDayChuyen.insertId;

            if (leader_id) {
                await connection.query(
                    "DELETE FROM phan_cong_nhan_su WHERE nhan_vien_id = ? AND ngay >= CURDATE()",
                    [leader_id]
                );
            }

            if (bo_phan && Array.isArray(bo_phan) && bo_phan.length > 0) {
                let index = 1;
                for (const bp of bo_phan) {
                    const tenBoPhanMoi = `${ten_day_chuyen} ${index}`;
                    index++;
                    const soLuongCan = Number(bp.so_luong_can) || 1;
                    const soLuongMin = Number(bp.so_luong_min) || soLuongCan;
                    const soLuongMax = Number(bp.so_luong_max) || soLuongCan;

                    const [kqCongDoan] = await connection.query(
                        "INSERT INTO cong_doan (ten_cong_doan, mo_ta) VALUES (?, ?)",
                        [tenBoPhanMoi, `Bộ phận ${tenBoPhanMoi} thuộc dây chuyền ${ten_day_chuyen}`]
                    );
                    const congDoanId = kqCongDoan.insertId;

                    await connection.query(
                        "INSERT INTO yeu_cau_nhan_su (day_chuyen_id, cong_doan_id, so_luong_can, so_luong_min, so_luong_max) VALUES (?, ?, ?, ?, ?)",
                        [dayChuyenId, congDoanId, soLuongCan, soLuongMin, soLuongMax]
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

    static async capNhatDayChuyen(id, { ten_day_chuyen, khu_vuc_id, leader_id, trang_thai, bo_phan }) {
        if (!ten_day_chuyen || !khu_vuc_id) {
            throw new ApiError(400, "Tên dây chuyền và Khu vực không được để trống");
        }

        const dayChuyen = await DayChuyenService.timDayChuyenTheoId(id);
        if (!dayChuyen) {
            throw new ApiError(404, "Không tìm thấy dây chuyền");
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [trungDayChuyen] = await connection.query(
                "SELECT id FROM day_chuyen WHERE ten_day_chuyen = ? AND khu_vuc_id = ? AND id != ? LIMIT 1",
                [ten_day_chuyen, khu_vuc_id, id]
            );
            if (trungDayChuyen.length > 0) {
                throw new ApiError(409, "Tên dây chuyền đã tồn tại trong khu vực này");
            }

            await connection.query(
                "UPDATE day_chuyen SET ten_day_chuyen = ?, khu_vuc_id = ?, leader_id = ?, trang_thai = ? WHERE id = ?",
                [ten_day_chuyen, khu_vuc_id, leader_id || null, trang_thai || "HOAT_DONG", id]
            );

            if (leader_id) {
                await connection.query(
                    "DELETE FROM phan_cong_nhan_su WHERE nhan_vien_id = ? AND ngay >= CURDATE()",
                    [leader_id]
                );
            }

            if (bo_phan && Array.isArray(bo_phan)) {
                const [rowsYc] = await connection.query(
                    "SELECT cong_doan_id FROM yeu_cau_nhan_su WHERE day_chuyen_id = ?",
                    [id]
                );
                const listCongDoanIdsHienTai = rowsYc.map(r => r.cong_doan_id);

                const listCongDoanIdsGuiLen = bo_phan
                    .filter(bp => bp.cong_doan_id)
                    .map(bp => Number(bp.cong_doan_id));

                const listIdsXoa = listCongDoanIdsHienTai.filter(idHienTai => !listCongDoanIdsGuiLen.includes(idHienTai));
                if (listIdsXoa.length > 0) {
                    await connection.query(
                        "DELETE FROM yeu_cau_nhan_su WHERE day_chuyen_id = ? AND cong_doan_id IN (?)",
                        [id, listIdsXoa]
                    );
                    try {
                        await connection.query("DELETE FROM cong_doan WHERE id IN (?)", [listIdsXoa]);
                    } catch (e) {
                        console.log("Không thể xóa một số công đoạn khỏi bảng cong_doan:", e.message);
                    }
                }

                let index = 1;
                for (const bp of bo_phan) {
                    const soLuongCan = Number(bp.so_luong_can) || 1;
                    const soLuongMin = Number(bp.so_luong_min) || soLuongCan;
                    const soLuongMax = Number(bp.so_luong_max) || soLuongCan;
                    const tenBoPhanMoi = `${ten_day_chuyen} ${index}`;
                    index++;
                    
                    if (bp.cong_doan_id) {
                        await connection.query(
                            "UPDATE cong_doan SET ten_cong_doan = ? WHERE id = ?",
                            [tenBoPhanMoi, bp.cong_doan_id]
                        );
                        await connection.query(
                            "UPDATE yeu_cau_nhan_su SET so_luong_can = ?, so_luong_min = ?, so_luong_max = ? WHERE day_chuyen_id = ? AND cong_doan_id = ?",
                            [soLuongCan, soLuongMin, soLuongMax, id, bp.cong_doan_id]
                        );
                    } else {
                        const [kqCongDoan] = await connection.query(
                            "INSERT INTO cong_doan (ten_cong_doan, mo_ta) VALUES (?, ?)",
                            [tenBoPhanMoi, `Bộ phận ${tenBoPhanMoi} thuộc dây chuyền ${ten_day_chuyen}`]
                        );
                        const newCongDoanId = kqCongDoan.insertId;

                        await connection.query(
                            "INSERT INTO yeu_cau_nhan_su (day_chuyen_id, cong_doan_id, so_luong_can, so_luong_min, so_luong_max) VALUES (?, ?, ?, ?, ?)",
                            [id, newCongDoanId, soLuongCan, soLuongMin, soLuongMax]
                        );
                    }
                }
            }

            await connection.commit();
            return { id, ten_day_chuyen, khu_vuc_id, leader_id, trang_thai };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    static async xoaDayChuyen(id) {
        const dayChuyen = await DayChuyenService.timDayChuyenTheoId(id);
        if (!dayChuyen) {
            throw new ApiError(404, "Không tìm thấy dây chuyền");
        }

        const [nhanVien] = await pool.query("SELECT id FROM nhan_vien WHERE day_chuyen_id = ? LIMIT 1", [id]);
        if (nhanVien.length > 0) {
            throw new ApiError(400, "Không thể xóa dây chuyền đang có nhân viên vận hành");
        }

        const [yauCau] = await pool.query("SELECT cong_doan_id FROM yeu_cau_nhan_su WHERE day_chuyen_id = ?", [id]);
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query("DELETE FROM yeu_cau_nhan_su WHERE day_chuyen_id = ?", [id]);

            if (yauCau.length > 0) {
                const listIds = yauCau.map(y => y.cong_doan_id);
                await connection.query("DELETE FROM cong_doan WHERE id IN (?)", [listIds]);
            }

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

    static async layDanhSachLeaderLine() {
        const [rows] = await pool.query(
            `SELECT id, ho_ten, ma_nhan_vien 
             FROM nhan_vien 
             WHERE chuc_vu = 'LEADER_LINE' AND trang_thai = 'DANG_LAM'`
        );
        return rows;
    }

    static async layChiTietDayChuyen(id, ngayYeuCau, nguoiDung) {
        const ngay = ngayYeuCau || new Date().toISOString().split("T")[0];

        const dayChuyen = await DayChuyenService.timDayChuyenTheoId(id);
        if (!dayChuyen) {
            throw new ApiError(404, "Không tìm thấy dây chuyền");
        }

        if (nguoiDung) {
            if (nguoiDung.role === "LEADER_LINE") {
                const [nvRows] = await pool.query("SELECT id FROM nhan_vien WHERE tai_khoan_id = ?", [nguoiDung.id]);
                if (nvRows.length === 0 || dayChuyen.leader_id !== nvRows[0].id) {
                    throw new ApiError(403, "Bạn không có quyền xem chi tiết dây chuyền này!");
                }
            } else if (nguoiDung.role === "LEADER_KHU_VUC") {
                const [nvRows] = await pool.query("SELECT id FROM nhan_vien WHERE tai_khoan_id = ?", [nguoiDung.id]);
                if (nvRows.length > 0) {
                    const nvId = nvRows[0].id;
                    const [kvRows] = await pool.query("SELECT id FROM khu_vuc WHERE id = ? AND leader_id = ?", [dayChuyen.khu_vuc_id, nvId]);
                    if (kvRows.length === 0) {
                        throw new ApiError(403, "Bạn không có quyền xem chi tiết dây chuyền thuộc khu vực này!");
                    }
                } else {
                    throw new ApiError(403, "Tài khoản chưa được liên kết với nhân viên");
                }
            }
        }

        const [boPhans] = await pool.query(
            `SELECT cd.id AS cong_doan_id, cd.ten_cong_doan, yc.so_luong_can, yc.so_luong_min, yc.so_luong_max
             FROM yeu_cau_nhan_su yc
             JOIN cong_doan cd ON yc.cong_doan_id = cd.id
             WHERE yc.day_chuyen_id = ?
             ORDER BY cd.ten_cong_doan ASC`,
            [id]
        );

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
            const soLuongMin = bp.so_luong_min !== null ? bp.so_luong_min : bp.so_luong_can;
            const soLuongMax = bp.so_luong_max !== null ? bp.so_luong_max : bp.so_luong_can;
            
            let trangThai = "DU";
            let thieuNguoi = 0;
            let duNguoi = 0;

            if (soLuongDaGan < soLuongMin) {
                trangThai = "THIEU";
                thieuNguoi = Math.max(soLuongMin - soLuongDaGan, 0);
            } else if (soLuongDaGan > soLuongMax) {
                trangThai = "DU_THUA";
                duNguoi = Math.max(soLuongDaGan - soLuongMax, 0);
            }

            chiTietBoPhan.push({
                cong_doan_id: bp.cong_doan_id,
                ten_bo_phan: bp.ten_cong_doan,
                so_luong_can: bp.so_luong_can,
                so_luong_min: soLuongMin,
                so_luong_max: soLuongMax,
                so_luong_da_gan: soLuongDaGan,
                trang_thai: trangThai,
                so_luong_thieu: thieuNguoi,
                so_luong_du: duNguoi,
                nhan_vien: nhanSuDaGan
            });
        }

        return {
            day_chuyen: dayChuyen,
            ngay: ngay,
            bo_phan: chiTietBoPhan
        };
    }

    static async layUngVienChoBoPhan(congDoanId) {
        const [cdRows] = await pool.query("SELECT ten_cong_doan FROM cong_doan WHERE id = ? LIMIT 1", [congDoanId]);
        if (cdRows.length === 0) {
            throw new ApiError(404, "Không tìm thấy bộ phận này");
        }

        const tenBoPhan = cdRows[0].ten_cong_doan;
        const tenChungChiRequired = DayChuyenService._layTenChungChiTuCongDoan(tenBoPhan);

        const [ccRows] = await pool.query("SELECT id FROM chung_chi WHERE ten_chung_chi = ? LIMIT 1", [tenChungChiRequired]);
        if (ccRows.length === 0) {
            const [allNhanVien] = await pool.query(
                `SELECT id, ho_ten, ma_nhan_vien 
                 FROM nhan_vien 
                 WHERE trang_thai = 'DANG_LAM' 
                   AND chuc_vu = 'NHAN_VIEN'
                   AND id NOT IN (SELECT leader_id FROM day_chuyen WHERE leader_id IS NOT NULL)`
            );
            return allNhanVien;
        }
        const chungChiId = ccRows[0].id;

        const [candidates] = await pool.query(
            `SELECT nv.id, nv.ho_ten, nv.ma_nhan_vien, ccnv.cap_do
             FROM nhan_vien nv
             JOIN chung_chi_nhan_vien ccnv ON nv.id = ccnv.nhan_vien_id
             WHERE ccnv.chung_chi_id = ? 
               AND ccnv.trang_thai = 'HIEU_LUC' 
               AND nv.trang_thai = 'DANG_LAM' 
               AND nv.chuc_vu = 'NHAN_VIEN'
               AND nv.id NOT IN (SELECT leader_id FROM day_chuyen WHERE leader_id IS NOT NULL)`,
            [chungChiId]
        );

        return candidates;
    }

    static async phanCongNhanSu({ nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay }) {
        const ngayDinhDang = ngay || new Date().toISOString().split("T")[0];

        let caLamId = ca_lam_id;
        if (!caLamId) {
            const [caLamList] = await pool.query("SELECT id FROM ca_lam_viec LIMIT 1");
            if (caLamList.length > 0) {
                caLamId = caLamList[0].id;
            } else {
                const [kqCa] = await pool.query(
                    "INSERT INTO ca_lam_viec (ten_ca, gio_bat_dau, gio_ket_thuc) VALUES ('Ca Hanh Chinh', '08:00:00', '17:00:00')"
                );
                caLamId = kqCa.insertId;
            }
        }

        const [caLamRows] = await pool.query("SELECT * FROM ca_lam_viec WHERE id = ? LIMIT 1", [caLamId]);
        if (caLamRows.length === 0) {
            throw new ApiError(404, "Không tìm thấy ca làm việc này!");
        }
        const caLam = caLamRows[0];
        const isOvertime = DayChuyenService._isCaTangCa(caLam);

        // Bổ sung: Kiểm tra xem nhân sự có đang là Leader hay không
        const [nvCheckRows] = await pool.query("SELECT chuc_vu FROM nhan_vien WHERE id = ? LIMIT 1", [nhan_vien_id]);
        if (nvCheckRows.length === 0) {
            throw new ApiError(404, "Không tìm thấy nhân viên!");
        }
        const nvChucVu = nvCheckRows[0].chuc_vu;
        if (nvChucVu === "LEADER_LINE" || nvChucVu === "LEADER_KHU_VUC" || nvChucVu === "ADMIN") {
            throw new ApiError(400, `Lỗi: Không thể phân công người có chức vụ ${nvChucVu} làm nhân viên công đoạn!`);
        }

        // Kiểm tra xem nhân viên này có đang là Leader của bất kỳ dây chuyền nào không
        const [dcCheckRows] = await pool.query("SELECT id FROM day_chuyen WHERE leader_id = ? LIMIT 1", [nhan_vien_id]);
        if (dcCheckRows.length > 0) {
            throw new ApiError(400, "Lỗi: Nhân viên này đang được phân công làm Leader dây chuyền, không thể gán làm nhân viên công đoạn!");
        }

        if (isOvertime) {
            const [dangKy] = await pool.query(
                "SELECT id FROM dang_ky_tang_ca WHERE nhan_vien_id = ? AND ca_lam_id = ? AND ngay = ? AND trang_thai = 'DA_DUYET' LIMIT 1",
                [nhan_vien_id, caLamId, ngayDinhDang]
            );
            if (dangKy.length === 0) {
                throw new ApiError(400, "Nhân viên này chưa đăng ký tăng ca hoặc chưa được duyệt tăng ca cho ca làm này trong ngày!");
            }
        }

        // Kiểm tra chứng chỉ kỹ năng phù hợp cho công đoạn
        const [cdRows] = await pool.query("SELECT ten_cong_doan FROM cong_doan WHERE id = ? LIMIT 1", [cong_doan_id]);
        if (cdRows.length === 0) {
            throw new ApiError(404, "Không tìm thấy công đoạn này!");
        }
        const tenCongDoan = cdRows[0].ten_cong_doan;
        const tenChungChiYeuCau = DayChuyenService._layTenChungChiTuCongDoan(tenCongDoan);

        const [ccRows] = await pool.query("SELECT id FROM chung_chi WHERE ten_chung_chi = ? LIMIT 1", [tenChungChiYeuCau]);
        if (ccRows.length > 0) {
            const chungChiId = ccRows[0].id;
            const [ccNvRows] = await pool.query(
                "SELECT id FROM chung_chi_nhan_vien WHERE nhan_vien_id = ? AND chung_chi_id = ? AND trang_thai = 'HIEU_LUC' LIMIT 1",
                [nhan_vien_id, chungChiId]
            );
            if (ccNvRows.length === 0) {
                throw new ApiError(400, `Lỗi: Nhân viên không có chứng chỉ kỹ năng phù hợp cho công đoạn "${tenCongDoan}" (Yêu cầu chứng chỉ: "${tenChungChiYeuCau}")!`);
            }
        }

        const [trungPhanCong] = await pool.query(
            "SELECT id FROM phan_cong_nhan_su WHERE nhan_vien_id = ? AND ngay = ? AND ca_lam_id = ?",
            [nhan_vien_id, ngayDinhDang, caLamId]
        );

        if (trungPhanCong.length > 0) {
            throw new ApiError(400, "Nhân viên này đã được phân công làm việc ở một bộ phận/dây chuyền khác trong ca làm này!");
        }

        const [hienCo] = await pool.query(
            "SELECT COUNT(*) AS count FROM phan_cong_nhan_su WHERE day_chuyen_id = ? AND cong_doan_id = ? AND ngay = ? AND ca_lam_id = ?",
            [day_chuyen_id, cong_doan_id, ngayDinhDang, caLamId]
        );
        const currentCount = hienCo[0].count;

        const [yeuCau] = await pool.query(
            "SELECT so_luong_max, so_luong_can FROM yeu_cau_nhan_su WHERE day_chuyen_id = ? AND cong_doan_id = ? LIMIT 1",
            [day_chuyen_id, cong_doan_id]
        );

        if (yeuCau.length > 0) {
            const soLuongMax = yeuCau[0].so_luong_max !== null ? yeuCau[0].so_luong_max : yeuCau[0].so_luong_can;
            if (currentCount >= soLuongMax) {
                throw new ApiError(400, `Bộ phận này đã đạt số lượng nhân viên tối đa cho phép (${soLuongMax} người)! Không thể gán thêm.`);
            }
        }

        await pool.query(
            `INSERT INTO phan_cong_nhan_su (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, trang_thai)
             VALUES (?, ?, ?, ?, ?, 'DANG_LAM')`,
            [nhan_vien_id, day_chuyen_id, cong_doan_id, caLamId, ngayDinhDang]
        );

        return { success: true, message: "Phân công nhân sự thành công" };
    }

    static async goPhanCongNhanSu({ nhan_vien_id, day_chuyen_id, cong_doan_id, ngay }) {
        const ngayDinhDang = ngay || new Date().toISOString().split("T")[0];

        await pool.query(
            "DELETE FROM phan_cong_nhan_su WHERE nhan_vien_id = ? AND day_chuyen_id = ? AND cong_doan_id = ? AND ngay = ?",
            [nhan_vien_id, day_chuyen_id, cong_doan_id, ngayDinhDang]
        );

        return { success: true, message: "Đã gỡ nhân sự khỏi bộ phận" };
    }

    static async tuDongGanNhanSu({ day_chuyen_id, ngay, ca_lam_id }) {
        const ngayDinhDang = ngay || new Date().toISOString().split("T")[0];

        let caLamId = ca_lam_id;
        if (!caLamId) {
            const [caLamList] = await pool.query("SELECT id FROM ca_lam_viec LIMIT 1");
            if (caLamList.length > 0) {
                caLamId = caLamList[0].id;
            } else {
                const [kqCa] = await pool.query(
                    "INSERT INTO ca_lam_viec (ten_ca, gio_bat_dau, gio_ket_thuc) VALUES ('Ca Hanh Chinh', '08:00:00', '17:00:00')"
                );
                caLamId = kqCa.insertId;
            }
        }

        const [caLamRows] = await pool.query("SELECT * FROM ca_lam_viec WHERE id = ? LIMIT 1", [caLamId]);
        if (caLamRows.length === 0) {
            throw new ApiError(404, "Không tìm thấy ca làm việc này!");
        }
        const caLam = caLamRows[0];
        const isOvertime = DayChuyenService._isCaTangCa(caLam);

        const chiTiet = await DayChuyenService.layChiTietDayChuyen(day_chuyen_id, ngayDinhDang);
        const boPhanThieu = chiTiet.bo_phan.filter(bp => bp.so_luong_da_gan < bp.so_luong_min);

        if (boPhanThieu.length === 0) {
            return { success: true, message: "Dây chuyền đã đủ nhân sự tối thiểu, không cần tự động gán.", danhSachGan: [] };
        }

        let nhanVienRanh;
        if (isOvertime) {
            const [rows] = await pool.query(
                `SELECT nv.id, nv.ho_ten, nv.ma_nhan_vien 
                 FROM nhan_vien nv
                 JOIN dang_ky_tang_ca dk ON nv.id = dk.nhan_vien_id
                 WHERE nv.trang_thai = 'DANG_LAM' 
                   AND nv.chuc_vu = 'NHAN_VIEN'
                   AND nv.id NOT IN (SELECT leader_id FROM day_chuyen WHERE leader_id IS NOT NULL)
                   AND dk.ca_lam_id = ?
                   AND dk.ngay = ?
                   AND dk.trang_thai = 'DA_DUYET'
                   AND nv.id NOT IN (
                       SELECT nhan_vien_id FROM phan_cong_nhan_su WHERE ngay = ? AND ca_lam_id = ?
                   )`,
                [caLamId, ngayDinhDang, ngayDinhDang, caLamId]
            );
            nhanVienRanh = rows;
        } else {
            const [rows] = await pool.query(
                `SELECT nv.id, nv.ho_ten, nv.ma_nhan_vien 
                 FROM nhan_vien nv
                 WHERE nv.trang_thai = 'DANG_LAM' 
                   AND nv.chuc_vu = 'NHAN_VIEN'
                   AND nv.id NOT IN (SELECT leader_id FROM day_chuyen WHERE leader_id IS NOT NULL)
                   AND nv.id NOT IN (
                       SELECT nhan_vien_id FROM phan_cong_nhan_su WHERE ngay = ? AND ca_lam_id = ?
                   )`,
                [ngayDinhDang, caLamId]
            );
            nhanVienRanh = rows;
        }

        if (nhanVienRanh.length === 0) {
            throw new ApiError(400, "Không còn nhân sự nào trống để tự động gán!");
        }

        let dsNhanVienTrong = [...nhanVienRanh];
        const danhSachGanThanhCong = [];

        for (const bp of boPhanThieu) {
            let thieu = bp.so_luong_min - bp.so_luong_da_gan;
            if (thieu <= 0) continue;

            const tenChungChiRequired = DayChuyenService._layTenChungChiTuCongDoan(bp.ten_bo_phan);
            const [ccRows] = await pool.query("SELECT id FROM chung_chi WHERE ten_chung_chi = ? LIMIT 1", [tenChungChiRequired]);
            
            if (ccRows.length > 0) {
                const chungChiId = ccRows[0].id;
                const [usersCoChungChi] = await pool.query(
                    `SELECT nhan_vien_id FROM chung_chi_nhan_vien 
                     WHERE chung_chi_id = ? AND trang_thai = 'HIEU_LUC'`,
                    [chungChiId]
                );
                const userIdsCoChungChi = usersCoChungChi.map(u => u.nhan_vien_id);

                const candidates = dsNhanVienTrong.filter(nv => userIdsCoChungChi.includes(nv.id));

                for (const cand of candidates) {
                    if (thieu <= 0) break;
                    await pool.query(
                        `INSERT INTO phan_cong_nhan_su (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, trang_thai)
                         VALUES (?, ?, ?, ?, ?, 'DANG_LAM')`,
                        [cand.id, day_chuyen_id, bp.cong_doan_id, caLamId, ngayDinhDang]
                    );
                    danhSachGanThanhCong.push({
                        nhan_vien_id: cand.id,
                        ma_nhan_vien: cand.ma_nhan_vien,
                        ho_ten: cand.ho_ten,
                        ten_cong_doan: bp.ten_bo_phan,
                        co_chung_chi: true
                    });
                    dsNhanVienTrong = dsNhanVienTrong.filter(nv => nv.id !== cand.id);
                    thieu--;
                }
            }
            bp.so_luong_thieu_sau_v1 = thieu;
        }

        for (const bp of boPhanThieu) {
            let thieu = bp.so_luong_thieu_sau_v1 !== undefined ? bp.so_luong_thieu_sau_v1 : (bp.so_luong_min - bp.so_luong_da_gan);
            if (thieu <= 0) continue;

            const tenChungChiRequired = DayChuyenService._layTenChungChiTuCongDoan(bp.ten_bo_phan);
            const [ccRows] = await pool.query("SELECT id FROM chung_chi WHERE ten_chung_chi = ? LIMIT 1", [tenChungChiRequired]);

            // Chỉ cho phép gán người không có chứng chỉ nếu công đoạn này thực sự không yêu cầu chứng chỉ nào trong DB
            if (ccRows.length === 0) {
                while (thieu > 0 && dsNhanVienTrong.length > 0) {
                    const cand = dsNhanVienTrong[0];
                    await pool.query(
                        `INSERT INTO phan_cong_nhan_su (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, trang_thai)
                         VALUES (?, ?, ?, ?, ?, 'DANG_LAM')`,
                        [cand.id, day_chuyen_id, bp.cong_doan_id, caLamId, ngayDinhDang]
                    );
                    danhSachGanThanhCong.push({
                        nhan_vien_id: cand.id,
                        ma_nhan_vien: cand.ma_nhan_vien,
                        ho_ten: cand.ho_ten,
                        ten_cong_doan: bp.ten_bo_phan,
                        co_chung_chi: false
                    });
                    dsNhanVienTrong.shift();
                    thieu--;
                }
            }
        }

        return {
            success: true,
            message: `Đã tự động gán thành công ${danhSachGanThanhCong.length} nhân viên.`,
            danhSachGan: danhSachGanThanhCong
        };
    }
}

export default DayChuyenService;

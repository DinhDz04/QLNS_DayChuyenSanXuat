import * as dayChuyenService from "../services/dayChuyen.service.js";

// GET /api/day-chuyen
export async function layDanhSachDayChuyen(req, res) {
    try {
        const data = await dayChuyenService.layDanhSachDayChuyen(req.nguoiDung);
        return res.json({ success: true, data });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message || "Lỗi server" });
    }
}

// GET /api/day-chuyen/leaders
export async function layDanhSachLeaderLine(req, res) {
    try {
        const data = await dayChuyenService.layDanhSachLeaderLine();
        return res.json({ success: true, data });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message || "Lỗi server" });
    }
}

// GET /api/day-chuyen/:id
export async function layDayChuyenTheoId(req, res) {
    try {
        const data = await dayChuyenService.timDayChuyenTheoId(req.params.id);
        if (!data) {
            return res.status(404).json({ success: false, message: "Không tìm thấy dây chuyền" });
        }
        return res.json({ success: true, data });
    } catch (err) {
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || "Lỗi server" });
    }
}

// POST /api/day-chuyen
export async function taoDayChuyen(req, res) {
    try {
        const { ten_day_chuyen, khu_vuc_id, leader_id, trang_thai, bo_phan } = req.body;
        const data = await dayChuyenService.taoDayChuyen({ ten_day_chuyen, khu_vuc_id, leader_id, trang_thai, bo_phan });
        return res.status(201).json({ success: true, message: "Tạo dây chuyền thành công", data });
    } catch (err) {
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || "Lỗi server" });
    }
}

// PUT /api/day-chuyen/:id
export async function capNhatDayChuyen(req, res) {
    try {
        const { ten_day_chuyen, khu_vuc_id, leader_id, trang_thai, bo_phan } = req.body;
        const data = await dayChuyenService.capNhatDayChuyen(req.params.id, { ten_day_chuyen, khu_vuc_id, leader_id, trang_thai, bo_phan });
        return res.json({ success: true, message: "Cập nhật dây chuyền thành công", data });
    } catch (err) {
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || "Lỗi server" });
    }
}

// DELETE /api/day-chuyen/:id
export async function xoaDayChuyen(req, res) {
    try {
        await dayChuyenService.xoaDayChuyen(req.params.id);
        return res.json({ success: true, message: "Xóa dây chuyền thành công" });
    } catch (err) {
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || "Lỗi server" });
    }
}

// GET /api/day-chuyen/:id/chi-tiet
export async function layChiTietDayChuyen(req, res) {
    try {
        const { id } = req.params;
        const { ngay } = req.query; // Nhận ngày cần truy vấn
        const data = await dayChuyenService.layChiTietDayChuyen(id, ngay, req.nguoiDung);
        return res.json({ success: true, data });
    } catch (err) {
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || "Lỗi server" });
    }
}

// GET /api/day-chuyen/ung-vien
export async function layUngVienChoBoPhan(req, res) {
    try {
        const { cong_doan_id } = req.query;
        if (!cong_doan_id) {
            return res.status(400).json({ success: false, message: "Thiếu cong_doan_id" });
        }
        const data = await dayChuyenService.layUngVienChoBoPhan(cong_doan_id);
        return res.json({ success: true, data });
    } catch (err) {
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || "Lỗi server" });
    }
}

// POST /api/day-chuyen/phan-cong
export async function phanCongNhanSu(req, res) {
    try {
        const { nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay } = req.body;
        const data = await dayChuyenService.phanCongNhanSu({ nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay });
        return res.json({ success: true, message: "Phân công nhân viên vào dây chuyền thành công", data });
    } catch (err) {
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || "Lỗi server" });
    }
}

// POST /api/day-chuyen/go-phan-cong
export async function goPhanCongNhanSu(req, res) {
    try {
        const { nhan_vien_id, day_chuyen_id, cong_doan_id, ngay } = req.body;
        const data = await dayChuyenService.goPhanCongNhanSu({ nhan_vien_id, day_chuyen_id, cong_doan_id, ngay });
        return res.json({ success: true, message: "Đã gỡ nhân viên khỏi bộ phận dây chuyền", data });
    } catch (err) {
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || "Lỗi server" });
    }
}

// POST /api/day-chuyen/:id/auto-assign
export async function tuDongGanNhanSu(req, res) {
    try {
        const { id } = req.params;
        const { ngay } = req.body;
        const data = await dayChuyenService.tuDongGanNhanSu({ day_chuyen_id: id, ngay });
        return res.json(data);
    } catch (err) {
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || "Lỗi server" });
    }
}

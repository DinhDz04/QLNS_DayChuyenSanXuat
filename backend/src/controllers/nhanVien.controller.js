import * as nhanVienService from "../services/nhanVien.service.js";

// GET /api/nhan-vien
export async function layDanhSachNhanVien(req, res) {
    try {
        const { q, day_chuyen_id, trang_thai } = req.query;
        const data = await nhanVienService.layDanhSachNhanVien({ q, day_chuyen_id, trang_thai });
        return res.json({
            success: true,
            data
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Lỗi server"
        });
    }
}

// GET /api/nhan-vien/:id/chung-chi
export async function layChungChiNhanVien(req, res) {
    try {
        const { id } = req.params;
        const data = await nhanVienService.layChungChiNhanVien(id);
        return res.json({
            success: true,
            data
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Lỗi server"
        });
    }
}

// PUT /api/nhan-vien/:id
export async function capNhatNhanVien(req, res) {
    try {
        const { id } = req.params;
        const { ho_ten, gioi_tinh, so_dien_thoai, day_chuyen_id, chuc_vu, trang_thai } = req.body;
        const thanhCong = await nhanVienService.capNhatNhanVien(id, {
            ho_ten,
            gioi_tinh,
            so_dien_thoai,
            day_chuyen_id,
            chuc_vu,
            trang_thai
        });
        if (thanhCong) {
            return res.json({
                success: true,
                message: "Cập nhật nhân viên thành công"
            });
        }
        return res.status(400).json({
            success: false,
            message: "Cập nhật thất bại"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Lỗi server"
        });
    }
}

// DELETE /api/nhan-vien/:id
export async function xoaNhanVien(req, res) {
    try {
        const { id } = req.params;
        const thanhCong = await nhanVienService.xoaNhanVien(id);
        if (thanhCong) {
            return res.json({
                success: true,
                message: "Xóa nhân viên thành công"
            });
        }
        return res.status(400).json({
            success: false,
            message: "Xóa nhân viên thất bại"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Lỗi server"
        });
    }
}

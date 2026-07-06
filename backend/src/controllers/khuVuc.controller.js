import * as khuVucService from "../services/khuVuc.service.js";

// GET /api/khu-vuc
export async function layDanhSachKhuVuc(req, res) {
    try {
        const data = await khuVucService.layDanhSachKhuVuc();
        return res.json({ success: true, data });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message || "Lỗi server" });
    }
}

// GET /api/khu-vuc/leaders
export async function layDanhSachLeaderKhuVuc(req, res) {
    try {
        const data = await khuVucService.layDanhSachLeaderKhuVuc();
        return res.json({ success: true, data });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message || "Lỗi server" });
    }
}

// GET /api/khu-vuc/khach-hang
export async function layDanhSachKhachHang(req, res) {
    try {
        const data = await khuVucService.layDanhSachKhachHang();
        return res.json({ success: true, data });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message || "Lỗi server" });
    }
}

// GET /api/khu-vuc/:id
export async function layKhuVucTheoId(req, res) {
    try {
        const data = await khuVucService.timKhuVucTheoId(req.params.id);
        if (!data) {
            return res.status(404).json({ success: false, message: "Không tìm thấy khu vực" });
        }
        return res.json({ success: true, data });
    } catch (err) {
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || "Lỗi server" });
    }
}

// POST /api/khu-vuc
export async function taoKhuVuc(req, res) {
    try {
        const { ten_khu_vuc, khach_hang_id, leader_id } = req.body;
        const data = await khuVucService.taoKhuVuc({ ten_khu_vuc, khach_hang_id, leader_id });
        return res.status(201).json({ success: true, message: "Tạo khu vực thành công", data });
    } catch (err) {
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || "Lỗi server" });
    }
}

// PUT /api/khu-vuc/:id
export async function capNhatKhuVuc(req, res) {
    try {
        const { ten_khu_vuc, khach_hang_id, leader_id } = req.body;
        const data = await khuVucService.capNhatKhuVuc(req.params.id, { ten_khu_vuc, khach_hang_id, leader_id });
        return res.json({ success: true, message: "Cập nhật khu vực thành công", data });
    } catch (err) {
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || "Lỗi server" });
    }
}

// DELETE /api/khu-vuc/:id
export async function xoaKhuVuc(req, res) {
    try {
        await khuVucService.xoaKhuVuc(req.params.id);
        return res.json({ success: true, message: "Xóa khu vực thành công" });
    } catch (err) {
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || "Lỗi server" });
    }
}

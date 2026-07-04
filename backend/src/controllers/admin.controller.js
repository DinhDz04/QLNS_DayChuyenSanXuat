import * as adminService from "../services/admin.service.js";
import * as authService from "../services/auth.service.js";

// GET /api/admin/tai-khoan
export async function layDanhSachTaiKhoan(req, res) {
    try {
        const data = await adminService.layDanhSachTaiKhoan();
        return res.json({
            success: true,
            data
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message || "Lỗi server"
        });
    }
}

// POST /api/admin/tai-khoan
export async function taoTaiKhoan(req, res) {
    try {
        const { ten_dang_nhap, mat_khau, email, role } = req.body;
        const data = await authService.dangKy({ ten_dang_nhap, mat_khau, email, role });
        return res.status(201).json({
            success: true,
            message: "Tạo tài khoản thành công",
            data
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message || "Lỗi server"
        });
    }
}

// PUT /api/admin/tai-khoan/:id
export async function capNhatTaiKhoan(req, res) {
    try {
        const { id } = req.params;
        const { ten_dang_nhap, mat_khau, email, role, trang_thai } = req.body;
        const data = await adminService.capNhatTaiKhoan(id, {
            ten_dang_nhap,
            mat_khau,
            email,
            role,
            trang_thai
        });
        return res.json({
            success: true,
            message: "Cập nhật tài khoản thành công",
            data
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message || "Lỗi server"
        });
    }
}

// DELETE /api/admin/tai-khoan/:id
export async function xoaTaiKhoan(req, res) {
    try {
        const { id } = req.params;
        // req.nguoiDung được gắn bởi middleware xacThucToken
        const nguoiDungHienTaiId = req.nguoiDung.id;
        const ketQua = await adminService.xoaTaiKhoan(id, nguoiDungHienTaiId);
        return res.json({
            success: true,
            message: ketQua.message
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message || "Lỗi server"
        });
    }
}

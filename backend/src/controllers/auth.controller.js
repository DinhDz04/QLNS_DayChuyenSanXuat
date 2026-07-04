import * as authService from "../services/auth.service.js";
import * as taiKhoanModel from "../models/taiKhoan.model.js";

/**
 * Controller chỉ làm nhiệm vụ:
 * - Lấy dữ liệu từ request (req.body, req.params,...)
 * - Gọi service để xử lý
 * - Trả kết quả (response) cho client
 * Không viết câu SQL hay logic phức tạp ở đây.
 */

// POST /api/auth/login
export async function login(req, res) {
    try {
        const { ten_dang_nhap, mat_khau } = req.body;

        if (!ten_dang_nhap || !mat_khau) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập tên đăng nhập và mật khẩu"
            });
        }

        const ketQua = await authService.dangNhap(ten_dang_nhap, mat_khau);

        return res.json({
            success: true,
            message: "Đăng nhập thành công",
            data: ketQua
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message || "Lỗi server"
        });
    }
}

// POST /api/auth/register  (chỉ ADMIN được gọi - xem auth.router.js)
export async function register(req, res) {
    try {
        const { ten_dang_nhap, mat_khau, email, role } = req.body;
        const taiKhoanMoi = await authService.dangKy({ ten_dang_nhap, mat_khau, email, role });

        return res.status(201).json({
            success: true,
            message: "Tạo tài khoản thành công",
            data: taiKhoanMoi
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message || "Lỗi server"
        });
    }
}

// GET /api/auth/me  (lấy thông tin người đang đăng nhập, dựa vào token)
export async function layThongTinCaNhan(req, res) {
    try {
        // req.nguoiDung được middleware xacThucToken gắn vào trước đó
        const taiKhoan = await taiKhoanModel.timTheoId(req.nguoiDung.id);

        if (!taiKhoan) {
            return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });
        }

        return res.json({ success: true, data: taiKhoan });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
}

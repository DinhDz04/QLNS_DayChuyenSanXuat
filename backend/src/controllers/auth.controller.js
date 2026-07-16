import AuthService from "../services/auth.service.js";
import TaiKhoanModel from "../models/tai_khoan.model.js";
import ApiError from "../utils/api_error.js";

/**
 * Controller xử lý đăng nhập, đăng ký, thông tin cá nhân
 */
class AuthController {
    static async login(req, res, next) {
        try {
            const { ten_dang_nhap, mat_khau } = req.body;

            if (!ten_dang_nhap || !mat_khau) {
                throw new ApiError(400, "Vui lòng nhập tên đăng nhập và mật khẩu");
            }

            const ketQua = await AuthService.dangNhap(ten_dang_nhap, mat_khau);

            return res.json({
                success: true,
                message: "Đăng nhập thành công",
                data: ketQua
            });
        } catch (err) {
            next(err);
        }
    }

    static async register(req, res, next) {
        try {
            const { ten_dang_nhap, mat_khau, email, role } = req.body;
            const taiKhoanMoi = await AuthService.dangKy({ ten_dang_nhap, mat_khau, email, role });

            return res.status(201).json({
                success: true,
                message: "Tạo tài khoản thành công",
                data: taiKhoanMoi
            });
        } catch (err) {
            next(err);
        }
    }

    static async layThongTinCaNhan(req, res, next) {
        try {
            const taiKhoan = await TaiKhoanModel.timTheoId(req.nguoiDung.id);

            if (!taiKhoan) {
                throw new ApiError(404, "Không tìm thấy tài khoản");
            }

            return res.json({
                success: true,
                message: "Lấy thông tin cá nhân thành công",
                data: taiKhoan
            });
        } catch (err) {
            next(err);
        }
    }

    static async capNhatThongTinCaNhan(req, res, next) {
        try {
            const { mat_khau, email, ho_ten, so_dien_thoai, gioi_tinh } = req.body;
            const nguoiDungId = req.nguoiDung.id;

            const data = await AuthService.capNhatThongTinCaNhan(nguoiDungId, {
                mat_khau,
                email,
                ho_ten,
                so_dien_thoai,
                gioi_tinh
            });

            return res.json({
                success: true,
                message: "Cập nhật thông tin cá nhân thành công",
                data
            });
        } catch (err) {
            next(err);
        }
    }
}

export default AuthController;

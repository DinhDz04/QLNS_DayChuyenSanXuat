import bcrypt from "bcrypt";
import * as taiKhoanModel from "../models/taiKhoan.model.js";
import { taoToken } from "../utils/jwt.util.js";

// Danh sách role hợp lệ trong hệ thống (phải khớp với ENUM trong database)
export const DANH_SACH_ROLE = ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "NHAN_VIEN"];

/**
 * Xử lý đăng nhập:
 * 1. Tìm tài khoản theo tên đăng nhập
 * 2. So sánh mật khẩu người dùng nhập với mật khẩu đã mã hoá trong DB
 * 3. Nếu đúng -> tạo token trả về
 */
export async function dangNhap(ten_dang_nhap, mat_khau) {
    const taiKhoan = await taiKhoanModel.timTheoTenDangNhap(ten_dang_nhap);

    if (!taiKhoan) {
        // Không nói rõ "sai tên đăng nhập" hay "sai mật khẩu" để tránh lộ thông tin
        const loi = new Error("Tên đăng nhập hoặc mật khẩu không đúng");
        loi.statusCode = 401;
        throw loi;
    }

    if (taiKhoan.trang_thai === 0) {
        const loi = new Error("Tài khoản đã bị khoá, vui lòng liên hệ quản trị viên");
        loi.statusCode = 403;
        throw loi;
    }

    const matKhauDung = await bcrypt.compare(mat_khau, taiKhoan.mat_khau);
    if (!matKhauDung) {
        const loi = new Error("Tên đăng nhập hoặc mật khẩu không đúng");
        loi.statusCode = 401;
        throw loi;
    }

    // Payload chỉ chứa thông tin cần thiết, KHÔNG bao giờ đưa mật khẩu vào token
    const token = taoToken({
        id: taiKhoan.id,
        ten_dang_nhap: taiKhoan.ten_dang_nhap,
        role: taiKhoan.role
    });

    return {
        token,
        nguoiDung: {
            id: taiKhoan.id,
            ten_dang_nhap: taiKhoan.ten_dang_nhap,
            email: taiKhoan.email,
            role: taiKhoan.role
        }
    };
}

/**
 * Xử lý đăng ký tài khoản mới.
 * Trong thực tế, việc tạo tài khoản (đặc biệt là role ADMIN/LEADER)
 * thường chỉ nên do ADMIN thực hiện, không cho người ngoài tự đăng ký.
 */
export async function dangKy({ ten_dang_nhap, mat_khau, email, role }) {
    if (!ten_dang_nhap || !mat_khau) {
        const loi = new Error("Thiếu tên đăng nhập hoặc mật khẩu");
        loi.statusCode = 400;
        throw loi;
    }

    if (role && !DANH_SACH_ROLE.includes(role)) {
        const loi = new Error("Role không hợp lệ");
        loi.statusCode = 400;
        throw loi;
    }

    const daTonTai = await taiKhoanModel.timTheoTenDangNhap(ten_dang_nhap);
    if (daTonTai) {
        const loi = new Error("Tên đăng nhập đã tồn tại");
        loi.statusCode = 409;
        throw loi;
    }

    // Mã hoá mật khẩu trước khi lưu vào DB - KHÔNG BAO GIỜ lưu mật khẩu dạng thường (plain text)
    const soVongMaHoa = 10;
    const mat_khau_da_ma_hoa = await bcrypt.hash(mat_khau, soVongMaHoa);

    const id = await taiKhoanModel.taoTaiKhoan({
        ten_dang_nhap,
        mat_khau_da_ma_hoa,
        email,
        role: role || "NHAN_VIEN"
    });

    return { id, ten_dang_nhap, email, role: role || "NHAN_VIEN" };
}

/**
 * Cập nhật thông tin cá nhân người dùng đang đăng nhập
 */
export async function capNhatThongTinCaNhan(id, { mat_khau, email, ho_ten, so_dien_thoai, gioi_tinh }) {
    const taiKhoan = await taiKhoanModel.timTheoId(id);
    if (!taiKhoan) {
        const error = new Error("Tài khoản không tồn tại");
        error.statusCode = 404;
        throw error;
    }

    let mat_khau_da_ma_hoa = null;
    if (mat_khau && mat_khau.trim() !== "") {
        mat_khau_da_ma_hoa = await bcrypt.hash(mat_khau, 10);
    }

    await taiKhoanModel.capNhatTaiKhoan(id, {
        ten_dang_nhap: taiKhoan.ten_dang_nhap,
        email: email !== undefined ? email : taiKhoan.email,
        role: taiKhoan.role,
        trang_thai: taiKhoan.trang_thai,
        mat_khau_da_ma_hoa,
        ho_ten: ho_ten !== undefined ? ho_ten : taiKhoan.ho_ten,
        so_dien_thoai: so_dien_thoai !== undefined ? so_dien_thoai : taiKhoan.so_dien_thoai,
        gioi_tinh: gioi_tinh !== undefined ? gioi_tinh : taiKhoan.gioi_tinh
    });

    return await taiKhoanModel.timTheoId(id);
}


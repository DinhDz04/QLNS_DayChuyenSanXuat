import AdminService from "../services/admin.service.js";
import * as XLSX from "xlsx";
import ApiError from "../utils/api_error.js";

/**
 * Controller xử lý các tác vụ quản trị của Admin
 */
class AdminController {
    static async layDanhSachTaiKhoan(req, res, next) {
        try {
            const data = await AdminService.layDanhSachTaiKhoan();
            return res.json({
                success: true,
                message: "Lấy danh sách tài khoản thành công",
                data
            });
        } catch (err) {
            next(err);
        }
    }

    static async taoTaiKhoan(req, res, next) {
        try {
            const { ten_dang_nhap, mat_khau, email, role, ho_ten, so_dien_thoai, gioi_tinh, day_chuyen_id } = req.body;
            const data = await AdminService.taoTaiKhoan({
                ten_dang_nhap,
                mat_khau,
                email,
                role,
                ho_ten,
                so_dien_thoai,
                gioi_tinh,
                day_chuyen_id
            });
            return res.status(201).json({
                success: true,
                message: "Tạo tài khoản thành công",
                data
            });
        } catch (err) {
            next(err);
        }
    }

    static async nhapTaiKhoanTuExcel(req, res, next) {
        try {
            if (!req.file) {
                throw new ApiError(400, "Vui lòng chọn 1 file Excel để tải lên");
            }

            const ketQua = await AdminService.nhapTaiKhoanTuExcel(req.file.buffer);

            return res.json({
                success: true,
                message: `Đã xử lý ${ketQua.tong_so_dong} dòng: ${ketQua.so_thanh_cong} thành công, ${ketQua.so_loi} lỗi`,
                data: ketQua
            });
        } catch (err) {
            next(err);
        }
    }

    static async thayDoiCapBacTaiKhoan(req, res, next) {
        try {
            const { id } = req.params;
            const { huong } = req.body;
            const data = await AdminService.capNhatCapBacTaiKhoan(id, huong);

            return res.json({
                success: true,
                message: "Đã cập nhật cấp bậc tài khoản",
                data
            });
        } catch (err) {
            next(err);
        }
    }

    static async capNhatTaiKhoan(req, res, next) {
        try {
            const { id } = req.params;
            const { ten_dang_nhap, ho_ten, email, so_dien_thoai, role, trang_thai, mat_khau, gioi_tinh, day_chuyen_id } = req.body;
            const data = await AdminService.capNhatTaiKhoan(id, {
                ten_dang_nhap,
                ho_ten,
                mat_khau,
                email,
                so_dien_thoai,
                role,
                trang_thai,
                gioi_tinh,
                day_chuyen_id
            });
            return res.json({
                success: true,
                message: "Cập nhật tài khoản thành công",
                data
            });
        } catch (err) {
            next(err);
        }
    }

    static async xoaTaiKhoan(req, res, next) {
        try {
            const { id } = req.params;
            const nguoiDungHienTaiId = req.nguoiDung.id;
            const ketQua = await AdminService.xoaTaiKhoan(id, nguoiDungHienTaiId);
            return res.json({
                success: true,
                message: ketQua.message,
                data: null
            });
        } catch (err) {
            next(err);
        }
    }

    static async taiFileMauExcel(req, res, next) {
        try {
            const tieuDe = [
                "Ho va ten",
                "Email",
                "Ngay sinh (dd/mm/yyyy)",
                "Gioi tinh",
                "Ca lam",
                "Vai tro"
            ];

            const dongMauMinhHoa = [
                ["Nguyen Van A", "vana@gmail.com", "24/05/2004", "Nam", "Ca sang", "Nhan vien"],
                ["Tran Thi B", "thib@gmail.com", "15/11/1999", "Nu", "Ca chieu", "Nhan vien"]
            ];

            const duLieu = [tieuDe, ...dongMauMinhHoa];

            const sheet = XLSX.utils.aoa_to_sheet(duLieu);
            sheet["!cols"] = [
                { wch: 24 }, { wch: 26 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 16 }
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, sheet, "NhanVien");

            const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=mau_import_nhan_vien.xlsx"
            );
            return res.send(buffer);
        } catch (err) {
            next(new ApiError(500, "Không tạo được file mẫu, vui lòng thử lại"));
        }
    }

    static async nhapExcelNhanVien(req, res, next) {
        try {
            if (!req.file) {
                throw new ApiError(400, "Vui lòng chọn 1 file Excel để tải lên");
            }

            const ketQua = await AdminService.nhapTaiKhoanTuExcel(req.file.buffer);

            return res.json({
                success: true,
                message: `Đã xử lý ${ketQua.tong_so_dong} dòng: ${ketQua.so_thanh_cong} thành công, ${ketQua.so_loi} lỗi`,
                data: ketQua
            });
        } catch (err) {
            next(err);
        }
    }
}

export default AdminController;
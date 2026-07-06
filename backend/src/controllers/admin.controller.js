import * as adminService from "../services/admin.service.js";
import * as authService from "../services/auth.service.js";
import * as excelNhanVienService from "../services/excelNhanVien.service.js";
import * as XLSX from "xlsx";

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
        const { ten_dang_nhap, mat_khau, email, role, ho_ten, so_dien_thoai, gioi_tinh } = req.body;
        const data = await adminService.taoTaiKhoan({
            ten_dang_nhap,
            mat_khau,
            email,
            role,
            ho_ten,
            so_dien_thoai,
            gioi_tinh
        });
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

// POST /api/admin/tai-khoan/import-excel
export async function nhapTaiKhoanTuExcel(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng chọn 1 file Excel để tải lên"
            });
        }

        const ketQua = await adminService.nhapTaiKhoanTuExcel(req.file.buffer);

        return res.json({
            success: true,
            message: `Đã xử lý ${ketQua.tong_so_dong} dòng: ${ketQua.so_thanh_cong} thành công, ${ketQua.so_loi} lỗi`,
            data: ketQua
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message || "Lỗi server"
        });
    }
}

// POST /api/admin/tai-khoan/:id/cap-bac
export async function thayDoiCapBacTaiKhoan(req, res) {
    try {
        const { id } = req.params;
        const { huong } = req.body;
        const data = await adminService.capNhatCapBacTaiKhoan(id, huong);

        return res.json({
            success: true,
            message: "Đã cập nhật cấp bậc tài khoản",
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
        const { ten_dang_nhap, ho_ten, email, so_dien_thoai, role, trang_thai, mat_khau, gioi_tinh } = req.body;
        const data = await adminService.capNhatTaiKhoan(id, {
            ten_dang_nhap,
            ho_ten,
            mat_khau,
            email,
            so_dien_thoai,
            role,
            trang_thai,
            gioi_tinh
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

// GET /api/admin/nhan-vien/mau-excel
// Tự sinh file Excel mẫu ngay trong bộ nhớ và trả về, không cần lưu file thật nào trên server
export async function taiFileMauExcel(req, res) {
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

        // aoa = "array of arrays", mỗi mảng con tương ứng với 1 dòng trong file Excel
        const duLieu = [tieuDe, ...dongMauMinhHoa];

        const sheet = XLSX.utils.aoa_to_sheet(duLieu);
        sheet["!cols"] = [
            { wch: 24 }, { wch: 26 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 16 }
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, sheet, "NhanVien");

        // Ghi workbook ra buffer (dữ liệu nhị phân) thay vì ghi ra file trên ổ đĩa
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
        return res.status(500).json({
            success: false,
            message: "Không tạo được file mẫu, vui lòng thử lại"
        });
    }
}

// POST /api/admin/nhan-vien/nhap-excel
// Nhận 1 file Excel (field name = "file"), đọc từng dòng và tạo tài khoản + nhân viên tương ứng
export async function nhapExcelNhanVien(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng chọn 1 file Excel để tải lên"
            });
        }

        const ketQua = await excelNhanVienService.nhapNhanVienTuExcel(req.file.buffer);

        return res.json({
            success: true,
            message: `Đã xử lý ${ketQua.tong_so_dong} dòng: ${ketQua.so_thanh_cong} thành công, ${ketQua.so_loi} lỗi`,
            data: ketQua
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message || "Lỗi server"
        });
    }
}
import xlsx from "xlsx";
import pool from "../config/db.js";
import TaiKhoanModel from "../models/tai_khoan.model.js";
import { DANH_SACH_ROLE } from "./auth.service.js";
import bcrypt from "bcrypt";
import ApiError from "../utils/api_error.js";

/**
 * Service quản lý nghiệp vụ Admin
 */
class AdminService {
    static async layDanhSachTaiKhoan() {
        return await TaiKhoanModel.layTatCaTaiKhoan();
    }

    static async taoTaiKhoan({ ten_dang_nhap, mat_khau, email, role, ho_ten, so_dien_thoai, gioi_tinh, day_chuyen_id }) {
        if (!ten_dang_nhap || !mat_khau) {
            throw new ApiError(400, "Thiếu tên đăng nhập hoặc mật khẩu");
        }

        if (role && !DANH_SACH_ROLE.includes(role)) {
            throw new ApiError(400, "Vai trò không hợp lệ");
        }

        const daTonTai = await TaiKhoanModel.timTheoTenDangNhap(ten_dang_nhap);
        if (daTonTai) {
            throw new ApiError(409, "Tên đăng nhập đã tồn tại");
        }

        const soVongMaHoa = 10;
        const mat_khau_da_ma_hoa = await bcrypt.hash(mat_khau, soVongMaHoa);

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [kqTaiKhoan] = await connection.query(
                "INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, email, role, trang_thai) VALUES (?, ?, ?, ?, 1)",
                [ten_dang_nhap, mat_khau_da_ma_hoa, email || null, role || "NHAN_VIEN"]
            );
            const taiKhoanId = kqTaiKhoan.insertId;

            const [rows] = await connection.query(
                `SELECT ma_nhan_vien FROM nhan_vien WHERE ma_nhan_vien LIKE 'DP%' ORDER BY id DESC`
            );
            let soLonNhat = 0;
            for (const row of rows) {
                const soTrongMa = parseInt((row.ma_nhan_vien || "").replace("DP", ""), 10);
                if (!isNaN(soTrongMa) && soTrongMa > soLonNhat) soLonNhat = soTrongMa;
            }
            const maNhanVien = `DP${soLonNhat + 1}`;

            await connection.query(
                `INSERT INTO nhan_vien (ma_nhan_vien, ho_ten, gioi_tinh, so_dien_thoai, ngay_vao_lam, tai_khoan_id, chuc_vu, trang_thai, day_chuyen_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'DANG_LAM', ?)`,
                [
                    maNhanVien,
                    ho_ten || ten_dang_nhap,
                    gioi_tinh || "Khac",
                    so_dien_thoai || null,
                    new Date(),
                    taiKhoanId,
                    role || "NHAN_VIEN",
                    day_chuyen_id || null
                ]
            );

            await connection.commit();
            return { id: taiKhoanId, ten_dang_nhap, email, role: role || "NHAN_VIEN" };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    static async capNhatTaiKhoan(id, { ten_dang_nhap, mat_khau, email, role, trang_thai, ho_ten, so_dien_thoai, gioi_tinh, day_chuyen_id }) {
        if (!ten_dang_nhap) {
            throw new ApiError(400, "Tên đăng nhập không được để trống");
        }

        if (role && !DANH_SACH_ROLE.includes(role)) {
            throw new ApiError(400, "Vai trò (role) không hợp lệ");
        }

        const taiKhoanHienTai = await TaiKhoanModel.timTheoId(id);
        if (!taiKhoanHienTai) {
            throw new ApiError(404, "Không tìm thấy tài khoản");
        }

        if (ten_dang_nhap !== taiKhoanHienTai.ten_dang_nhap) {
            const daTonTai = await TaiKhoanModel.timTheoTenDangNhap(ten_dang_nhap);
            if (daTonTai) {
                throw new ApiError(409, "Tên đăng nhập đã tồn tại trong hệ thống");
            }
        }

        let mat_khau_da_ma_hoa = null;
        if (mat_khau && mat_khau.trim() !== "") {
            const soVongMaHoa = 10;
            mat_khau_da_ma_hoa = await bcrypt.hash(mat_khau, soVongMaHoa);
        }

        const thanhCong = await TaiKhoanModel.capNhatTaiKhoan(id, {
            ten_dang_nhap,
            email,
            role: role || taiKhoanHienTai.role,
            trang_thai: trang_thai !== undefined ? trang_thai : taiKhoanHienTai.trang_thai,
            mat_khau_da_ma_hoa,
            ho_ten: ho_ten || taiKhoanHienTai.ho_ten,
            so_dien_thoai: so_dien_thoai || taiKhoanHienTai.so_dien_thoai,
            gioi_tinh: gioi_tinh || taiKhoanHienTai.gioi_tinh,
            day_chuyen_id: day_chuyen_id !== undefined ? day_chuyen_id : taiKhoanHienTai.day_chuyen_id
        });

        if (thanhCong) {
            await AdminService._dongBoChucVuNhanVien(id, role || taiKhoanHienTai.role);
        } else {
            throw new ApiError(500, "Cập nhật thất bại");
        }

        return {
            id,
            ten_dang_nhap,
            email,
            role: role || taiKhoanHienTai.role,
            trang_thai: trang_thai !== undefined ? trang_thai : taiKhoanHienTai.trang_thai
        };
    }

    static async _dongBoChucVuNhanVien(taiKhoanId, role) {
        await pool.query(
            "UPDATE nhan_vien SET chuc_vu = ? WHERE tai_khoan_id = ?",
            [role, taiKhoanId]
        );
    }

    static async capNhatCapBacTaiKhoan(id, huong) {
        const taiKhoan = await TaiKhoanModel.timTheoId(id);
        if (!taiKhoan) {
            throw new ApiError(404, "Không tìm thấy tài khoản");
        }

        const roleHienTai = taiKhoan.role;
        let roleMoi = roleHienTai;

        if (huong === "THANG_CAP") {
            if (roleHienTai === "NHAN_VIEN") roleMoi = "LEADER_LINE";
            else if (roleHienTai === "LEADER_LINE") roleMoi = "LEADER_KHU_VUC";
            else if (roleHienTai === "LEADER_KHU_VUC") roleMoi = "ADMIN";
        } else if (huong === "HA_CAP") {
            if (roleHienTai === "ADMIN") roleMoi = "LEADER_KHU_VUC";
            else if (roleHienTai === "LEADER_KHU_VUC") roleMoi = "LEADER_LINE";
            else if (roleHienTai === "LEADER_LINE") roleMoi = "NHAN_VIEN";
        }

        if (roleMoi === roleHienTai) {
            throw new ApiError(400, "Không thể thăng/hạ cấp vai trò này thêm nữa");
        }

        await pool.query("UPDATE tai_khoan SET role = ? WHERE id = ?", [roleMoi, id]);
        await AdminService._dongBoChucVuNhanVien(id, roleMoi);

        return { id, role: roleMoi };
    }

    static async xoaTaiKhoan(id, idNguoiDungHienTai) {
        if (Number(id) === Number(idNguoiDungHienTai)) {
            throw new ApiError(400, "Bạn không thể tự xóa tài khoản của chính mình");
        }

        const taiKhoan = await TaiKhoanModel.timTheoId(id);
        if (!taiKhoan) {
            throw new ApiError(404, "Không tìm thấy tài khoản");
        }

        await TaiKhoanModel.huyLienKetNhanVien(id);

        const thanhCong = await TaiKhoanModel.xoaTaiKhoan(id);
        if (!thanhCong) {
            throw new ApiError(500, "Không thể xóa tài khoản");
        }

        return { success: true, message: "Đã xóa tài khoản thành công" };
    }

    static _layGiaTriCot(row, danhSachKhoa) {
        for (const khoa of danhSachKhoa) {
            if (row[khoa] !== undefined) return row[khoa];
        }
        const cacKhoaTrongExcel = Object.keys(row);
        for (const khoa of danhSachKhoa) {
            const timKhop = cacKhoaTrongExcel.find(k => k.toLowerCase().trim() === khoa.toLowerCase().trim());
            if (timKhop) return row[timKhop];
        }
        return null;
    }

    static _taoMatKhauTuNgaySinh(ngaySinh) {
        if (!ngaySinh) {
            return "123456";
        }

        if (typeof ngaySinh === "number") {
            const date = new Date((ngaySinh - 25569) * 86400 * 1000);
            return AdminService._dinhDangMatKhauTuDate(date);
        }

        const chuoi = String(ngaySinh).trim();

        const phanTachSlash = chuoi.split("/");
        if (phanTachSlash.length === 3) {
            const ngay = phanTachSlash[0].padStart(2, '0');
            const thang = phanTachSlash[1].padStart(2, '0');
            const nam = phanTachSlash[2].slice(-2);
            return `${ngay}${thang}${nam}`;
        }

        const phanTachDash = chuoi.split("-");
        if (phanTachDash.length === 3) {
            if (phanTachDash[0].length === 4) {
                const nam = phanTachDash[0].slice(-2);
                const thang = phanTachDash[1].padStart(2, '0');
                const ngay = phanTachDash[2].padStart(2, '0');
                return `${ngay}${thang}${nam}`;
            } else {
                const ngay = phanTachDash[0].padStart(2, '0');
                const thang = phanTachDash[1].padStart(2, '0');
                const nam = phanTachDash[2].slice(-2);
                return `${ngay}${thang}${nam}`;
            }
        }

        const d = new Date(chuoi);
        if (!isNaN(d.getTime())) {
            return AdminService._dinhDangMatKhauTuDate(d);
        }

        return "123456";
    }

    static _dinhDangMatKhauTuDate(date) {
        const ngay = String(date.getDate()).padStart(2, '0');
        const thang = String(date.getMonth() + 1).padStart(2, '0');
        const nam = String(date.getFullYear()).slice(-2);
        return `${ngay}${thang}${nam}`;
    }

    static _chuanHoaGioiTinh(gt) {
        if (!gt) return "Khac";
        const str = String(gt).trim().toLowerCase();
        if (str.startsWith("nam")) return "Nam";
        if (str.startsWith("nữ") || str.startsWith("nu")) return "Nu";
        return "Khac";
    }

    static _chuanHoaVaiTro(vaiTroText) {
        const text = (vaiTroText || "").toString().trim().toLowerCase();
        if (text.includes("leader") && text.includes("khu")) return "LEADER_KHU_VUC";
        if (text.includes("leader")) return "LEADER_LINE";
        if (text.includes("admin")) return "ADMIN";
        return "NHAN_VIEN";
    }

    static async nhapTaiKhoanTuExcel(fileBuffer) {
        const workbook = xlsx.read(fileBuffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(worksheet);

        if (rows.length === 0) {
            throw new ApiError(400, "Tệp Excel không chứa dữ liệu hoặc sai định dạng");
        }

        const [existing] = await pool.query(
            "SELECT ma_nhan_vien FROM nhan_vien WHERE ma_nhan_vien LIKE 'DP%'"
        );
        let maxNum = 0;
        existing.forEach(row => {
            const code = row.ma_nhan_vien;
            let numPart = "";
            if (code.startsWith("DP_")) {
                numPart = code.substring(3);
            } else if (code.startsWith("DP")) {
                numPart = code.substring(2);
            }
            const num = parseInt(numPart, 10);
            if (!isNaN(num) && num > maxNum) {
                maxNum = num;
            }
        });

        let currentIdx = maxNum + 1;
        const loiList = [];
        let soThanhCong = 0;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const hoTen = AdminService._layGiaTriCot(row, ["Họ tên", "Ho ten", "Họ và tên", "Ho va ten", "Name", "Full Name", "ho_ten"]);
                
                if (!hoTen || String(hoTen).trim() === "") {
                    continue;
                }

                const gioiTinh = AdminService._chuanHoaGioiTinh(AdminService._layGiaTriCot(row, ["Giới tính", "Gioi tinh", "Gender", "gioi_tinh"]));
                const soDienThoai = AdminService._layGiaTriCot(row, ["Số điện thoại", "So dien thoai", "SĐT", "SDT", "Phone", "Phone Number", "so_dien_thoai"]);
                const ngaySinh = AdminService._layGiaTriCot(row, ["Ngày sinh", "Ngay sinh", "DOB", "Date of Birth", "ngay_sinh", "birthday"]);
                const email = AdminService._layGiaTriCot(row, ["Email", "Thư điện tử", "email"]);
                const ngayVaoLamRaw = AdminService._layGiaTriCot(row, ["Ngày vào làm", "Ngay vao lam", "Ngay vao viec", "Joining Date", "ngay_vao_lam"]);
                const vaiTroRaw = AdminService._layGiaTriCot(row, ["Vai trò", "Vai tro", "Role", "vai_tro", "Vai tro"]);

                let ngayVaoLam = new Date();
                if (ngayVaoLamRaw) {
                    if (typeof ngayVaoLamRaw === "number") {
                        ngayVaoLam = new Date((ngayVaoLamRaw - 25569) * 86400 * 1000);
                    } else {
                        const tempDate = new Date(ngayVaoLamRaw);
                        if (!isNaN(tempDate.getTime())) {
                            ngayVaoLam = tempDate;
                        }
                    }
                }

                try {
                    const maNhanVien = `DP${currentIdx}`;
                    const matKhauMacDinh = AdminService._taoMatKhauTuNgaySinh(ngaySinh);
                    const matKhauDaMaHoa = await bcrypt.hash(matKhauMacDinh, 10);
                    const tenDangNhap = maNhanVien.toLowerCase();
                    const role = AdminService._chuanHoaVaiTro(vaiTroRaw);

                    const [trungUsername] = await connection.query(
                        "SELECT id FROM tai_khoan WHERE ten_dang_nhap = ?",
                        [tenDangNhap]
                    );
                    if (trungUsername.length > 0) {
                        throw new Error(`Tên đăng nhập ${tenDangNhap} đã tồn tại trong cơ sở dữ liệu`);
                    }

                    const [kqTaiKhoan] = await connection.query(
                        "INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, email, role, trang_thai) VALUES (?, ?, ?, ?, 1)",
                        [tenDangNhap, matKhauDaMaHoa, email || null, role]
                    );
                    const taiKhoanId = kqTaiKhoan.insertId;

                    await connection.query(
                        "INSERT INTO nhan_vien (ma_nhan_vien, ho_ten, gioi_tinh, so_dien_thoai, ngay_vao_lam, tai_khoan_id, chuc_vu, trang_thai) VALUES (?, ?, ?, ?, ?, ?, ?, 'DANG_LAM')",
                        [maNhanVien, hoTen, gioiTinh, soDienThoai ? String(soDienThoai) : null, ngayVaoLam, taiKhoanId, role]
                    );

                    currentIdx++;
                    soThanhCong++;
                } catch (errRow) {
                    loiList.push({
                        dong: i + 2,
                        nhanVien: hoTen,
                        loi: errRow.message
                    });
                }
            }

            await connection.commit();
        } catch (errTx) {
            await connection.rollback();
            throw errTx;
        } finally {
            connection.release();
        }

        return {
            tong_so_dong: soThanhCong + loiList.length,
            so_thanh_cong: soThanhCong,
            so_loi: loiList.length,
            loi: loiList
        };
    }
}

export const nhapNhanVienTuExcel = AdminService.nhapTaiKhoanTuExcel;
export default AdminService;

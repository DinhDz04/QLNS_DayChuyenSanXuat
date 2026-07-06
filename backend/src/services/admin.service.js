
import xlsx from "xlsx";
import pool from "../config/db.js";
import * as taiKhoanModel from "../models/taiKhoan.model.js";
import { DANH_SACH_ROLE } from "./auth.service.js";
import bcrypt from "bcrypt";

/**
 * Lấy tất cả tài khoản
 */
export async function layDanhSachTaiKhoan() {
    return await taiKhoanModel.layTatCaTaiKhoan();
}

/**
 * Tạo tài khoản mới kèm theo thông tin nhân viên
 */
export async function taoTaiKhoan({ ten_dang_nhap, mat_khau, email, role, ho_ten, so_dien_thoai, gioi_tinh }) {
    if (!ten_dang_nhap || !mat_khau) {
        const loi = new Error("Thiếu tên đăng nhập hoặc mật khẩu");
        loi.statusCode = 400;
        throw loi;
    }

    if (role && !DANH_SACH_ROLE.includes(role)) {
        const loi = new Error("Vai trò không hợp lệ");
        loi.statusCode = 400;
        throw loi;
    }

    const daTonTai = await taiKhoanModel.timTheoTenDangNhap(ten_dang_nhap);
    if (daTonTai) {
        const loi = new Error("Tên đăng nhập đã tồn tại");
        loi.statusCode = 409;
        throw loi;
    }

    const soVongMaHoa = 10;
    const mat_khau_da_ma_hoa = await bcrypt.hash(mat_khau, soVongMaHoa);

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Tạo tai_khoan
        const [kqTaiKhoan] = await connection.query(
            "INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, email, role, trang_thai) VALUES (?, ?, ?, ?, 1)",
            [ten_dang_nhap, mat_khau_da_ma_hoa, email || null, role || "NHAN_VIEN"]
        );
        const taiKhoanId = kqTaiKhoan.insertId;

        // 2. Tạo nhan_vien
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
            `INSERT INTO nhan_vien (ma_nhan_vien, ho_ten, gioi_tinh, so_dien_thoai, ngay_vao_lam, tai_khoan_id, chuc_vu, trang_thai) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'DANG_LAM')`,
            [
                maNhanVien,
                ho_ten || ten_dang_nhap,
                gioi_tinh || "Khac",
                so_dien_thoai || null,
                new Date(),
                taiKhoanId,
                role || "NHAN_VIEN"
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

/**
 * Cập nhật tài khoản
 */
export async function capNhatTaiKhoan(id, { ten_dang_nhap, mat_khau, email, role, trang_thai, ho_ten, so_dien_thoai, gioi_tinh }) {
    if (!ten_dang_nhap) {
        const loi = new Error("Tên đăng nhập không được để trống");
        loi.statusCode = 400;
        throw loi;
    }

    if (role && !DANH_SACH_ROLE.includes(role)) {
        const loi = new Error("Vai trò (role) không hợp lệ");
        loi.statusCode = 400;
        throw loi;
    }

    const taiKhoanHienTai = await taiKhoanModel.timTheoId(id);
    if (!taiKhoanHienTai) {
        const loi = new Error("Không tìm thấy tài khoản");
        loi.statusCode = 404;
        throw loi;
    }

    if (ten_dang_nhap !== taiKhoanHienTai.ten_dang_nhap) {
        const daTonTai = await taiKhoanModel.timTheoTenDangNhap(ten_dang_nhap);
        if (daTonTai) {
            const loi = new Error("Tên đăng nhập đã tồn tại trong hệ thống");
            loi.statusCode = 409;
            throw loi;
        }
    }

    let mat_khau_da_ma_hoa = null;
    if (mat_khau && mat_khau.trim() !== "") {
        const soVongMaHoa = 10;
        mat_khau_da_ma_hoa = await bcrypt.hash(mat_khau, soVongMaHoa);
    }

    const thanhCong = await taiKhoanModel.capNhatTaiKhoan(id, {
        ten_dang_nhap,
        email,
        role: role || taiKhoanHienTai.role,
        trang_thai: trang_thai !== undefined ? trang_thai : taiKhoanHienTai.trang_thai,
        mat_khau_da_ma_hoa,
        ho_ten: ho_ten || taiKhoanHienTai.ho_ten,
        so_dien_thoai: so_dien_thoai || taiKhoanHienTai.so_dien_thoai,
        gioi_tinh: gioi_tinh || taiKhoanHienTai.gioi_tinh
    });

    if (thanhCong) {
        await dongBoChucVuNhanVien(id, role || taiKhoanHienTai.role);
    }

    if (!thanhCong) {
        const loi = new Error("Cập nhật thất bại");
        loi.statusCode = 500;
        throw loi;
    }

    return {
        id,
        ten_dang_nhap,
        email,
        role: role || taiKhoanHienTai.role,
        trang_thai: trang_thai !== undefined ? trang_thai : taiKhoanHienTai.trang_thai
    };
}

async function dongBoChucVuNhanVien(taiKhoanId, role) {
    await pool.query(
        "UPDATE nhan_vien SET chuc_vu = ? WHERE tai_khoan_id = ?",
        [role, taiKhoanId]
    );
}

/**
 * Thăng cấp / hạ cấp vai trò
 */
export async function capNhatCapBacTaiKhoan(id, huong) {
    const taiKhoan = await taiKhoanModel.timTheoId(id);
    if (!taiKhoan) {
        const loi = new Error("Không tìm thấy tài khoản");
        loi.statusCode = 404;
        throw loi;
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
        const loi = new Error("Không thể thăng/hạ cấp vai trò này thêm nữa");
        loi.statusCode = 400;
        throw loi;
    }

    // Cập nhật role ở bảng tai_khoan
    await pool.query("UPDATE tai_khoan SET role = ? WHERE id = ?", [roleMoi, id]);
    
    // Đồng bộ chức vụ ở bảng nhan_vien
    await dongBoChucVuNhanVien(id, roleMoi);

    return { id, role: roleMoi };
}

/**
 * Xóa tài khoản
 */
export async function xoaTaiKhoan(id, idNguoiDungHienTai) {
    if (Number(id) === Number(idNguoiDungHienTai)) {
        const loi = new Error("Bạn không thể tự xóa tài khoản của chính mình");
        loi.statusCode = 400;
        throw loi;
    }

    const taiKhoan = await taiKhoanModel.timTheoId(id);
    if (!taiKhoan) {
        const loi = new Error("Không tìm thấy tài khoản");
        loi.statusCode = 404;
        throw loi;
    }

    // Hủy liên kết ở bảng nhan_vien trước để tránh lỗi ràng buộc khóa ngoại (RESTRICT)
    await taiKhoanModel.huyLienKetNhanVien(id);

    const thanhCong = await taiKhoanModel.xoaTaiKhoan(id);
    if (!thanhCong) {
        const loi = new Error("Không thể xóa tài khoản");
        loi.statusCode = 500;
        throw loi;
    }

    return { success: true, message: "Đã xóa tài khoản thành công" };
}

/**
 * Hàm hỗ trợ lấy giá trị của cột trong Excel theo danh sách các khóa có thể khớp
 */
function layGiaTriCot(row, danhSachKhoa) {
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

/**
 * Hàm tạo mật khẩu mặc định từ ngày sinh (6 số dạng DDMMYY)
 */
function taoMatKhauTuNgaySinh(ngaySinh) {
    if (!ngaySinh) {
        return "123456"; // Mật khẩu mặc định nếu không có ngày sinh
    }

    // Nếu Excel trả về dạng số (Serial Date)
    if (typeof ngaySinh === "number") {
        const date = new Date((ngaySinh - 25569) * 86400 * 1000);
        return dinhDangMatKhauTuDate(date);
    }

    const chuoi = String(ngaySinh).trim();

    // Dạng DD/MM/YYYY hoặc D/M/YYYY
    const phanTachSlash = chuoi.split("/");
    if (phanTachSlash.length === 3) {
        const ngay = phanTachSlash[0].padStart(2, '0');
        const thang = phanTachSlash[1].padStart(2, '0');
        const nam = phanTachSlash[2].slice(-2);
        return `${ngay}${thang}${nam}`;
    }

    // Dạng YYYY-MM-DD hoặc DD-MM-YYYY
    const phanTachDash = chuoi.split("-");
    if (phanTachDash.length === 3) {
        if (phanTachDash[0].length === 4) {
            // YYYY-MM-DD
            const nam = phanTachDash[0].slice(-2);
            const thang = phanTachDash[1].padStart(2, '0');
            const ngay = phanTachDash[2].padStart(2, '0');
            return `${ngay}${thang}${nam}`;
        } else {
            // DD-MM-YYYY
            const ngay = phanTachDash[0].padStart(2, '0');
            const thang = phanTachDash[1].padStart(2, '0');
            const nam = phanTachDash[2].slice(-2);
            return `${ngay}${thang}${nam}`;
        }
    }

    // Thử parse bằng hàm Date mặc định của JS
    const d = new Date(chuoi);
    if (!isNaN(d.getTime())) {
        return dinhDangMatKhauTuDate(d);
    }

    return "123456"; // Mật khẩu mặc định nếu parse thất bại
}

function dinhDangMatKhauTuDate(date) {
    const ngay = String(date.getDate()).padStart(2, '0');
    const thang = String(date.getMonth() + 1).padStart(2, '0');
    const nam = String(date.getFullYear()).slice(-2);
    return `${ngay}${thang}${nam}`;
}

/**
 * Chuẩn hóa giới tính
 */
function chuanHoaGioiTinh(gt) {
    if (!gt) return "Khac";
    const str = String(gt).trim().toLowerCase();
    if (str.startsWith("nam")) return "Nam";
    if (str.startsWith("nữ") || str.startsWith("nu")) return "Nu";
    return "Khac";
}

/**
 * Hàm nhập dữ liệu nhân viên & tài khoản từ tệp Excel
 */
export async function nhapTaiKhoanTuExcel(fileBuffer) {
    // 1. Đọc workbook từ buffer
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    if (rows.length === 0) {
        const loi = new Error("Tệp Excel không chứa dữ liệu hoặc sai định dạng");
        loi.statusCode = 400;
        throw loi;
    }

    // 2. Tìm mã nhân viên lớn nhất hiện tại để thực hiện tự tăng mã dạng D4_
    const [existing] = await pool.query(
        "SELECT ma_nhan_vien FROM nhan_vien WHERE ma_nhan_vien LIKE 'D4%'"
    );
    let maxNum = 0;
    existing.forEach(row => {
        const code = row.ma_nhan_vien;
        let numPart = "";
        if (code.startsWith("D4_")) {
            numPart = code.substring(3);
        } else if (code.startsWith("D4")) {
            numPart = code.substring(2);
        }
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
            maxNum = num;
        }
    });

    let currentIdx = maxNum + 1;
    const ketQuaImport = {
        tongCong: rows.length,
        thanhCong: 0,
        loi: []
    };

    // 3. Thực thi transaction để đảm bảo toàn vẹn dữ liệu
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const hoTen = layGiaTriCot(row, ["Họ tên", "Ho ten", "Họ và tên", "Ho va ten", "Name", "Full Name", "ho_ten"]);
            
            // Bỏ qua dòng trống
            if (!hoTen || String(hoTen).trim() === "") {
                ketQuaImport.tongCong--;
                continue;
            }

            const gioiTinh = chuanHoaGioiTinh(layGiaTriCot(row, ["Giới tính", "Gioi tinh", "Gender", "gioi_tinh"]));
            const soDienThoai = layGiaTriCot(row, ["Số điện thoại", "So dien thoai", "SĐT", "SDT", "Phone", "Phone Number", "so_dien_thoai"]);
            const ngaySinh = layGiaTriCot(row, ["Ngày sinh", "Ngay sinh", "DOB", "Date of Birth", "ngay_sinh", "birthday"]);
            const email = layGiaTriCot(row, ["Email", "Thư điện tử", "email"]);
            const ngayVaoLamRaw = layGiaTriCot(row, ["Ngày vào làm", "Ngay vao lam", "Ngay vao viec", "Joining Date", "ngay_vao_lam"]);
            const caLam = layGiaTriCot(row, ["Ca làm", "Ca lam", "Shift", "ca_lam"]);
            const sodienthoai = String(layGiaTriCot(row, ["so_dien_thoai", "So dien thoai", "sdt", "SĐT", "SDT", "phone", "Phone"]) || "").trim();

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
                // Tự tăng mã nhân viên: D4_01, D4_02,... D4_10
                const maNhanVien = `DP_${String(currentIdx).padStart(2, '0')}`;
                
                // Mật khẩu mặc định từ ngày sinh (DDMMYY)
                const matKhauMacDinh = taoMatKhauTuNgaySinh(ngaySinh);
                const matKhauDaMaHoa = await bcrypt.hash(matKhauMacDinh, 10);
                
                // Tên đăng nhập mặc định: viết thường của mã nhân viên (d4_01)
                const tenDangNhap = maNhanVien.toLowerCase();

                // Kiểm tra tên đăng nhập đã tồn tại trong DB chưa (phòng hờ)
                const [trungUsername] = await connection.query(
                    "SELECT id FROM tai_khoan WHERE ten_dang_nhap = ?",
                    [tenDangNhap]
                );
                if (trungUsername.length > 0) {
                    throw new Error(`Tên đăng nhập ${tenDangNhap} đã tồn tại trong cơ sở dữ liệu`);
                }

                // A. Tạo tài khoản
                const [kqTaiKhoan] = await connection.query(
                    "INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, email, role, trang_thai) VALUES (?, ?, ?, 'NHAN_VIEN', 1)",
                    [tenDangNhap, matKhauDaMaHoa, email || null]
                );
                const taiKhoanId = kqTaiKhoan.insertId;

                // B. Tạo nhân viên liên kết
                await connection.query(
                    "INSERT INTO nhan_vien (ma_nhan_vien, ho_ten, gioi_tinh, so_dien_thoai, ngay_vao_lam, tai_khoan_id, chuc_vu, trang_thai) VALUES (?, ?, ?, ?, ?, ?, 'NHAN_VIEN', 'DANG_LAM')",
                    [maNhanVien, hoTen, gioiTinh, soDienThoai ? String(soDienThoai) : null, ngayVaoLam, taiKhoanId]
                );

                currentIdx++;
                ketQuaImport.thanhCong++;
            } catch (errRow) {
                ketQuaImport.loi.push({
                    dong: i + 2, // Excel thường bắt đầu từ dòng 2 (bỏ qua header)
                    nhanVien: hoTen,
                    loi: errRow.message
                });
            }
        }

        // Commit transaction nếu không có lỗi hệ thống nghiêm trọng
        await connection.commit();
    } catch (errTx) {
        await connection.rollback();
        throw errTx;
    } finally {
        connection.release();
    }

    return ketQuaImport;
}


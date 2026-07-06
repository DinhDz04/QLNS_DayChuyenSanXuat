import * as XLSX from "xlsx";
import pool from "../config/db.js";
import * as authService from "./auth.service.js";

function chuanHoaVaiTro(vaiTroText) {
    const text = (vaiTroText || "").toString().trim().toLowerCase();
    if (text.includes("leader") && text.includes("khu")) return "LEADER_KHU_VUC";
    if (text.includes("leader")) return "LEADER_LINE";
    if (text.includes("admin")) return "ADMIN";
    return "NHAN_VIEN";
}

function chuyenRoleSangChucVu(role) {
    if (role === "LEADER_KHU_VUC" || role === "LEADER_LINE") return role;
    return "NHAN_VIEN";
}

function docNgay(giaTri) {
    if (!giaTri) return null;
    if (giaTri instanceof Date) return giaTri;

    if (typeof giaTri === "number") {
        const ngayGoc = new Date(1899, 11, 30);
        ngayGoc.setDate(ngayGoc.getDate() + giaTri);
        return ngayGoc;
    }

    const chuoi = giaTri.toString().trim();
    const phan = chuoi.split(/[\/-]/);
    if (phan.length === 3) {
        const [ngay, thang, nam] = phan.map((x) => parseInt(x, 10));
        if (!isNaN(ngay) && !isNaN(thang) && !isNaN(nam)) {
            return new Date(nam, thang - 1, ngay);
        }
    }
    return null;
}

function dinhDangYYYYMMDD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function taoMatKhauTuNgaySinh(ngaySinh) {
    if (!ngaySinh) return "123456";

    const ngay = String(ngaySinh.getDate()).padStart(2, "0");
    const thang = String(ngaySinh.getMonth() + 1).padStart(2, "0");
    const nam = String(ngaySinh.getFullYear());
    return `${ngay}${thang}${nam}`;
}

async function layMaNhanVienTiepTheo() {
    const [rows] = await pool.query(
        `SELECT ma_nhan_vien FROM nhan_vien WHERE ma_nhan_vien LIKE 'DP%' ORDER BY id DESC`
    );

    let soLonNhat = 0;
    for (const row of rows) {
        const soTrongMa = parseInt((row.ma_nhan_vien || "").replace("DP", ""), 10);
        if (!isNaN(soTrongMa) && soTrongMa > soLonNhat) soLonNhat = soTrongMa;
    }

    const soTiepTheo = soLonNhat + 1;
    return `DP${soTiepTheo}`;
}

async function timCaLamId(tenCa) {
    if (!tenCa) return null;
    const [rows] = await pool.query(
        `SELECT id FROM ca_lam_viec WHERE LOWER(ten_ca) = LOWER(?) LIMIT 1`,
        [tenCa.toString().trim()]
    );
    return rows.length > 0 ? rows[0].id : null;
}

function chuanHoaGioiTinh(value) {
    const text = (value || "").toString().trim().toLowerCase();
    if (["nam", "male", "m"].includes(text)) return "Nam";
    if (["nu", "female", "f", "nữ"].includes(text)) return "Nu";
    return "Khac";
}

export async function nhapNhanVienTuExcel(fileBuffer) {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const tenSheetDauTien = workbook.SheetNames[0];
    const sheet = workbook.Sheets[tenSheetDauTien];
    const danhSachDong = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const ketQuaThanhCong = [];
    const ketQuaLoi = [];

    for (let i = 0; i < danhSachDong.length; i++) {
        const dong = danhSachDong[i];
        const soThuTuDong = i + 2;

        try {
            const hoTen = (dong["Ho va ten"] || dong["Họ và tên"] || dong["Họ tên"] || "").toString().trim();
            if (!hoTen) throw new Error("Thiếu Họ và tên");

            const ngaySinh = docNgay(dong["Ngay sinh (dd/mm/yyyy)"] || dong["Ngay sinh"] || dong["DOB"]);
            if (!ngaySinh) throw new Error("Ngày sinh không hợp lệ");

            const email = (dong["Email"] || "").toString().trim() || null;
            const gioiTinh = chuanHoaGioiTinh(dong["Gioi tinh"] || dong["Giới tính"] || dong["Gender"]);
            const caLamId = await timCaLamId(dong["Ca lam"] || dong["Ca làm"] || dong["Shift"]);
            const role = chuanHoaVaiTro(dong["Vai tro"] || dong["Vai trò"] || dong["Role"]);
            const chucVu = chuyenRoleSangChucVu(role);

            const maNhanVien = await layMaNhanVienTiepTheo();
            const tenDangNhap = maNhanVien.toLowerCase();
            const matKhauMacDinh = taoMatKhauTuNgaySinh(ngaySinh);
            const roleMacDinh = "NHAN_VIEN";

            const taiKhoanMoi = await authService.dangKy({
                ten_dang_nhap: tenDangNhap,
                mat_khau: matKhauMacDinh,
                email,
                role: roleMacDinh
            });

            await pool.query(
                `INSERT INTO nhan_vien (ma_nhan_vien, ho_ten, gioi_tinh, ngay_vao_lam, tai_khoan_id, chuc_vu, trang_thai) VALUES (?, ?, ?, ?, ?, ?, 'DANG_LAM')`,
                [
                    maNhanVien,
                    hoTen,
                    gioiTinh,
                    dinhDangYYYYMMDD(new Date()),
                    taiKhoanMoi.id,
                    chucVu
                ]
            );

            if (caLamId) {
                await pool.query(
                    `UPDATE nhan_vien SET day_chuyen_id = ? WHERE id = ?`,
                    [caLamId, maNhanVien]
                );
            }

            ketQuaThanhCong.push({
                dong: soThuTuDong,
                ma_nhan_vien: maNhanVien,
                ho_ten: hoTen,
                ten_dang_nhap: tenDangNhap,
                mat_khau_mac_dinh: matKhauMacDinh
            });
        } catch (err) {
            ketQuaLoi.push({
                dong: soThuTuDong,
                ho_ten: (dong["Ho va ten"] || "(trống)").toString(),
                loi: err.message
            });
        }
    }

    return {
        tong_so_dong: danhSachDong.length,
        so_thanh_cong: ketQuaThanhCong.length,
        so_loi: ketQuaLoi.length,
        thanh_cong: ketQuaThanhCong,
        loi: ketQuaLoi
    };
}

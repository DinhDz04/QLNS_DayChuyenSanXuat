import NhanVienModel from "../models/nhan_vien.model.js";

/**
 * Service xử lý nghiệp vụ liên quan đến nhân viên
 */
class NhanVienService {
    static async layDanhSachNhanVien(boLoc) {
        return await NhanVienModel.layDanhSachNhanVien(boLoc);
    }

    static async layChungChiNhanVien(nhanVienId) {
        return await NhanVienModel.layChungChiNhanVien(nhanVienId);
    }

    static async layLichSuPhanCong(nhanVienId) {
        return await NhanVienModel.layLichSuPhanCong(nhanVienId);
    }

    static async capNhatNhanVien(id, duLieu) {
        return await NhanVienModel.capNhatNhanVien(id, duLieu);
    }

    static async xoaNhanVien(id) {
        return await NhanVienModel.xoaNhanVien(id);
    }
}

export default NhanVienService;

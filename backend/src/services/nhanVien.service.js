import * as nhanVienModel from "../models/nhanVien.model.js";

/**
 * Service xử lý nghiệp vụ liên quan đến nhân viên
 */

export async function layDanhSachNhanVien(boLoc) {
    return await nhanVienModel.layDanhSachNhanVien(boLoc);
}

export async function layChungChiNhanVien(nhanVienId) {
    return await nhanVienModel.layChungChiNhanVien(nhanVienId);
}

export async function capNhatNhanVien(id, duLieu) {
    return await nhanVienModel.capNhatNhanVien(id, duLieu);
}

export async function xoaNhanVien(id) {
    return await nhanVienModel.xoaNhanVien(id);
}

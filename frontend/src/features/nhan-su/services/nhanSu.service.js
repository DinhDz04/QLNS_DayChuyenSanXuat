import { goiApi } from "../../../services/api.js";

export function layDanhSachTaiKhoan() {
    return goiApi("/admin/tai-khoan");
}

export function taoTaiKhoanAdmin(duLieu) {
    return goiApi("/admin/tai-khoan", {
        method: "POST",
        body: JSON.stringify(duLieu)
    });
}

export function capNhatTaiKhoanAdmin(id, duLieu) {
    return goiApi(`/admin/tai-khoan/${id}`, {
        method: "PUT",
        body: JSON.stringify(duLieu)
    });
}

export function capNhatCapBacTaiKhoanAdmin(id, huong) {
    return goiApi(`/admin/tai-khoan/${id}/cap-bac`, {
        method: "POST",
        body: JSON.stringify({ huong })
    });
}

export function xoaTaiKhoanAdmin(id) {
    return goiApi(`/admin/tai-khoan/${id}`, {
        method: "DELETE"
    });
}

export function layLichSuPhanCong(nhanVienId) {
    return goiApi(`/nhan-vien/${nhanVienId}/lich-su`);
}

export function layLichSuHeThong() {
    return goiApi("/admin/lich-su");
}

export function ganCaLamHangLoat(taiKhoanIds, caLamId) {
    return goiApi("/admin/tai-khoan/batch-ca-lam", {
        method: "POST",
        body: JSON.stringify({ tai_khoan_ids: taiKhoanIds, ca_lam_id: caLamId })
    });
}

export function nhapTaiKhoanTuExcel(file) {
    const formData = new FormData();
    formData.append("file", file);

    return goiApi("/admin/nhan-vien/nhap-excel", {
        method: "POST",
        body: formData
    });
}

export async function taiFileMauExcel() {
    const blob = await goiApi("/admin/nhan-vien/mau-excel");

    if (!(blob instanceof Blob)) {
        throw new Error("Không thể tải file mẫu Excel");
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mau_import_nhan_vien.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

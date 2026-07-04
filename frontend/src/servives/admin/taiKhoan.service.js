import { goiApi } from "../../api.js";

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

export function xoaTaiKhoanAdmin(id) {
    return goiApi(`/admin/tai-khoan/${id}`, {
        method: "DELETE"
    });
}

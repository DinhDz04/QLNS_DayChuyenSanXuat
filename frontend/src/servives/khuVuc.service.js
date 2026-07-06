import { goiApi } from "../api.js";

export function layDanhSachKhuVuc() {
    return goiApi("/khu-vuc");
}

export function layKhuVucTheoId(id) {
    return goiApi(`/khu-vuc/${id}`);
}

export function layDanhSachLeaderKhuVuc() {
    return goiApi("/khu-vuc/leaders");
}

export function layDanhSachKhachHang() {
    return goiApi("/khu-vuc/khach-hang");
}

export function taoKhuVuc(duLieu) {
    return goiApi("/khu-vuc", {
        method: "POST",
        body: JSON.stringify(duLieu)
    });
}

export function capNhatKhuVuc(id, duLieu) {
    return goiApi(`/khu-vuc/${id}`, {
        method: "PUT",
        body: JSON.stringify(duLieu)
    });
}

export function xoaKhuVuc(id) {
    return goiApi(`/khu-vuc/${id}`, {
        method: "DELETE"
    });
}

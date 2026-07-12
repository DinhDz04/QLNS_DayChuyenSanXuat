import { goiApi } from "../../../services/api.js";

export function layDanhSachDayChuyen() {
    return goiApi("/day-chuyen");
}

export function layDayChuyenTheoId(id) {
    return goiApi(`/day-chuyen/${id}`);
}

export function layDanhSachLeaderLine() {
    return goiApi("/day-chuyen/leaders");
}

export function taoDayChuyen(duLieu) {
    return goiApi("/day-chuyen", {
        method: "POST",
        body: JSON.stringify(duLieu)
    });
}

export function capNhatDayChuyen(id, duLieu) {
    return goiApi(`/day-chuyen/${id}`, {
        method: "PUT",
        body: JSON.stringify(duLieu)
    });
}

export function xoaDayChuyen(id) {
    return goiApi(`/day-chuyen/${id}`, {
        method: "DELETE"
    });
}

export function layChiTietDayChuyen(id, ngay) {
    let url = `/day-chuyen/${id}/chi-tiet`;
    if (ngay) url += `?ngay=${ngay}`;
    return goiApi(url);
}

export function layUngVienChoBoPhan(congDoanId) {
    return goiApi(`/day-chuyen/ung-vien?cong_doan_id=${congDoanId}`);
}

export function phanCongNhanSu(duLieu) {
    return goiApi("/day-chuyen/phan-cong", {
        method: "POST",
        body: JSON.stringify(duLieu)
    });
}

export function goPhanCongNhanSu(duLieu) {
    return goiApi("/day-chuyen/go-phan-cong", {
        method: "POST",
        body: JSON.stringify(duLieu)
    });
}

export function tuDongGanNhanSu(id, ngay) {
    return goiApi(`/day-chuyen/${id}/auto-assign`, {
        method: "POST",
        body: JSON.stringify({ ngay })
    });
}

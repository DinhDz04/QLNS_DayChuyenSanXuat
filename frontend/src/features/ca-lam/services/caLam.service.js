import { goiApi } from "../../../services/api.js";

// ================= CA LÀM VIỆC API =================
export function layDanhSachCaLam() {
    return goiApi("/ca-lam");
}

export function layCaLamTheoId(id) {
    return goiApi(`/ca-lam/${id}`);
}

export function taoCaLam(duLieu) {
    return goiApi("/ca-lam", {
        method: "POST",
        body: JSON.stringify(duLieu)
    });
}

export function capNhatCaLam(id, duLieu) {
    return goiApi(`/ca-lam/${id}`, {
        method: "PUT",
        body: JSON.stringify(duLieu)
    });
}

export function xoaCaLam(id) {
    return goiApi(`/ca-lam/${id}`, {
        method: "DELETE"
    });
}

// ================= LỊCH LÀM VIỆC API =================
export function layDanhSachLichLam() {
    return goiApi("/ca-lam/lich-lam");
}

export function taoLichLam(duLieu) {
    return goiApi("/ca-lam/lich-lam", {
        method: "POST",
        body: JSON.stringify(duLieu)
    });
}

export function capNhatLichLam(id, duLieu) {
    return goiApi(`/ca-lam/lich-lam/${id}`, {
        method: "PUT",
        body: JSON.stringify(duLieu)
    });
}

export function xoaLichLam(id) {
    return goiApi(`/ca-lam/lich-lam/${id}`, {
        method: "DELETE"
    });
}

export function xoayCaLichLam(id) {
    return goiApi(`/ca-lam/lich-lam/${id}/xoay-ca`, {
        method: "POST"
    });
}

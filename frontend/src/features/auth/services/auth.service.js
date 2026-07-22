import { goiApi } from "../../../services/api.js";

export function dangNhap(ten_dang_nhap, mat_khau) {
    return goiApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ ten_dang_nhap, mat_khau })
    });
}

export function layThongTinCaNhan() {
    return goiApi("/auth/me");
}

export function capNhatThongTinProfile(duLieu) {
    return goiApi("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(duLieu)
    });
}

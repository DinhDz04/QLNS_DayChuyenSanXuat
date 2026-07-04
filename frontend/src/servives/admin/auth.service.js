import { goiApi } from "../../api.js";

export function dangNhap(ten_dang_nhap, mat_khau) {
    return goiApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ ten_dang_nhap, mat_khau })
    });
}

export function layThongTinCaNhan() {
    return goiApi("/auth/me");
}

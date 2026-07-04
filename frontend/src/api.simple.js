// API đơn giản cho người mới bắt đầu
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * goiApi: Hàm gọi API dùng chung, đơn giản:
 * - Gắn header Content-Type: application/json
 * - Nếu có token trong localStorage sẽ gắn header Authorization
 * - Chấp nhận body là object (tự stringify) hoặc chuỗi
 */
export async function goiApi(duongDan, tuyChon = {}) {
    const token = localStorage.getItem("token");

    let body = tuyChon.body;
    if (body && typeof body === "object") {
        body = JSON.stringify(body);
    }

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tuyChon.headers || {})
    };

    const response = await fetch(`${API_BASE_URL}${duongDan}`, {
        method: tuyChon.method || "GET",
        headers,
        body
    });

    let data;
    try {
        data = await response.json();
    } catch (e) {
        if (!response.ok) throw new Error("Lỗi khi gọi API");
        return null;
    }

    if (!response.ok) {
        throw new Error(data.message || "Đã có lỗi xảy ra");
    }

    return data;
}

export function dangNhap(ten_dang_nhap, mat_khau) {
    return goiApi("/auth/login", { method: "POST", body: { ten_dang_nhap, mat_khau } });
}

export function layThongTinCaNhan() {
    return goiApi("/auth/me");
}

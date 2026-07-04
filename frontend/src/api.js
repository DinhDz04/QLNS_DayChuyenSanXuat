// Vite đọc biến môi trường bắt đầu bằng VITE_ từ file .env
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Hàm gọi API dùng chung.
 * Tự động gắn header Authorization nếu đã có token lưu trong localStorage.
 */
export async function goiApi(duongDan, tuyChon = {}) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}${duongDan}`, {
        method: tuyChon.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(tuyChon.headers || {})
        },
        body: tuyChon.body
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Đã có lỗi xảy ra");
    }

    return data;
}

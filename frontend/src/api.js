// Vite đọc biến môi trường bắt đầu bằng VITE_ từ file .env
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Hàm gọi API dùng chung.
 * Tự động gắn header Authorization nếu đã có token lưu trong localStorage.
 */
export async function goiApi(duongDan, tuyChon = {}) {
    const token = localStorage.getItem("token");
    const isFormData = tuyChon.body instanceof FormData;
    const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tuyChon.headers || {})
    };

    if (!isFormData && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${duongDan}`, {
        method: tuyChon.method || "GET",
        headers,
        body: tuyChon.body
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
        ? await response.json()
        : contentType.includes("application/vnd") || contentType.includes("octet-stream")
            ? await response.blob()
            : await response.text();

    if (!response.ok) {
        const message = typeof data === "object" && data !== null
            ? data.message || "Đã có lỗi xảy ra"
            : data || "Đã có lỗi xảy ra";
        throw new Error(message);
    }

    return data;
}

export async function taiFileTuApi(duongDan, tenFile) {
    const blob = await goiApi(duongDan);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = tenFile;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

export default async function api(duongDan, tuyChon = {}) {
    return goiApi(duongDan, tuyChon);
}

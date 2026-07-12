// Base API instance using fetch wrapper
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
        // Tự động logout nếu Token hết hạn hoặc không hợp lệ (401)
        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/dang-nhap";
        }
        const message = typeof data === "object" && data !== null
            ? data.message || "Đã có lỗi xảy ra"
            : data || "Đã có lỗi xảy ra";
        throw new Error(message);
    }

    return data;
}

export default goiApi;

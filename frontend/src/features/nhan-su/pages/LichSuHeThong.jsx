import { useState, useEffect } from "react";
import { layLichSuHeThong } from "../services/nhanSu.service.js";

export default function LichSuHeThong() {
    const [lichSu, setLichSu] = useState([]);
    const [dangTai, setDangTai] = useState(true);
    const [tuKhoa, setTuKhoa] = useState("");
    const [tabLoai, setTabLoai] = useState("ALL"); // ALL, CA_LAM, MAT_KHAU, DAY_CHUYEN, VAI_TRO, PHAN_CONG_DAILY

    useEffect(() => {
        TaiLichSu();
    }, []);

    async function TaiLichSu() {
        setDangTai(true);
        try {
            const res = await layLichSuHeThong();
            if (res.success) {
                setLichSu(res.data);
            }
        } catch (err) {
            console.error("Lỗi khi tải lịch sử hệ thống:", err);
        } finally {
            setDangTai(false);
        }
    }

    function formatNgay(chuoiNgay) {
        if (!chuoiNgay) return "-";
        const d = new Date(chuoiNgay);
        return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
    }

    // Lọc danh sách lịch sử theo tab và từ khóa
    const danhSachLoc = lichSu.filter(item => {
        // 1. Lọc theo tab
        if (tabLoai !== "ALL" && item.loai_thay_doi !== tabLoai) {
            return false;
        }

        // 2. Lọc theo từ khóa tìm kiếm
        const search = tuKhoa.toLowerCase().trim();
        if (!search) return true;
        return (
            (item.ho_ten && item.ho_ten.toLowerCase().includes(search)) ||
            (item.ma_nhan_vien && item.ma_nhan_vien.toLowerCase().includes(search)) ||
            (item.hanh_dong && item.hanh_dong.toLowerCase().includes(search)) ||
            (item.tu_day_chuyen && item.tu_day_chuyen.toLowerCase().includes(search)) ||
            (item.den_day_chuyen && item.den_day_chuyen.toLowerCase().includes(search)) ||
            (item.ten_day_chuyen && item.ten_day_chuyen.toLowerCase().includes(search)) ||
            (item.ten_cong_doan && item.ten_cong_doan.toLowerCase().includes(search)) ||
            (item.ly_do && item.ly_do.toLowerCase().includes(search))
        );
    });

    const categories = [
        { key: "ALL", label: "📋 Tất cả nhật ký" },
        { key: "CA_LAM", label: "⏰ Thay đổi Ca làm" },
        { key: "MAT_KHAU", label: "🔑 Thay đổi Mật khẩu" },
        { key: "DAY_CHUYEN", label: "⛓️ Điều chuyển Dây chuyền" },
        { key: "VAI_TRO", label: "👥 Thay đổi Vai trò" },
        { key: "PHAN_CONG_DAILY", label: "📅 Phân công hàng ngày" }
    ];

    return (
        <div className="noi-dung-admin">
            <div className="admin-header-bar" style={{ marginBottom: "24px" }}>
                <div className="tieu-de-khoi">
                    <h2>Nhật ký & Lịch sử hệ thống</h2>
                    <p>Tra cứu chi tiết toàn bộ các biến động về nhân sự, bảo mật, và điều động sản xuất</p>
                </div>
            </div>

            {/* Khung tìm kiếm & Tabs lọc */}
            <div className="the-thong-tin" style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "300px" }}>
                        <input
                            type="text"
                            placeholder="🔍 Tìm kiếm theo tên nhân viên, mã nhân sự, dây chuyền, nội dung lý do..."
                            value={tuKhoa}
                            onChange={(e) => setTuKhoa(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 14px",
                                border: "1px solid #cbd5e1",
                                borderRadius: "var(--radius)",
                                fontSize: "14px"
                            }}
                        />
                    </div>
                    <button 
                        onClick={TaiLichSu} 
                        className="nut-hanh-dong"
                        style={{ padding: "10px 16px", backgroundColor: "#f1f5f9", borderColor: "#cbd5e1" }}
                    >
                        🔄 Làm mới
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                    {categories.map((cat) => (
                        <button
                            key={cat.key}
                            onClick={() => setTabLoai(cat.key)}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "999px",
                                border: "1px solid",
                                borderColor: tabLoai === cat.key ? "var(--primary-color)" : "#e2e8f0",
                                backgroundColor: tabLoai === cat.key ? "#eff6ff" : "#fff",
                                color: tabLoai === cat.key ? "var(--primary-color)" : "var(--text-color)",
                                fontWeight: tabLoai === cat.key ? "bold" : "normal",
                                cursor: "pointer",
                                fontSize: "13px",
                                transition: "all 0.2s ease"
                            }}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bảng dữ liệu nhật ký */}
            <div className="the-thong-tin">
                {dangTai ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontStyle: "italic" }}>
                        Đang tải dữ liệu nhật ký hệ thống...
                    </div>
                ) : danhSachLoc.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontStyle: "italic" }}>
                        Không có dữ liệu nhật ký nào khớp với bộ lọc hiện tại.
                    </div>
                ) : (
                    <div className="bang-du-lieu-wrapper">
                        <table className="bang-du-lieu">
                            <thead>
                                <tr>
                                    <th style={{ width: "160px" }}>Thời gian</th>
                                    <th style={{ width: "200px" }}>Nhân sự</th>
                                    <th style={{ width: "180px", textAlign: "center" }}>Phân loại</th>
                                    <th>Nội dung / Thay đổi chi tiết</th>
                                    <th>Lý do điều chuyển</th>
                                </tr>
                            </thead>
                            <tbody>
                                {danhSachLoc.map((item, idx) => {
                                    const isDieuDong = item.loai === "DIEU_DONG";
                                    const loaiThayDoi = item.loai_thay_doi;
                                    
                                    // Xác định badge style
                                    let badgeColor = "#475569";
                                    let badgeBg = "#f1f5f9";
                                    let badgeText = loaiThayDoi || "KHÁC";

                                    if (loaiThayDoi === "MAT_KHAU") {
                                        badgeColor = "#dc2626";
                                        badgeBg = "#fee2e2";
                                        badgeText = "🔑 MẬT KHẨU";
                                    } else if (loaiThayDoi === "CA_LAM") {
                                        badgeColor = "#d97706";
                                        badgeBg = "#fef3c7";
                                        badgeText = "⏰ CA LÀM";
                                    } else if (loaiThayDoi === "DAY_CHUYEN") {
                                        badgeColor = "#2563eb";
                                        badgeBg = "#dbeafe";
                                        badgeText = "⛓️ DÂY CHUYỀN";
                                    } else if (loaiThayDoi === "VAI_TRO") {
                                        badgeColor = "#9333ea";
                                        badgeBg = "#f3e8ff";
                                        badgeText = "👥 VAI TRÒ";
                                    } else if (loaiThayDoi === "PHAN_CONG_DAILY") {
                                        badgeColor = "#16a34a";
                                        badgeBg = "#dcfce7";
                                        badgeText = "📅 HÀNG NGÀY";
                                    }

                                    return (
                                        <tr key={idx}>
                                            <td><strong>{formatNgay(item.thoi_gian)}</strong></td>
                                            <td>
                                                <strong>{item.ho_ten}</strong> <br />
                                                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{item.ma_nhan_vien}</span>
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                <span style={{
                                                    color: badgeColor,
                                                    background: badgeBg,
                                                    padding: "4px 10px",
                                                    borderRadius: "4px",
                                                    fontSize: "11px",
                                                    fontWeight: "bold",
                                                    display: "inline-block"
                                                }}>
                                                    {badgeText}
                                                </span>
                                            </td>
                                            <td>
                                                {isDieuDong ? (
                                                    <div style={{ fontSize: "13px" }}>
                                                        {item.tu_day_chuyen || item.den_day_chuyen ? (
                                                            <span>🔁 {item.tu_day_chuyen || "Tự do"} ➔ {item.den_day_chuyen || "Tự do"}</span>
                                                        ) : (
                                                            <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Không có thay đổi dây chuyền</span>
                                                        )}
                                                        {item.cong_doan_cu || item.cong_doan_moi ? (
                                                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                                                Công đoạn: {item.cong_doan_cu || "Chưa xếp"} ➔ {item.cong_doan_moi || "Chưa xếp"}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: "13px" }}>
                                                        <strong>{item.ten_day_chuyen || "Chưa gán"}</strong> - <span style={{ color: "var(--primary-color)", fontWeight: "600" }}>{item.ten_cong_doan || "Chưa gán"}</span>
                                                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                                            Ca: {item.ten_ca || "Mặc định"} | Ngày làm: {new Date(item.ngay).toLocaleDateString("vi-VN")}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <em style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                                                    {isDieuDong ? (item.ly_do || "Không ghi lý do") : "Nhật ký phân công sản xuất hàng ngày"}
                                                </em>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

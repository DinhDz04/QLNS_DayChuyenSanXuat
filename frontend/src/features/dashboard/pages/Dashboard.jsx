import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import RoleBadge, { TEN_ROLE } from "../../../components/ui/Badge.jsx";
import { layDanhSachKhuVuc, layBanDoKhuVuc } from "../../khu-vuc/services/khuVuc.service.js";

const GRID_SIZE = 12;

const CAC_KHU_VUC_CHUC_NANG = [
    {
        tieuDe: "Bản đồ sa bàn",
        moTa: "Xem sa bàn mặt bằng phân công, hướng di chuyển của các line.",
        choPhep: ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"],
        duongDan: "/admin/ban-do"
    },
    {
        tieuDe: "Quản trị hệ thống",
        moTa: "Tạo tài khoản, phân quyền, cấu hình toàn hệ thống.",
        choPhep: ["ADMIN"],
        duongDan: "/admin/tai-khoan"
    },
    {
        tieuDe: "Quản lý khu vực",
        moTa: "Quản lý khu vực sản xuất, khách hàng và gán leader khu vực.",
        choPhep: ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"],
        duongDan: "/admin/khu-vuc"
    },
    {
        tieuDe: "Phân công dây chuyền",
        moTa: "Sắp xếp nhân sự vào từng công đoạn, từng ca làm việc.",
        choPhep: ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"],
        duongDan: "/admin/day-chuyen"
    }
];

export default function Dashboard() {
    const { nguoiDung } = useAuth();
    const navigate = useNavigate();

    const [danhSachKhuVuc, setDanhSachKhuVuc] = useState([]);
    const [selectedKhuVucId, setSelectedKhuVucId] = useState("");
    const [congDoanList, setCongDoanList] = useState([]);
    
    const [dangTaiDs, setDangTaiDs] = useState(true);
    const [dangTaiMap, setDangTaiMap] = useState(false);

    useEffect(() => {
        if (nguoiDung && ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"].includes(nguoiDung.role)) {
            taiDanhSachKhuVuc();
        }
    }, [nguoiDung]);

    async function taiDanhSachKhuVuc() {
        setDangTaiDs(true);
        try {
            const res = await layDanhSachKhuVuc();
            if (res.success && res.data.length > 0) {
                setDanhSachKhuVuc(res.data);
                setSelectedKhuVucId(res.data[0].id);
                taiMap(res.data[0].id);
            }
        } catch (err) {
            console.error("Lỗi khi tải danh sách khu vực ở dashboard:", err);
        } finally {
            setDangTaiDs(false);
        }
    }

    async function taiMap(kvId) {
        if (!kvId) return;
        setDangTaiMap(true);
        try {
            const res = await layBanDoKhuVuc(kvId);
            if (res.success) {
                const list = res.data.cong_doan.map(cd => ({
                    ...cd,
                    vi_tri_x: cd.vi_tri_x !== null ? Number(cd.vi_tri_x) : null,
                    vi_tri_y: cd.vi_tri_y !== null ? Number(cd.vi_tri_y) : null,
                    xoay: cd.xoay !== null ? Number(cd.xoay) : 0
                }));
                setCongDoanList(list);
            }
        } catch (err) {
            console.error("Lỗi khi tải bản đồ ở dashboard:", err);
        } finally {
            setDangTaiMap(false);
        }
    }

    function handleKhuVucChange(e) {
        const val = e.target.value;
        setSelectedKhuVucId(val);
        setCongDoanList([]);
        taiMap(val);
    }

    const congDoanDaDat = congDoanList.filter(cd => cd.vi_tri_x !== null);
    const coQuyenXemSaBan = nguoiDung && ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"].includes(nguoiDung.role);

    return (
        <div>
            <main className="noi-dung-chinh">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <div className="the-thong-tin" style={{ margin: 0 }}>
                        <h3>Thông tin tài khoản</h3>
                        <p style={{ margin: 0, fontSize: 14 }}>
                            Xin chào <strong>{nguoiDung.ho_ten || nguoiDung.ten_dang_nhap}</strong>, bạn đang đăng
                            nhập với vai trò <strong>{TEN_ROLE[nguoiDung.role] || nguoiDung.role}</strong>.
                        </p>
                        <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                            Mã nhân sự: <strong>{nguoiDung.ma_nhan_vien || "-"}</strong>
                        </p>
                    </div>

                    <div className="the-thong-tin" style={{ margin: 0 }}>
                        <h3>Lối tắt chức năng</h3>
                        <div className="luoi-quyen" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px", marginTop: "8px" }}>
                            {CAC_KHU_VUC_CHUC_NANG.map((khuVuc) => {
                                const duocPhep = khuVuc.choPhep.includes(nguoiDung.role);
                                return (
                                    <div
                                        key={khuVuc.tieuDe}
                                        className={`o-quyen ${duocPhep ? "duoc-phep the-bam-duoc" : ""}`}
                                        onClick={() => duocPhep && navigate(khuVuc.duongDan)}
                                        style={{ padding: "8px", textAlign: "center", cursor: duocPhep ? "pointer" : "default" }}
                                    >
                                        <h5 style={{ margin: "0 0 4px 0", fontSize: "12px" }}>{khuVuc.tieuDe}</h5>
                                        <p style={{ margin: 0, fontSize: "10px", WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                            {khuVuc.moTa}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* SA BÀN BẢN ĐỒ NGAY TẠI TRANG CHỦ DASHBOARD */}
                {coQuyenXemSaBan && (
                    <div className="the-thong-tin" style={{ display: "flex", flexDirection: "column", height: "560px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                            <h3 style={{ margin: 0 }}>🗺️ Bản đồ mặt bằng vận hành nhà máy (Realtime)</h3>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <span style={{ fontSize: "12px", fontWeight: "bold" }}>Khu vực:</span>
                                {dangTaiDs ? (
                                    <span style={{ fontSize: "12px" }}>Đang tải...</span>
                                ) : (
                                    <select 
                                        value={selectedKhuVucId} 
                                        onChange={handleKhuVucChange}
                                        style={{ padding: "4px 8px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", fontSize: "12px" }}
                                    >
                                        <option value="">-- Chọn khu vực --</option>
                                        {danhSachKhuVuc.map(kv => (
                                            <option key={kv.id} value={kv.id}>{kv.ten_khu_vuc}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        <div style={{ 
                            flex: 1, 
                            border: "1px solid #cbd5e1", 
                            borderRadius: "6px", 
                            background: "#0f172a", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            overflow: "auto",
                            padding: "16px",
                            position: "relative"
                        }}>
                            {dangTaiMap ? (
                                <div style={{ color: "#ffffff", fontSize: "14px", fontStyle: "italic" }}>Đang tải sa bàn...</div>
                            ) : selectedKhuVucId && congDoanList.length === 0 ? (
                                <div style={{ color: "#94a3b8", fontSize: "13px", fontStyle: "italic", textAlign: "center" }}>
                                    Khu vực chưa cấu hình sa bàn mẫu.
                                </div>
                            ) : !selectedKhuVucId ? (
                                <div style={{ color: "#94a3b8", fontSize: "13px", fontStyle: "italic" }}>Vui lòng chọn 1 khu vực.</div>
                            ) : (
                                <div style={{ 
                                    position: "relative",
                                    display: "grid", 
                                    gridTemplateColumns: `repeat(${GRID_SIZE}, 55px)`, 
                                    gridTemplateRows: `repeat(${GRID_SIZE}, 55px)`,
                                    gap: "2px",
                                    backgroundColor: "#334155", 
                                    padding: "2px",
                                    borderRadius: "4px"
                                }}>
                                    {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => (
                                        <div 
                                            key={idx} 
                                            style={{ 
                                                width: "55px", 
                                                height: "55px", 
                                                backgroundColor: "#1e293b", 
                                                borderRadius: "2px"
                                            }} 
                                        />
                                    ))}

                                    {congDoanDaDat.map(cd => {
                                        const isThieu = Number(cd.so_luong_da_gan) < Number(cd.so_luong_can);
                                        
                                        const laChieuDoc = cd.xoay === 90 || cd.xoay === 270;
                                        const gridColSpan = laChieuDoc ? 1 : 2;
                                        const gridRowSpan = laChieuDoc ? 2 : 1;

                                        return (
                                            <div
                                                key={cd.cong_doan_id}
                                                style={{
                                                    gridColumn: `${cd.vi_tri_x + 1} / span ${gridColSpan}`,
                                                    gridRow: `${cd.vi_tri_y + 1} / span ${gridRowSpan}`,
                                                    backgroundColor: isThieu ? "#ef4444" : "#10b981",
                                                    border: "1px solid rgba(255,255,255,0.2)",
                                                    borderRadius: "4px",
                                                    padding: "4px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "space-between",
                                                    color: "#ffffff",
                                                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                                                    zIndex: 5
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "7px" }}>
                                                    <span style={{ opacity: 0.85, fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "60px" }}>
                                                        {cd.ten_day_chuyen}
                                                    </span>
                                                    <span>{isThieu ? "⚠️" : "✅"}</span>
                                                </div>
                                                
                                                <div style={{ fontWeight: "bold", fontSize: "9px", textAlign: "center", margin: "1px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {cd.ten_cong_doan}
                                                </div>

                                                {/* Danh sách nhân viên */}
                                                <div style={{ 
                                                    fontSize: "7px", 
                                                    opacity: 0.9, 
                                                    maxHeight: "12px", 
                                                    overflow: "hidden", 
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    textAlign: "center", 
                                                    borderTop: "1px solid rgba(255,255,255,0.15)", 
                                                    paddingTop: "1px"
                                                }} title={cd.danh_sach_nv || "Chưa gán"}>
                                                    {cd.danh_sach_nv ? cd.danh_sach_nv : "Chưa gán"}
                                                </div>

                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                    <div style={{ fontSize: "8px", fontWeight: "bold" }}>
                                                        👥 {cd.so_luong_da_gan}/{cd.so_luong_can}
                                                    </div>
                                                    <button
                                                        onClick={() => navigate(`/admin/day-chuyen/${cd.day_chuyen_id}`)}
                                                        style={{
                                                            padding: "1px 3px",
                                                            fontSize: "7px",
                                                            backgroundColor: "rgba(255,255,255,0.25)",
                                                            border: "none",
                                                            borderRadius: "2px",
                                                            color: "#ffffff",
                                                            cursor: "pointer",
                                                            fontWeight: "bold"
                                                        }}
                                                    >
                                                        Gán
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

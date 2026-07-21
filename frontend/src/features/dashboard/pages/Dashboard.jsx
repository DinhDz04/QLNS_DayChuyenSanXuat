import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import RoleBadge, { TEN_ROLE } from "../../../components/ui/Badge.jsx";
import { layDanhSachKhuVuc, layBanDoKhuVuc } from "../../khu-vuc/services/khuVuc.service.js";

const CAC_KHU_VUC_CHUC_NANG = [
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
    },    
    {
        tieuDe: "Quản lý nhân viên",
        moTa: "Thêm skill, thăng cấp, điều chuyển nhân sự.",
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

    const coQuyenXemSaBan = nguoiDung && ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"].includes(nguoiDung.role);

    // Tính toán các thống kê cho khu vực được chọn
    const uniqueLines = [...new Set(congDoanList.map(cd => cd.ten_day_chuyen))];
    const tongSoDayChuyen = uniqueLines.length;
    const tongSoCongDoan = congDoanList.length;
    const tongSoNhanVienCan = congDoanList.reduce((acc, curr) => acc + (curr.so_luong_can || 0), 0);
    const tongSoNhanVienDaGan = congDoanList.reduce((acc, curr) => acc + (curr.so_luong_da_gan || 0), 0);

    // Xác định bộ phận Thiếu / Dư nhân sự
    const danhSachThieu = congDoanList.filter(cd => {
        const min = cd.so_luong_min !== null ? cd.so_luong_min : cd.so_luong_can;
        return cd.so_luong_da_gan < min;
    }).map(cd => ({
        ...cd,
        so_luong_min: cd.so_luong_min !== null ? cd.so_luong_min : cd.so_luong_can,
        so_luong_thieu: (cd.so_luong_min !== null ? cd.so_luong_min : cd.so_luong_can) - cd.so_luong_da_gan
    }));

    const danhSachDu = congDoanList.filter(cd => {
        const max = cd.so_luong_max !== null ? cd.so_luong_max : cd.so_luong_can;
        return cd.so_luong_da_gan > max;
    }).map(cd => ({
        ...cd,
        so_luong_max: cd.so_luong_max !== null ? cd.so_luong_max : cd.so_luong_can,
        so_luong_du: cd.so_luong_da_gan - (cd.so_luong_max !== null ? cd.so_luong_max : cd.so_luong_can)
    }));

    const boPhanThieuTarget = congDoanList.filter(cd => cd.so_luong_da_gan < cd.so_luong_can);

    let statusText = "Đủ nhân sự / An toàn";
    let statusColor = "var(--green)";
    if (danhSachThieu.length > 0) {
        statusText = `Thiếu nhân sự ở ${danhSachThieu.length} bộ phận`;
        statusColor = "var(--red)";
    } else if (boPhanThieuTarget.length > 0) {
        statusText = `Cảnh báo: Dưới Target ở ${boPhanThieuTarget.length} bộ phận`;
        statusColor = "var(--amber-dark)";
    }

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
                            {CAC_KHU_VUC_CHUC_NANG.map((item) => {
                                const duocPhep = item.choPhep.includes(nguoiDung.role);
                                return (
                                    <div
                                        key={item.tieuDe}
                                        className={`o-quyen ${duocPhep ? "duoc-phep the-bam-duoc" : ""}`}
                                        onClick={() => duocPhep && navigate(item.duongDan)}
                                        style={{ padding: "8px", textAlign: "center", cursor: duocPhep ? "pointer" : "default" }}
                                    >
                                        <h5 style={{ margin: "0 0 4px 0", fontSize: "12px" }}>{item.tieuDe}</h5>
                                        <p style={{ margin: 0, fontSize: "10px", WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                            {item.moTa}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Phần thống kê tổng quan tình trạng khu vực */}
                {coQuyenXemSaBan && selectedKhuVucId && (
                    <div className="the-thong-tin" style={{ marginTop: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <div>
                                <h3>📊 Thống kê tình trạng nhân sự khu vực</h3>
                                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "6px" }}>
                                    <label style={{ fontSize: "13px", fontWeight: "bold" }}>Khu vực hiển thị:</label>
                                    <select 
                                        value={selectedKhuVucId} 
                                        onChange={handleKhuVucChange} 
                                        style={{ padding: "6px 12px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                                    >
                                        {danhSachKhuVuc.map(kv => (
                                            <option key={kv.id} value={kv.id}>{kv.ten_khu_vuc} ({kv.ten_khach_hang})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Các Card chỉ số nhanh */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "24px" }}>
                            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", fontWeight: "600" }}>TỔNG DÂY CHUYỀN</span>
                                <strong style={{ fontSize: "20px", color: "var(--charcoal)" }}>{tongSoDayChuyen}</strong>
                            </div>
                            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", fontWeight: "600" }}>TỔNG CÔNG ĐOẠN</span>
                                <strong style={{ fontSize: "20px", color: "var(--charcoal)" }}>{tongSoCongDoan}</strong>
                            </div>
                            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", fontWeight: "600" }}>NHÂN SỰ (HIỆN DIỆN / TARGET)</span>
                                <strong style={{ fontSize: "20px", color: "var(--charcoal)" }}>{tongSoNhanVienDaGan} / {tongSoNhanVienCan}</strong>
                            </div>
                            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", fontWeight: "600" }}>TRẠNG THÁI CHUNG</span>
                                <strong style={{ fontSize: "14px", color: statusColor, display: "block", marginTop: "4px" }}>{statusText}</strong>
                            </div>
                        </div>

                        {dangTaiMap ? (
                            <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>Đang tải dữ liệu...</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                
                                {/* 1. Danh sách Thiếu nhân sự */}
                                <div style={{ background: "#fdf2f2", border: "1px solid #fde2e2", padding: "16px", borderRadius: "6px" }}>
                                    <h4 style={{ color: "#9b1c1c", margin: "0 0 10px 0", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                                        ⚠️ BỘ PHẬN THIẾU NHÂN SỰ TỐI THIỂU ({danhSachThieu.length})
                                    </h4>
                                    {danhSachThieu.length === 0 ? (
                                        <p style={{ fontSize: "12px", color: "#1e293b", margin: 0 }}>✅ Đầy đủ nhân sự tối thiểu ở tất cả bộ phận!</p>
                                    ) : (
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
                                            {danhSachThieu.map(cd => (
                                                <div 
                                                    key={cd.cong_doan_id} 
                                                    onClick={() => navigate(`/admin/day-chuyen/${cd.day_chuyen_id}`)}
                                                    style={{ background: "#fff", padding: "10px", borderRadius: "4px", border: "1px solid #fca5a5", cursor: "pointer", fontSize: "12px" }}
                                                    title="Click để điều động nhân sự"
                                                >
                                                    <div style={{ fontWeight: "bold" }}>{cd.ten_cong_doan} ({cd.ten_day_chuyen})</div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", color: "var(--text-muted)" }}>
                                                        <span>Yêu cầu Min: <strong>{cd.so_luong_min}</strong></span>
                                                        <span>Hiện có: <strong style={{ color: "var(--red)" }}>{cd.so_luong_da_gan}</strong></span>
                                                        <span style={{ color: "var(--red)", fontWeight: "bold" }}>Thiếu: {cd.so_luong_thieu}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 2. Danh sách Dư nhân sự */}
                                <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", padding: "16px", borderRadius: "6px" }}>
                                    <h4 style={{ color: "#166534", margin: "0 0 10px 0", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                                        💡 BỘ PHẬN DƯ THỪA NHÂN SỰ ({danhSachDu.length})
                                    </h4>
                                    {danhSachDu.length === 0 ? (
                                        <p style={{ fontSize: "12px", color: "#1e293b", margin: 0 }}>Không có bộ phận nào dư thừa nhân sự.</p>
                                    ) : (
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
                                            {danhSachDu.map(cd => (
                                                <div 
                                                    key={cd.cong_doan_id} 
                                                    onClick={() => navigate(`/admin/day-chuyen/${cd.day_chuyen_id}`)}
                                                    style={{ background: "#fff", padding: "10px", borderRadius: "4px", border: "1px solid #bbf7d0", cursor: "pointer", fontSize: "12px" }}
                                                    title="Click để xem chi tiết"
                                                >
                                                    <div style={{ fontWeight: "bold" }}>{cd.ten_cong_doan} ({cd.ten_day_chuyen})</div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", color: "var(--text-muted)" }}>
                                                        <span>Yêu cầu Max: <strong>{cd.so_luong_max}</strong></span>
                                                        <span>Hiện có: <strong style={{ color: "var(--green)" }}>{cd.so_luong_da_gan}</strong></span>
                                                        <span style={{ color: "var(--green)", fontWeight: "bold" }}>Thừa: {cd.so_luong_du}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 3. Chi tiết tất cả bộ phận */}
                                <div className="bang-du-lieu-wrapper">
                                    <h4 style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 12px 0", letterSpacing: "0.05em" }}>TÌNH TRẠNG CHI TIẾT TẤT CẢ BỘ PHẬN</h4>
                                    <table className="bang-du-lieu">
                                        <thead>
                                            <tr>
                                                <th>Dây chuyền</th>
                                                <th>Bộ phận / Công đoạn</th>
                                                <th style={{ textAlign: "center" }}>Target (Min - Max)</th>
                                                <th style={{ textAlign: "center" }}>Hiện diện</th>
                                                <th style={{ textAlign: "center" }}>Trạng thái</th>
                                                <th>Nhân sự đang làm</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {congDoanList.map(cd => {
                                                const min = cd.so_luong_min !== null ? cd.so_luong_min : cd.so_luong_can;
                                                const max = cd.so_luong_max !== null ? cd.so_luong_max : cd.so_luong_can;
                                                const count = cd.so_luong_da_gan;
                                                
                                                let statusText = "ĐỦ";
                                                let statusColor = "var(--green)";
                                                let statusBg = "#dcfce7";
                                                
                                                if (count < min) {
                                                    statusText = `THIẾU (${min - count})`;
                                                    statusColor = "var(--red)";
                                                    statusBg = "#fee2e2";
                                                } else if (count > max) {
                                                    statusText = `DƯ (${count - max})`;
                                                    statusColor = "#0369a1";
                                                    statusBg = "#e0f2fe";
                                                } else if (count < cd.so_luong_can) {
                                                    statusText = "DƯỚI TARGET";
                                                    statusColor = "var(--amber-dark)";
                                                    statusBg = "#fef9c3";
                                                }

                                                return (
                                                    <tr 
                                                        key={cd.cong_doan_id} 
                                                        style={{ cursor: "pointer" }}
                                                        onClick={() => navigate(`/admin/day-chuyen/${cd.day_chuyen_id}`)}
                                                        title="Click để điều động nhân sự"
                                                    >
                                                        <td><strong>{cd.ten_day_chuyen}</strong></td>
                                                        <td><span style={{ fontWeight: 600 }}>{cd.ten_cong_doan}</span></td>
                                                        <td style={{ textAlign: "center" }}>{cd.so_luong_can} ({min} - {max})</td>
                                                        <td style={{ textAlign: "center", fontWeight: "bold" }}>{count}</td>
                                                        <td style={{ textAlign: "center" }}>
                                                            <span style={{ 
                                                                color: statusColor, 
                                                                background: statusBg, 
                                                                padding: "2px 8px", 
                                                                borderRadius: "4px", 
                                                                fontSize: "11px",
                                                                fontWeight: "bold",
                                                                border: `1px solid ${statusColor}44`
                                                            }}>
                                                                {statusText}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontSize: "11px", color: "var(--text-muted)", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {cd.danh_sach_nv || "-"}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

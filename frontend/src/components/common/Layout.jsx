import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import RoleBadge from "../ui/Badge.jsx";

const MENU_ITEMS = [
    {
        tieuDe: "Bảng điều khiển",
        icon: "📊",
        duongDan: "/dashboard",
        choPhep: ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "NHAN_VIEN", "MANAGER"]
    },
    {
        tieuDe: "Quản lý tài khoản",
        icon: "👥",
        duongDan: "/admin/tai-khoan",
        choPhep: ["ADMIN"]
    },
    {
        tieuDe: "Quản lý khu vực",
        icon: "🏢",
        duongDan: "/admin/khu-vuc",
        choPhep: ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"]
    },
    {
        tieuDe: "Quản lý dây chuyền",
        icon: "⛓️",
        duongDan: "/admin/day-chuyen",
        choPhep: ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"]
    },
    {
        tieuDe: "Quản lý Lịch làm",
        icon: "⏰",
        duongDan: "/admin/ca-lam",
        choPhep: ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"]
    },
    {
        tieuDe: "Nhật ký hệ thống",
        icon: "📜",
        duongDan: "/admin/lich-su",
        choPhep: ["ADMIN", "MANAGER"]
    }
];

export default function Layout() {
    const { nguoiDung, dangXuat } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Realtime clock
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    function xuLyDangXuat() {
        dangXuat();
        navigate("/dang-nhap");
    }

    if (!nguoiDung) return null;

    const menuHienThi = MENU_ITEMS.filter(item => item.choPhep.includes(nguoiDung.role));

    const currentMenuItem = menuHienThi.find(item => {
        if (item.duongDan === "/dashboard" && location.pathname === "/dashboard") return true;
        if (item.duongDan !== "/dashboard" && location.pathname.startsWith(item.duongDan)) return true;
        return false;
    });
    const tieuDeTrang = currentMenuItem ? currentMenuItem.tieuDe : "Hệ thống";

    const hours = currentTime.getHours();
    // OT is after 17:00 (5PM) or before 6:00 AM
    const isOT = hours >= 17 || hours < 6;
    const timeString = currentTime.toLocaleTimeString("vi-VN", { hour12: false });

    return (
        <div className="bo-cuc-he-thong">
            {/* Sidebar bên trái */}
            <aside className="thanh-ben-trai">
                <div className="vach-day-chuyen-nhan-dang" />
                <div className="sidebar-header">
                    <div className="logo">QLNS<span>•</span>PRO</div>
                    <span className="sub-logo-text">FACTORY OPERATIONS</span>
                </div>

                <div className="thong-tin-nguoi-dung-sidebar">
                    <div className="avatar-gia">
                        {nguoiDung.ten_dang_nhap.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="chi-tiet-nguoi-dung">
                        <span className="ten-nguoi-dung">{nguoiDung.ten_dang_nhap}</span>
                        <RoleBadge role={nguoiDung.role} />
                    </div>
                </div>

                <nav className="danh-sach-menu">
                    {menuHienThi.map((item) => {
                        const active = location.pathname === item.duongDan || 
                            (item.duongDan !== "/dashboard" && location.pathname.startsWith(item.duongDan));
                        return (
                            <button
                                key={item.tieuDe}
                                className={`nut-menu ${active ? "active" : ""}`}
                                onClick={() => navigate(item.duongDan)}
                            >
                                <span className="icon-menu">{item.icon}</span>
                                <span className="chu-menu">{item.tieuDe}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <button className="nut-dang-xuat-sidebar" onClick={xuLyDangXuat}>
                        🚪 Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Nội dung bên phải */}
            <div className="phong-chinh">
                {/* Navbar phía trên */}
                <header className="thanh-ngang-dinh" style={{ borderBottom: isOT ? "3px solid #f59e0b" : "1px solid #cbd5e1" }}>
                    <div className="navbar-trai">
                        <h2>{tieuDeTrang}</h2>
                    </div>
                    
                    {/* Real-time Clock & OT warning badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f1f5f9", padding: "6px 12px", borderRadius: "16px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "700", fontFamily: "monospace", letterSpacing: "0.05em", color: "#1e293b" }}>
                            ⏰ {timeString}
                        </span>
                        <div style={{ width: "1px", height: "14px", backgroundColor: "#cbd5e1" }} />
                        <span style={{ 
                            fontSize: "11px", 
                            fontWeight: "bold", 
                            padding: "2px 8px", 
                            borderRadius: "12px",
                            backgroundColor: isOT ? "#fef3c7" : "#dcfce7",
                            color: isOT ? "#d97706" : "#16a34a",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                        }}>
                            {isOT ? "🌙 TĂNG CA (OT)" : "☀️ HÀNH CHÍNH"}
                        </span>
                    </div>

                    <div className="navbar-phai">
                        <div className="trang-thai-nha-may">
                            <span className="den-tin-hieu active"></span>
                            <span>HỆ THỐNG ĐANG HOẠT ĐỘNG</span>
                        </div>
                        <div className="ngan-cach" />
                        <span>Xin chào, <strong>{nguoiDung.ho_ten || nguoiDung.ten_dang_nhap}</strong></span>
                    </div>
                </header>

                {/* Phần ruột chứa nội dung trang */}
                <main className="noi-dung-cu-the">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

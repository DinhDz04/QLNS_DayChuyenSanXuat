import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import RoleBadge from "../../components/admin/RoleBadge.jsx";

const MENU_ITEMS = [
    {
        tieuDe: "Bảng điều khiển",
        icon: "📊",
        duongDan: "/dashboard",
        choPhep: ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "NHAN_VIEN"]
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
        choPhep: ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE"]
    },
    {
        tieuDe: "Quản lý dây chuyền",
        icon: "⛓️",
        duongDan: "/admin/day-chuyen",
        choPhep: ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE"]
    }
];

export default function Layout({ children }) {
    const { nguoiDung, dangXuat } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    function xuLyDangXuat() {
        dangXuat();
        navigate("/dang-nhap");
    }

    if (!nguoiDung) return null;

    // Lọc menu theo vai trò của người dùng
    const menuHienThi = MENU_ITEMS.filter(item => item.choPhep.includes(nguoiDung.role));

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
                        const active = location.pathname === item.duongDan;
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
                <header className="thanh-ngang-dinh">
                    <div className="navbar-trai">
                        <h2>{menuHienThi.find(item => item.duongDan === location.pathname)?.tieuDe || "Hệ thống"}</h2>
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
                    {children}
                </main>
            </div>
        </div>
    );
}

import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { dangNhap } from "../services/auth.service.js";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function DangNhap() {
    const { nguoiDung, dangNhapThanhCong } = useAuth();
    const navigate = useNavigate();

    const [tenDangNhap, setTenDangNhap] = useState("");
    const [matKhau, setMatKhau] = useState("");
    const [loi, setLoi] = useState("");
    const [dangGui, setDangGui] = useState(false);

    if (nguoiDung) {
        return <Navigate to="/dashboard" replace />;
    }

    async function xuLySubmit(e) {
        e.preventDefault();
        setLoi("");
        setDangGui(true);

        try {
            const ketQua = await dangNhap(tenDangNhap.trim(), matKhau);
            dangNhapThanhCong(ketQua.data.token, ketQua.data.nguoiDung);
            navigate("/dashboard");
        } catch (err) {
            setLoi(err.message || "Đăng nhập không thành công");
        } finally {
            setDangGui(false);
        }
    }

    return (
        <div className="man-hinh-dang-nhap">
            {/* Panel thương hiệu bên trái */}
            <div className="panel-thuong-hieu">
                <div className="logo">QLNS<span>•</span>DÂY CHUYỀN</div>

                <div className="khau-hieu">
                    <h1>Điều phối nhân sự<br />theo từng dây chuyền</h1>
                    <p>
                        Đăng nhập để xem phân công, ca làm việc và tình trạng nhân sự
                        theo đúng khu vực, dây chuyền bạn phụ trách.
                    </p>

                    <div className="thong-ke-nho">
                        <div><strong>4</strong><span>Cấp vai trò</span></div>
                        <div><strong>24/7</strong><span>Theo dõi ca làm</span></div>
                        <div><strong>1</strong><span>Nơi quản lý duy nhất</span></div>
                    </div>
                </div>

                <div style={{ fontSize: 12, color: "#7d8695" }}>
                    © Hệ thống Quản lý Nhân sự Dây chuyền
                </div>
            </div>

            {/* Panel form bên phải */}
            <div className="panel-form">
                <div className="khung-form">
                    <h2>Đăng nhập</h2>
                    <p className="phu-de">Nhập tài khoản quản trị được cấp để tiếp tục</p>

                    {loi && <div className="thong-bao-loi">{loi}</div>}

                    <form onSubmit={xuLySubmit}>
                        <div className="nhom-o-nhap">
                            <label htmlFor="ten_dang_nhap">Tên đăng nhập</label>
                            <input
                                id="ten_dang_nhap"
                                type="text"
                                autoComplete="username"
                                value={tenDangNhap}
                                onChange={(e) => setTenDangNhap(e.target.value)}
                                required
                            />
                        </div>

                        <div className="nhom-o-nhap">
                            <label htmlFor="mat_khau">Mật khẩu</label>
                            <input
                                id="mat_khau"
                                type="password"
                                autoComplete="current-password"
                                value={matKhau}
                                onChange={(e) => setMatKhau(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="nut-chinh" disabled={dangGui}>
                            {dangGui ? "Đang đăng nhập..." : "Đăng nhập"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

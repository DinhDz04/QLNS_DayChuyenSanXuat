import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import RoleBadge from "../../../components/ui/Badge.jsx";
import { capNhatThongTinProfile } from "../../auth/services/auth.service.js";

export default function Profile() {
    const { nguoiDung, taiLaiThongTin } = useAuth();

    const [hoTen, setHoTen] = useState("");
    const [soDienThoai, setSoDienThoai] = useState("");
    const [email, setEmail] = useState("");
    const [gioiTinh, setGioiTinh] = useState("Khac");
    const [matKhau, setMatKhau] = useState("");
    const [xacNhanMatKhau, setXacNhanMatKhau] = useState("");
    
    const [loi, setLoi] = useState("");
    const [thongBao, setThongBao] = useState("");
    const [dangXuLy, setDangXuLy] = useState(false);

    useEffect(() => {
        if (nguoiDung) {
            setHoTen(nguoiDung.ho_ten || "");
            setSoDienThoai(nguoiDung.so_dien_thoai || "");
            setEmail(nguoiDung.email || "");
            setGioiTinh(nguoiDung.gioi_tinh || "Khac");
        }
    }, [nguoiDung]);

    if (!nguoiDung) return null;

    async function handleSave(e) {
        e.preventDefault();
        setLoi("");
        setThongBao("");
        setDangXuLy(true);

        if (matKhau && matKhau !== xacNhanMatKhau) {
            setLoi("Xác nhận mật khẩu mới không khớp!");
            setDangXuLy(false);
            return;
        }

        try {
            const data = {
                ho_ten: hoTen.trim(),
                so_dien_thoai: soDienThoai.trim() || null,
                email: email.trim() || null,
                gioi_tinh: gioiTinh
            };

            if (matKhau.trim()) {
                data.mat_khau = matKhau;
            }

            const res = await capNhatThongTinProfile(data);
            if (res.success) {
                setThongBao("Cập nhật thông tin cá nhân thành công!");
                setMatKhau("");
                setXacNhanMatKhau("");
                await taiLaiThongTin();
            }
        } catch (err) {
            setLoi(err.message || "Lỗi khi cập nhật thông tin cá nhân");
        } finally {
            setDangXuLy(false);
        }
    }

    return (
        <div className="noi-dung-admin">
            <div className="admin-header-bar" style={{ borderBottom: "1px solid #cbd5e1", paddingBottom: "16px", marginBottom: "20px" }}>
                <div className="tieu-de-khoi">
                    <h2>Hồ sơ cá nhân</h2>
                    <p>Cập nhật thông tin tài khoản đăng nhập và mật khẩu của bạn trong hệ thống</p>
                </div>
            </div>

            {thongBao && <div className="thong-bao-thanh-cong">{thongBao}</div>}
            {loi && <div className="thong-bao-loi">{loi}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "24px", alignItems: "start" }}>
                
                {/* Cột trái: Thẻ tóm tắt thông tin */}
                <div className="the-thong-tin" style={{ textAlign: "center", padding: "30px 20px" }}>
                    <div style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "50%",
                        backgroundColor: "var(--primary-color, #1e3a8a)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "40px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        margin: "0 auto 16px auto"
                    }}>
                        {nguoiDung.ten_dang_nhap.substring(0, 2)}
                    </div>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: "20px" }}>{nguoiDung.ho_ten || nguoiDung.ten_dang_nhap}</h3>
                    <div style={{ marginBottom: "16px" }}>
                        <RoleBadge role={nguoiDung.role} />
                    </div>

                    <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: "16px", textAlign: "left", fontSize: "13px" }}>
                        <div style={{ marginBottom: "8px" }}>
                            <span style={{ color: "var(--text-muted)", display: "block" }}>Tên đăng nhập</span>
                            <strong>{nguoiDung.ten_dang_nhap}</strong>
                        </div>
                        <div style={{ marginBottom: "8px" }}>
                            <span style={{ color: "var(--text-muted)", display: "block" }}>Mã nhân viên</span>
                            <strong>{nguoiDung.ma_nhan_vien || "Chưa tạo"}</strong>
                        </div>
                        <div style={{ marginBottom: "8px" }}>
                            <span style={{ color: "var(--text-muted)", display: "block" }}>Chức vụ hệ thống</span>
                            <strong>{nguoiDung.chuc_vu || "Nhân viên"}</strong>
                        </div>
                    </div>
                </div>

                {/* Cột phải: Form cập nhật thông tin */}
                <div className="the-thong-tin">
                    <form onSubmit={handleSave}>
                        <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "16px" }}>📝 Cập nhật thông tin chi tiết</h3>
                        
                        <div className="nhom-o-nhap">
                            <label>Họ và tên *</label>
                            <input
                                type="text"
                                value={hoTen}
                                onChange={(e) => setHoTen(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div className="nhom-o-nhap">
                                <label>Số điện thoại</label>
                                <input
                                    type="tel"
                                    value={soDienThoai}
                                    onChange={(e) => setSoDienThoai(e.target.value)}
                                />
                            </div>
                            <div className="nhom-o-nhap">
                                <label>Giới tính</label>
                                <select
                                    value={gioiTinh}
                                    onChange={(e) => setGioiTinh(e.target.value)}
                                >
                                    <option value="Khac">Khác</option>
                                    <option value="Nam">Nam</option>
                                    <option value="Nu">Nữ</option>
                                </select>
                            </div>
                        </div>

                        <div className="nhom-o-nhap">
                            <label>Email liên kết</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div style={{ marginTop: "20px", borderTop: "1px dashed #cbd5e1", paddingTop: "16px" }}>
                            <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "14px", color: "var(--text-muted)", textTransform: "uppercase" }}>🔑 Đổi mật khẩu (Để trống nếu không muốn đổi)</h3>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div className="nhom-o-nhap">
                                    <label>Mật khẩu mới</label>
                                    <input
                                        type="password"
                                        value={matKhau}
                                        onChange={(e) => setMatKhau(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="nhom-o-nhap">
                                    <label>Xác nhận mật khẩu mới</label>
                                    <input
                                        type="password"
                                        value={xacNhanMatKhau}
                                        onChange={(e) => setXacNhanMatKhau(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                            <button
                                type="submit"
                                className="nut-chinh"
                                disabled={dangXuLy}
                                style={{ width: "auto", padding: "10px 24px" }}
                            >
                                {dangXuLy ? "Đang cập nhật..." : "Lưu thay đổi"}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}

import { useState, useEffect } from "react";

export default function ModalTaiKhoan({ hienThi, cheDo, taiKhoan, onClose, onSave, nguoiDungHienTai }) {
    const [tenDangNhap, setTenDangNhap] = useState("");
    const [email, setEmail] = useState("");
    const [matKhau, setMatKhau] = useState("");
    const [role, setRole] = useState("NHAN_VIEN");
    const [trangThai, setTrangThai] = useState(1);
    const [loi, setLoi] = useState("");
    const [dangXuLy, setDangXuLy] = useState(false);

    useEffect(() => {
        if (hienThi) {
            setLoi("");
            setMatKhau("");
            if (cheDo === "SUA" && taiKhoan) {
                setTenDangNhap(taiKhoan.ten_dang_nhap || "");
                setEmail(taiKhoan.email || "");
                setRole(taiKhoan.role || "NHAN_VIEN");
                setTrangThai(taiKhoan.trang_thai !== undefined ? taiKhoan.trang_thai : 1);
            } else {
                setTenDangNhap("");
                setEmail("");
                setRole("NHAN_VIEN");
                setTrangThai(1);
            }
        }
    }, [hienThi, cheDo, taiKhoan]);

    if (!hienThi) return null;

    async function xuLySubmit(e) {
        e.preventDefault();
        setLoi("");
        setDangXuLy(true);

        const data = {
            ten_dang_nhap: tenDangNhap.trim(),
            email: email.trim() || null,
            role,
            trang_thai: Number(trangThai)
        };

        if (cheDo === "THEM") {
            if (!matKhau) {
                setLoi("Vui lòng nhập mật khẩu cho tài khoản mới");
                setDangXuLy(false);
                return;
            }
            data.mat_khau = matKhau;
        } else {
            // Chế độ sửa, chỉ gửi mật khẩu nếu người dùng nhập thay đổi
            if (matKhau.trim() !== "") {
                data.mat_khau = matKhau;
            }
        }

        try {
            await onSave(data);
            onClose();
        } catch (err) {
            setLoi(err.message || "Lỗi khi lưu thông tin");
        } finally {
            setDangXuLy(false);
        }
    }

    const laChinhMinh = taiKhoan && Number(taiKhoan.id) === Number(nguoiDungHienTai.id);

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{cheDo === "THEM" ? "Tạo tài khoản mới" : "Chỉnh sửa tài khoản"}</h3>
                    <button className="nut-dong-modal" onClick={onClose} disabled={dangXuLy}>×</button>
                </div>
                <form onSubmit={xuLySubmit}>
                    <div className="modal-body">
                        {loi && <div className="thong-bao-loi">{loi}</div>}
                        
                        <div className="nhom-o-nhap">
                            <label htmlFor="modal_ten_dang_nhap">Tên đăng nhập *</label>
                            <input
                                id="modal_ten_dang_nhap"
                                type="text"
                                value={tenDangNhap}
                                onChange={(e) => setTenDangNhap(e.target.value)}
                                required
                                disabled={laChinhMinh} // Không cho phép đổi tên đăng nhập chính mình
                            />
                        </div>

                        <div className="nhom-o-nhap">
                            <label htmlFor="modal_email">Email</label>
                            <input
                                id="modal_email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="vi_du@qlns.local"
                            />
                        </div>

                        <div className="nhom-o-nhap">
                            <label htmlFor="modal_mat_khau">
                                Mật khẩu {cheDo === "SUA" && "(để trống nếu giữ nguyên)"} *
                            </label>
                            <input
                                id="modal_mat_khau"
                                type="password"
                                value={matKhau}
                                onChange={(e) => setMatKhau(e.target.value)}
                                required={cheDo === "THEM"}
                                placeholder={cheDo === "SUA" ? "••••••••" : ""}
                            />
                        </div>

                        <div className="nhom-o-nhap">
                            <label htmlFor="modal_role">Vai trò hệ thống *</label>
                            <select
                                id="modal_role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                required
                                disabled={laChinhMinh} // Không cho phép tự hạ quyền của mình
                            >
                                <option value="ADMIN">Quản trị viên (ADMIN)</option>
                                <option value="LEADER_KHU_VUC">Trưởng khu vực</option>
                                <option value="LEADER_LINE">Trưởng dây chuyền</option>
                                <option value="NHAN_VIEN">Nhân viên</option>
                            </select>
                        </div>

                        <div className="nhom-o-nhap-checkbox">
                            <label htmlFor="modal_trang_thai">Trạng thái hoạt động</label>
                            <select
                                id="modal_trang_thai"
                                value={trangThai}
                                onChange={(e) => setTrangThai(Number(e.target.value))}
                                disabled={laChinhMinh} // Không cho phép tự khóa tài khoản của mình
                            >
                                <option value={1}>Hoạt động</option>
                                <option value={0}>Bị khóa</option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button 
                            type="button" 
                            className="nut-huy" 
                            onClick={onClose}
                            disabled={dangXuLy}
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            className="nut-chinh nut-luu" 
                            disabled={dangXuLy}
                        >
                            {dangXuLy ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

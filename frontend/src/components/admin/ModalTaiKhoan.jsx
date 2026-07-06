import { useState, useEffect } from "react";

function layRoleTiepTheo(roleHienTai) {
    if (roleHienTai === "NHAN_VIEN") return "LEADER_LINE";
    if (roleHienTai === "LEADER_LINE") return "LEADER_KHU_VUC";
    return null;
}

function layRoleTruoc(roleHienTai) {
    if (roleHienTai === "LEADER_KHU_VUC") return "LEADER_LINE";
    if (roleHienTai === "LEADER_LINE") return "NHAN_VIEN";
    return null;
}

function layCapDo(role) {
    if (role === "LEADER_KHU_VUC") return 3;
    if (role === "LEADER_LINE") return 2;
    if (role === "NHAN_VIEN") return 1;
    return 0;
}

export default function ModalTaiKhoan({ hienThi, cheDo, taiKhoan, onClose, onSave, nguoiDungHienTai }) {
    const [tenDangNhap, setTenDangNhap] = useState("");
    const [hoTen, setHoTen] = useState("");
    const [soDienThoai, setSoDienThoai] = useState("");
    const [gioiTinh, setGioiTinh] = useState("Khac");
    const [email, setEmail] = useState("");
    const [matKhau, setMatKhau] = useState("");
    const [role, setRole] = useState("NHAN_VIEN");
    const [trangThai, setTrangThai] = useState(1);
    const [loi, setLoi] = useState("");
    const [dangXuLy, setDangXuLy] = useState(false);
    const [hanhDongCapBac, setHanhDongCapBac] = useState("THANG_CAP");

    useEffect(() => {
        if (hienThi) {
            setLoi("");
            setMatKhau("");
            setHanhDongCapBac("THANG_CAP");
            if (cheDo === "SUA" && taiKhoan) {
                setTenDangNhap(taiKhoan.ten_dang_nhap || "");
                setHoTen(taiKhoan.ho_ten || "");
                setSoDienThoai(taiKhoan.so_dien_thoai || "");
                setGioiTinh(taiKhoan.gioi_tinh || "Khac");
                setEmail(taiKhoan.email || "");
                setRole(taiKhoan.role || "NHAN_VIEN");
                setTrangThai(taiKhoan.trang_thai !== undefined ? taiKhoan.trang_thai : 1);
            } else if (cheDo === "CAP_BAC" && taiKhoan) {
                setTenDangNhap(taiKhoan.ten_dang_nhap || "");
                setHoTen(taiKhoan.ho_ten || "");
                setSoDienThoai(taiKhoan.so_dien_thoai || "");
                setGioiTinh(taiKhoan.gioi_tinh || "Khac");
                setEmail(taiKhoan.email || "");
                setRole(taiKhoan.role || "NHAN_VIEN");
                setTrangThai(taiKhoan.trang_thai !== undefined ? taiKhoan.trang_thai : 1);
            } else {
                setTenDangNhap("");
                setHoTen("");
                setSoDienThoai("");
                setGioiTinh("Khac");
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

        try {
            if (cheDo === "CAP_BAC") {
                const roleMoi = hanhDongCapBac === "THANG_CAP"
                    ? layRoleTiepTheo(role)
                    : layRoleTruoc(role);

                if (!roleMoi) {
                    throw new Error("Không thể thực hiện thao tác này thêm nữa");
                }

                await onSave({ huong: hanhDongCapBac });
            } else {
                const data = {
                    ten_dang_nhap: tenDangNhap.trim(),
                    email: email.trim() || null,
                    role,
                    trang_thai: Number(trangThai),
                    ho_ten: hoTen.trim(),
                    so_dien_thoai: soDienThoai.trim() || null,
                    gioi_tinh: gioiTinh
                };

                if (cheDo === "THEM") {
                    if (!matKhau) {
                        setLoi("Vui lòng nhập mật khẩu cho tài khoản mới");
                        setDangXuLy(false);
                        return;
                    }
                    data.mat_khau = matKhau;
                } else {
                    if (matKhau.trim() !== "") {
                        data.mat_khau = matKhau;
                    }
                }

                await onSave(data);
            }

            onClose();
        } catch (err) {
            setLoi(err.message || "Lỗi khi lưu thông tin");
        } finally {
            setDangXuLy(false);
        }
    }

    const laChinhMinh = taiKhoan && Number(taiKhoan.id) === Number(nguoiDungHienTai.id);
    const roleHienTai = taiKhoan?.role || role;
    const roleTiepTheo = layRoleTiepTheo(roleHienTai);
    const roleTruoc = layRoleTruoc(roleHienTai);
    const roleMucTieu = hanhDongCapBac === "THANG_CAP" ? roleTiepTheo : roleTruoc;
    const capHienTai = layCapDo(roleHienTai);
    const capMucTieu = layCapDo(roleMucTieu);

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{cheDo === "THEM" ? "Tạo tài khoản mới" : cheDo === "CAP_BAC" ? "Thăng cấp / hạ cấp vai trò" : "Chỉnh sửa tài khoản"}</h3>
                    <button className="nut-dong-modal" type="button" onClick={onClose} disabled={dangXuLy}>×</button>
                </div>
                <form onSubmit={xuLySubmit}>
                    <div className="modal-body">
                        {loi && <div className="thong-bao-loi">{loi}</div>}

                        {cheDo === "CAP_BAC" ? (
                            <>
                                <div className="nhom-o-nhap">
                                    <label>Tài khoản đang chọn</label>
                                    <div className="thong-tin-cap-bac">
                                        <strong>{taiKhoan?.ten_dang_nhap || ""}</strong>
                                        <span>Vai trò hiện tại: {taiKhoan?.role || ""}</span>
                                    </div>
                                </div>

                                <div className="nhom-o-nhap">
                                    <label>Chọn thao tác</label>
                                    <div className="nho-m-nut-cap-bac">
                                        <button
                                            type="button"
                                            className={`nut-cap-bac ${hanhDongCapBac === "THANG_CAP" ? "active" : ""}`}
                                            onClick={() => setHanhDongCapBac("THANG_CAP")}
                                            disabled={!roleTiepTheo}
                                        >
                                            ⬆️ Thăng cấp
                                        </button>
                                        <button
                                            type="button"
                                            className={`nut-cap-bac ${hanhDongCapBac === "HA_CAP" ? "active" : ""}`}
                                            onClick={() => setHanhDongCapBac("HA_CAP")}
                                            disabled={!roleTruoc}
                                        >
                                            ⬇️ Hạ cấp
                                        </button>
                                    </div>
                                </div>

                                <div className="nhom-o-nhap">
                                    <label>Xem trước thay đổi</label>
                                    <div className="preview-cap-bac">
                                        <div className="preview-hang">
                                            <span>Hiện tại</span>
                                            <strong>{roleHienTai || "—"}</strong>
                                            <div className="cap-do-hien-thi">
                                                {Array.from({ length: 3 }).map((_, index) => (
                                                    <span key={`cur-${index}`} className={`cap-do-vach ${index < capHienTai ? "active" : ""}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="preview-hang">
                                            <span>Sau thay đổi</span>
                                            <strong>{roleMucTieu || "—"}</strong>
                                            <div className="cap-do-hien-thi">
                                                {Array.from({ length: 3 }).map((_, index) => (
                                                    <span key={`next-${index}`} className={`cap-do-vach ${index < capMucTieu ? "active" : ""}`} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="nhom-o-nhap">
                                    <label htmlFor="modal_ten_dang_nhap">Tên đăng nhập *</label>
                                    <input
                                        id="modal_ten_dang_nhap"
                                        type="text"
                                        value={tenDangNhap}
                                        onChange={(e) => setTenDangNhap(e.target.value)}
                                        required
                                        disabled={laChinhMinh || cheDo === "SUA"}
                                    />
                                </div>

                                <div className="nhom-o-nhap">
                                    <label htmlFor="modal_ho_ten">Họ và tên *</label>
                                    <input
                                        id="modal_ho_ten"
                                        type="text"
                                        value={hoTen}
                                        onChange={(e) => setHoTen(e.target.value)}
                                        required
                                        placeholder="Nguyễn Văn A"
                                    />
                                </div>

                                <div className="nhom-o-nhap">
                                    <label htmlFor="modal_gioi_tinh">Giới tính *</label>
                                    <select
                                        id="modal_gioi_tinh"
                                        value={gioiTinh}
                                        onChange={(e) => setGioiTinh(e.target.value)}
                                        required
                                    >
                                        <option value="Nam">Nam</option>
                                        <option value="Nu">Nữ</option>
                                        <option value="Khac">Khác</option>
                                    </select>
                                </div>

                                <div className="nhom-o-nhap">
                                    <label htmlFor="modal_so_dien_thoai">Số điện thoại</label>
                                    <input
                                        id="modal_so_dien_thoai"
                                        type="text"
                                        value={soDienThoai}
                                        onChange={(e) => setSoDienThoai(e.target.value)}
                                        placeholder="0987654321"
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
                                        disabled={laChinhMinh}
                                    >
                                        <option value="ADMIN">Quản trị viên (ADMIN)</option>
                                        <option value="LEADER_KHU_VUC">Trưởng khu vực (LEADER_KHU_VUC)</option>
                                        <option value="LEADER_LINE">Trưởng dây chuyền (LEADER_LINE)</option>
                                        <option value="NHAN_VIEN">Nhân viên (NHAN_VIEN)</option>
                                    </select>
                                </div>

                                <div className="nhom-o-nhap-checkbox">
                                    <label htmlFor="modal_trang_thai">Trạng thái hoạt động</label>
                                    <select
                                        id="modal_trang_thai"
                                        value={trangThai}
                                        onChange={(e) => setTrangThai(Number(e.target.value))}
                                        disabled={laChinhMinh}
                                    >
                                        <option value={1}>Hoạt động</option>
                                        <option value={0}>Bị khóa</option>
                                    </select>
                                </div>
                            </>
                        )}
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
                            {dangXuLy ? "Đang lưu..." : cheDo === "CAP_BAC" ? "Xác nhận" : "Lưu thay đổi"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal.jsx";
import { layDanhSachDayChuyen } from "../../day-chuyen/services/dayChuyen.service.js";

function layRoleTiepTheo(roleHienTai) {
    if (roleHienTai === "NHAN_VIEN") return "LEADER_LINE";
    if (roleHienTai === "LEADER_LINE") return "LEADER_KHU_VUC";
    if (roleHienTai === "LEADER_KHU_VUC") return "MANAGER";
    return null;
}

function layRoleTruoc(roleHienTai) {
    if (roleHienTai === "MANAGER") return "LEADER_KHU_VUC";
    if (roleHienTai === "LEADER_KHU_VUC") return "LEADER_LINE";
    if (roleHienTai === "LEADER_LINE") return "NHAN_VIEN";
    return null;
}

export default function ModalTaiKhoan({ isOpen, cheDo, taiKhoan, onClose, onSave, nguoiDungHienTai }) {
    const [tenDangNhap, setTenDangNhap] = useState("");
    const [hoTen, setHoTen] = useState("");
    const [soDienThoai, setSoDienThoai] = useState("");
    const [gioiTinh, setGioiTinh] = useState("Khac");
    const [email, setEmail] = useState("");
    const [matKhau, setMatKhau] = useState("");
    const [role, setRole] = useState("NHAN_VIEN");
    const [trangThai, setTrangThai] = useState(1);
    const [dayChuyenId, setDayChuyenId] = useState(""); // Dây chuyền cố định
    
    const [danhSachDayChuyen, setDanhSachDayChuyen] = useState([]);
    const [loi, setLoi] = useState("");
    const [dangXuLy, setDangXuLy] = useState(false);
    const [hanhDongCapBac, setHanhDongCapBac] = useState("THANG_CAP");

    useEffect(() => {
        if (isOpen) {
            setLoi("");
            setMatKhau("");
            setHanhDongCapBac("THANG_CAP");
            taiDayChuyenOption();

            if (cheDo === "SUA" && taiKhoan) {
                setTenDangNhap(taiKhoan.ten_dang_nhap || "");
                setHoTen(taiKhoan.ho_ten || "");
                setSoDienThoai(taiKhoan.so_dien_thoai || "");
                setGioiTinh(taiKhoan.gioi_tinh || "Khac");
                setEmail(taiKhoan.email || "");
                setRole(taiKhoan.role || "NHAN_VIEN");
                setTrangThai(taiKhoan.trang_thai !== undefined ? taiKhoan.trang_thai : 1);
                setDayChuyenId(taiKhoan.day_chuyen_id || "");
            } else if (cheDo === "CAP_BAC" && taiKhoan) {
                setTenDangNhap(taiKhoan.ten_dang_nhap || "");
                setHoTen(taiKhoan.ho_ten || "");
                setSoDienThoai(taiKhoan.so_dien_thoai || "");
                setGioiTinh(taiKhoan.gioi_tinh || "Khac");
                setEmail(taiKhoan.email || "");
                setRole(taiKhoan.role || "NHAN_VIEN");
                setTrangThai(taiKhoan.trang_thai !== undefined ? taiKhoan.trang_thai : 1);
                setDayChuyenId(taiKhoan.day_chuyen_id || "");
            } else {
                setTenDangNhap("");
                setHoTen("");
                setSoDienThoai("");
                setGioiTinh("Khac");
                setEmail("");
                setRole("NHAN_VIEN");
                setTrangThai(1);
                setDayChuyenId("");
            }
        }
    }, [isOpen, cheDo, taiKhoan]);

    async function taiDayChuyenOption() {
        try {
            const res = await layDanhSachDayChuyen();
            if (res.success) {
                setDanhSachDayChuyen(res.data);
            }
        } catch (err) {
            console.error("Lỗi khi tải danh mục dây chuyền:", err);
        }
    }

    if (!isOpen) return null;

    const laChinhMinh = taiKhoan && nguoiDungHienTai && Number(taiKhoan.id) === Number(nguoiDungHienTai.id);

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
                onClose();
            } else {
                const data = {
                    ten_dang_nhap: tenDangNhap.trim(),
                    email: email.trim() || null,
                    role,
                    trang_thai: Number(trangThai),
                    ho_ten: hoTen.trim(),
                    so_dien_thoai: soDienThoai.trim() || null,
                    gioi_tinh: gioiTinh,
                    day_chuyen_id: dayChuyenId ? Number(dayChuyenId) : null
                };

                if (cheDo === "THEM") {
                    if (!matKhau) {
                        setLoi("Vui lòng nhập mật khẩu cho tài khoản mới");
                        setDangXuLy(false);
                        return;
                    }
                    data.mat_khau = matKhau;
                } else if (cheDo === "SUA" && matKhau) {
                    data.mat_khau = matKhau;
                }

                await onSave(data);
                onClose();
            }
        } catch (err) {
            setLoi(err.message || "Lỗi khi lưu thông tin");
        } finally {
            setDangXuLy(false);
        }
    }

    const nutFooter = (
        <>
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
                form="form-tai-khoan"
                className="nut-chinh nut-luu" 
                disabled={dangXuLy}
            >
                {dangXuLy ? "Đang lưu..." : cheDo === "CAP_BAC" ? "Xác nhận" : "Lưu thay đổi"}
            </button>
        </>
    );

    const tieuDeModal = cheDo === "THEM" 
        ? "Thêm tài khoản mới" 
        : cheDo === "CAP_BAC" 
            ? `Thay đổi cấp bậc: ${hoTen || tenDangNhap}`
            : `Chỉnh sửa tài khoản: ${tenDangNhap}`;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={tieuDeModal}
            footer={nutFooter}
            isSubmitting={dangXuLy}
        >
            <form id="form-tai-khoan" onSubmit={xuLySubmit}>
                {loi && <div className="thong-bao-loi">{loi}</div>}

                {cheDo === "CAP_BAC" ? (
                    <div className="khung-chuyen-cap-bac">
                        <p style={{ fontSize: "14px", margin: "0 0 12px 0" }}>
                            Vai trò hiện tại: <strong style={{ color: "var(--amber-dark)" }}>{role}</strong>
                        </p>

                        <div className="nhom-chon-chieu" style={{ display: "flex", gap: "20px", marginBottom: "16px" }}>
                            {layRoleTiepTheo(role) && (
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                    <input
                                        type="radio"
                                        name="hanhDongCapBac"
                                        value="THANG_CAP"
                                        checked={hanhDongCapBac === "THANG_CAP"}
                                        onChange={(e) => setHanhDongCapBac(e.target.value)}
                                    />
                                    Thăng cấp lên: <strong>{layRoleTiepTheo(role)}</strong>
                                </label>
                            )}

                            {layRoleTruoc(role) && (
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                    <input
                                        type="radio"
                                        name="hanhDongCapBac"
                                        value="HA_CAP"
                                        checked={hanhDongCapBac === "HA_CAP"}
                                        onChange={(e) => setHanhDongCapBac(e.target.value)}
                                    />
                                    Hạ cấp xuống: <strong>{layRoleTruoc(role)}</strong>
                                </label>
                            )}
                        </div>
                    </div>
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
                                disabled={cheDo === "SUA"}
                                placeholder="Viết liền, không dấu, ví dụ: dinhlv"
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

                        <div className="hang-doi-nhom">
                            <div className="nhom-o-nhap" style={{ flex: 1 }}>
                                <label htmlFor="modal_so_dien_thoai">Số điện thoại</label>
                                <input
                                    id="modal_so_dien_thoai"
                                    type="tel"
                                    value={soDienThoai}
                                    onChange={(e) => setSoDienThoai(e.target.value)}
                                    placeholder="09XXXXXXXX"
                                />
                            </div>

                            <div className="nhom-o-nhap" style={{ flex: 1 }}>
                                <label htmlFor="modal_gioi_tinh">Giới tính</label>
                                <select
                                    id="modal_gioi_tinh"
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
                            <label htmlFor="modal_email">Email liên kết</label>
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
                            <label htmlFor="modal_day_chuyen">Dây chuyền cố định</label>
                            <select
                                id="modal_day_chuyen"
                                value={dayChuyenId}
                                onChange={(e) => setDayChuyenId(e.target.value)}
                            >
                                <option value="">-- Chưa gán dây chuyền cố định --</option>
                                {danhSachDayChuyen.map(dc => (
                                    <option key={dc.id} value={dc.id}>
                                        {dc.ten_day_chuyen} ({dc.ten_khu_vuc})
                                    </option>
                                ))}
                            </select>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", display: "block" }}>
                                * Thiết lập dây chuyền làm việc cố định (nhân viên có thể thay đổi bất cứ lúc nào).
                            </span>
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
                                <option value="MANAGER">Trưởng phòng sản xuất (MANAGER)</option>
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
            </form>
        </Modal>
    );
}

import { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal.jsx";
import { layDanhSachDayChuyen } from "../../day-chuyen/services/dayChuyen.service.js";
import { layDanhSachCaLam } from "../../ca-lam/services/caLam.service.js";

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
    const [caLamId, setCaLamId] = useState(""); // Ca làm việc cố định
    const [diaChi, setDiaChi] = useState("");
    const [ngaySinh, setNgaySinh] = useState("");
    const [coXoayCa, setCoXoayCa] = useState(true);
    
    const [danhSachDayChuyen, setDanhSachDayChuyen] = useState([]);
    const [danhSachCaLam, setDanhSachCaLam] = useState([]);
    const [loi, setLoi] = useState("");
    const [dangXuLy, setDangXuLy] = useState(false);
    const [hanhDongCapBac, setHanhDongCapBac] = useState("THANG_CAP");

    useEffect(() => {
        if (isOpen) {
            setLoi("");
            setMatKhau("");
            setHanhDongCapBac("THANG_CAP");
            taiDayChuyenOption();
            taiCaLamOption();

            if (cheDo === "SUA" && taiKhoan) {
                setTenDangNhap(taiKhoan.ten_dang_nhap || "");
                setHoTen(taiKhoan.ho_ten || "");
                setSoDienThoai(taiKhoan.so_dien_thoai || "");
                setGioiTinh(taiKhoan.gioi_tinh || "Khac");
                setEmail(taiKhoan.email || "");
                setRole(taiKhoan.role || "NHAN_VIEN");
                setTrangThai(taiKhoan.trang_thai !== undefined ? taiKhoan.trang_thai : 1);
                setDayChuyenId(taiKhoan.day_chuyen_id || "");
                setCaLamId(taiKhoan.ca_lam_id || "");
                setDiaChi(taiKhoan.dia_chi || "");
                setNgaySinh(taiKhoan.ngay_sinh ? new Date(taiKhoan.ngay_sinh).toISOString().slice(0, 10) : "");
                setCoXoayCa(taiKhoan.co_xoay_ca !== 0);
            } else if (cheDo === "CAP_BAC" && taiKhoan) {
                setTenDangNhap(taiKhoan.ten_dang_nhap || "");
                setHoTen(taiKhoan.ho_ten || "");
                setSoDienThoai(taiKhoan.so_dien_thoai || "");
                setGioiTinh(taiKhoan.gioi_tinh || "Khac");
                setEmail(taiKhoan.email || "");
                setRole(taiKhoan.role || "NHAN_VIEN");
                setTrangThai(taiKhoan.trang_thai !== undefined ? taiKhoan.trang_thai : 1);
                setDayChuyenId(taiKhoan.day_chuyen_id || "");
                setCaLamId(taiKhoan.ca_lam_id || "");
                setDiaChi(taiKhoan.dia_chi || "");
                setNgaySinh(taiKhoan.ngay_sinh ? new Date(taiKhoan.ngay_sinh).toISOString().slice(0, 10) : "");
                setCoXoayCa(taiKhoan.co_xoay_ca !== 0);
            } else {
                setTenDangNhap("");
                setHoTen("");
                setSoDienThoai("");
                setGioiTinh("Khac");
                setEmail("");
                setRole("NHAN_VIEN");
                setTrangThai(1);
                setDayChuyenId("");
                setCaLamId("");
                setDiaChi("");
                setNgaySinh("");
                setCoXoayCa(true);
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

    async function taiCaLamOption() {
        try {
            const res = await layDanhSachCaLam();
            if (res.success) {
                setDanhSachCaLam(res.data.filter(c => c.loai_ca === "THUONG"));
            }
        } catch (err) {
            console.error("Lỗi khi tải danh mục ca làm:", err);
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
                if (cheDo === "THEM" && !ngaySinh) {
                    throw new Error("Vui lòng điền ngày sinh để khởi tạo mật khẩu mặc định (DDMMYY).");
                }

                const data = {
                    ten_dang_nhap: tenDangNhap.trim(),
                    email: email.trim() || null,
                    role,
                    trang_thai: Number(trangThai),
                    ho_ten: hoTen.trim(),
                    so_dien_thoai: soDienThoai.trim() || null,
                    gioi_tinh: gioiTinh,
                    day_chuyen_id: dayChuyenId ? Number(dayChuyenId) : null,
                    ca_lam_id: caLamId ? Number(caLamId) : null,
                    dia_chi: diaChi.trim() || null,
                    ngay_sinh: ngaySinh || null,
                    co_xoay_ca: coXoayCa ? 1 : 0
                };

                if (cheDo === "THEM") {
                    if (matKhau) {
                        data.mat_khau = matKhau;
                    }
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
        ? "Thêm nhân sự mới" 
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
                            <label htmlFor="modal_ho_ten">Họ và tên *</label>
                            <input
                                id="modal_ho_ten"
                                type="text"
                                value={hoTen}
                                onChange={(e) => setHoTen(e.target.value)}
                                required
                                placeholder="Ví dụ: Nguyễn Văn A"
                            />
                        </div>

                        <div className="hang-doi-nhom">
                            <div className="nhom-o-nhap" style={{ flex: 1 }}>
                                <label htmlFor="modal_ngay_sinh">Ngày tháng năm sinh *</label>
                                <input
                                    id="modal_ngay_sinh"
                                    type="date"
                                    value={ngaySinh}
                                    onChange={(e) => setNgaySinh(e.target.value)}
                                    required
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

                        {cheDo === "THEM" && ngaySinh && (
                            <div className="thong-bao-thanh-cong" style={{ fontSize: "12px", padding: "8px 12px", marginBottom: "16px", backgroundColor: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}>
                                💡 Mật khẩu mặc định sẽ tự động tạo từ ngày sinh: <strong>
                                    {String(ngaySinh.split("-")[2])}{String(ngaySinh.split("-")[1])}{String(ngaySinh.split("-")[0].slice(-2))}
                                </strong> (Định dạng DDMMYY).
                            </div>
                        )}

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
                                <label htmlFor="modal_ten_dang_nhap">Tên đăng nhập (Mã nhân sự)</label>
                                <input
                                    id="modal_ten_dang_nhap"
                                    type="text"
                                    value={tenDangNhap}
                                    onChange={(e) => setTenDangNhap(e.target.value)}
                                    disabled={cheDo === "SUA"}
                                    placeholder="Để trống sẽ tự tăng (DP_01, DP_02...)"
                                />
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
                            <label htmlFor="modal_dia_chi">Địa chỉ thường trú</label>
                            <input
                                id="modal_dia_chi"
                                type="text"
                                value={diaChi}
                                onChange={(e) => setDiaChi(e.target.value)}
                                placeholder="Số nhà, Tên đường, Quận/Huyện, Tỉnh/Thành..."
                            />
                        </div>

                        <div className="nhom-o-nhap">
                            <label htmlFor="modal_mat_khau">
                                Mật khẩu {cheDo === "SUA" ? "(để trống nếu giữ nguyên)" : "(tùy chọn)"}
                            </label>
                            <input
                                id="modal_mat_khau"
                                type="password"
                                value={matKhau}
                                onChange={(e) => setMatKhau(e.target.value)}
                                placeholder={cheDo === "SUA" ? "••••••••" : "Để trống để tự tạo theo Ngày sinh"}
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
                        </div>

                        <div className="nhom-o-nhap">
                            <label htmlFor="modal_ca_lam">Ca làm việc cố định</label>
                            <select
                                id="modal_ca_lam"
                                value={caLamId}
                                onChange={(e) => setCaLamId(e.target.value)}
                            >
                                <option value="">-- Chưa gán ca làm việc cố định --</option>
                                {danhSachCaLam.map(ca => (
                                    <option key={ca.id} value={ca.id}>
                                        {ca.ten_ca} {ca.gio_bat_dau ? `(${ca.gio_bat_dau.slice(0, 5)} - ${ca.gio_ket_thuc.slice(0, 5)})` : ""}
                                    </option>
                                ))}
                            </select>
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

                        <div className="nhom-o-nhap-checkbox" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px" }}>
                            <input
                                id="modal_co_xoay_ca"
                                type="checkbox"
                                checked={coXoayCa}
                                onChange={(e) => setCoXoayCa(e.target.checked)}
                                style={{ width: "auto", margin: 0 }}
                            />
                            <label htmlFor="modal_co_xoay_ca" style={{ cursor: "pointer", fontWeight: "600", color: "#1e293b" }}>
                                Cho phép tham gia xoay ca luân phiên (Lịch xoay ca)
                            </label>
                        </div>
                    </>
                )}
            </form>
        </Modal>
    );
}

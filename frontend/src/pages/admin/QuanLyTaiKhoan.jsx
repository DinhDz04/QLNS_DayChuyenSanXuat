import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import RoleBadge from "../../components/admin/RoleBadge.jsx";
import ModalTaiKhoan from "../../components/admin/ModalTaiKhoan.jsx";
import {
    layDanhSachTaiKhoan,
    taoTaiKhoanAdmin,
    capNhatTaiKhoanAdmin,
    xoaTaiKhoanAdmin
} from "../../servives/admin/taiKhoan.service.js";

export default function QuanLyTaiKhoan() {
    const { nguoiDung, dangXuat } = useAuth();
    const navigate = useNavigate();

    const [danhSach, setDanhSach] = useState([]);
    const [dangTai, setDangTai] = useState(true);
    const [loi, setLoi] = useState("");
    const [thongBao, setThongBao] = useState("");

    // State cho Modal thêm/sửa
    const [modalHienThi, setModalHienThi] = useState(false);
    const [modalCheDo, setModalCheDo] = useState("THEM"); // "THEM" hoặc "SUA"
    const [taiKhoanDangChon, setTaiKhoanDangChon] = useState(null);

    useEffect(() => {
        TaiDanhSach();
    }, []);

    async function TaiDanhSach() {
        setDangTai(true);
        setLoi("");
        try {
            const response = await layDanhSachTaiKhoan();
            if (response.success) {
                setDanhSach(response.data);
            }
        } catch (err) {
            setLoi(err.message || "Không thể tải danh sách tài khoản");
        } finally {
            setDangTai(false);
        }
    }

    function hienThiModalThem() {
        setModalCheDo("THEM");
        setTaiKhoanDangChon(null);
        setLoi("");
        setModalHienThi(true);
    }

    function hienThiModalSua(tk) {
        setModalCheDo("SUA");
        setTaiKhoanDangChon(tk);
        setLoi("");
        setModalHienThi(true);
    }

    async function handleSave(data) {
        if (modalCheDo === "THEM") {
            const res = await taoTaiKhoanAdmin(data);
            if (res.success) {
                hienThongBao("Đã thêm tài khoản mới thành công!");
                TaiDanhSach();
            }
        } else {
            const res = await capNhatTaiKhoanAdmin(taiKhoanDangChon.id, data);
            if (res.success) {
                hienThongBao("Đã cập nhật thông tin tài khoản!");
                TaiDanhSach();
            }
        }
    }

    async function xuLyXoa(id, ten) {
        if (Number(id) === Number(nguoiDung.id)) {
            alert("Bạn không thể tự xóa tài khoản của chính mình!");
            return;
        }

        if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${ten}"? Việc này cũng sẽ gỡ liên kết với nhân viên (nếu có).`)) {
            try {
                const res = await xoaTaiKhoanAdmin(id);
                if (res.success) {
                    hienThongBao("Đã xóa tài khoản thành công!");
                    TaiDanhSach();
                }
            } catch (err) {
                alert(err.message || "Không thể xóa tài khoản");
            }
        }
    }

    function hienThongBao(msg) {
        setThongBao(msg);
        setTimeout(() => setThongBao(""), 4000);
    }

    function formatNgay(chuoiNgay) {
        if (!chuoiNgay) return "-";
        const d = new Date(chuoiNgay);
        return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
    }

    return (
        <div className="quan-ly-tai-khoan-container">
            <div className="vach-day-chuyen" />
            
            <nav className="thanh-dieu-huong">
                <div className="logo-section" onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>
                    <div className="logo">QLNS<span>•</span>DÂY CHUYỀN</div>
                    <span className="sub-logo-text">ADMIN CONTROL PANEL</span>
                </div>
                <div className="khu-nguoi-dung">
                    <span>{nguoiDung.ten_dang_nhap}</span>
                    <RoleBadge role={nguoiDung.role} />
                    <button className="nut-quay-lai" onClick={() => navigate("/dashboard")}>
                        Bảng điều khiển
                    </button>
                    <button className="nut-dang-xuat" onClick={() => { dangXuat(); navigate("/dang-nhap"); }}>
                        Đăng xuất
                    </button>
                </div>
            </nav>

            <main className="noi-dung-admin">
                <div className="admin-header-bar">
                    <div className="tieu-de-khoi">
                        <h2>Quản lý tài khoản hệ thống</h2>
                        <p>Danh sách tài khoản đăng nhập và phân quyền nhân viên dây chuyền</p>
                    </div>
                    <button className="nut-chinh nut-them-moi" onClick={hienThiModalThem}>
                        + Thêm tài khoản mới
                    </button>
                </div>

                {thongBao && <div className="thong-bao-thanh-cong">{thongBao}</div>}
                {loi && <div className="thong-bao-loi">{loi}</div>}

                <div className="bang-du-lieu-wrapper">
                    {dangTai ? (
                        <div className="man-hinh-dang-tai">Đang tải danh sách tài khoản...</div>
                    ) : (
                        <table className="bang-du-lieu">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Tên đăng nhập</th>
                                    <th>Email</th>
                                    <th>Vai trò</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                    <th style={{ textAlign: "center" }}>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {danhSach.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                                            Chưa có tài khoản nào trong hệ thống
                                        </td>
                                    </tr>
                                ) : (
                                    danhSach.map((tk) => (
                                        <tr key={tk.id} className={Number(tk.id) === Number(nguoiDung.id) ? "dong-hien-tai" : ""}>
                                            <td>{tk.id}</td>
                                            <td>
                                                <strong>{tk.ten_dang_nhap}</strong>
                                                {Number(tk.id) === Number(nguoiDung.id) && <span className="nhan-ban-than"> (Bạn)</span>}
                                            </td>
                                            <td>{tk.email || <span className="text-unspecified">Chưa cập nhật</span>}</td>
                                            <td>
                                                <RoleBadge role={tk.role} />
                                            </td>
                                            <td>
                                                {tk.trang_thai === 1 ? (
                                                    <span className="trang-thai-badge active">Hoạt động</span>
                                                ) : (
                                                    <span className="trang-thai-badge locked">Bị khóa</span>
                                                )}
                                            </td>
                                            <td>{formatNgay(tk.created_at)}</td>
                                            <td style={{ textAlign: "center" }}>
                                                <div className="nhom-nut-hanh-dong">
                                                    <button 
                                                        className="nut-hanh-dong nut-sua" 
                                                        onClick={() => hienThiModalSua(tk)}
                                                        title="Sửa thông tin"
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button 
                                                        className="nut-hanh-dong nut-xoa" 
                                                        onClick={() => xuLyXoa(tk.id, tk.ten_dang_nhap)}
                                                        disabled={Number(tk.id) === Number(nguoiDung.id)}
                                                        title="Xóa tài khoản"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

            <ModalTaiKhoan
                hienThi={modalHienThi}
                cheDo={modalCheDo}
                taiKhoan={taiKhoanDangChon}
                onClose={() => setModalHienThi(false)}
                onSave={handleSave}
                nguoiDungHienTai={nguoiDung}
            />
        </div>
    );
}

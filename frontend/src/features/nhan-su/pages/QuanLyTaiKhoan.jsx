import { useState } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import RoleBadge from "../../../components/ui/Badge.jsx";
import ModalTaiKhoan from "../components/ModalTaiKhoan.jsx";
import { useCrud } from "../../../hooks/useCrud.js";
import {
    layDanhSachTaiKhoan,
    taoTaiKhoanAdmin,
    capNhatTaiKhoanAdmin,
    capNhatCapBacTaiKhoanAdmin,
    xoaTaiKhoanAdmin,
    nhapTaiKhoanTuExcel,
    taiFileMauExcel
} from "../services/nhanSu.service.js";

export default function QuanLyTaiKhoan() {
    const { nguoiDung } = useAuth();
    
    const [dangImportExcel, setDangImportExcel] = useState(false);
    const [ketQuaImport, setKetQuaImport] = useState(null);
    const [loiImport, setLoiImport] = useState("");
    const [tuKhoaTimKiem, setTuKhoaTimKiem] = useState(""); // State tìm kiếm nhân viên

    const {
        danhSach,
        dangTai,
        loi,
        thongBao,
        modalHienThi,
        modalCheDo,
        dangChon,
        taiDanhSach,
        hienModalThem,
        hienModalSua,
        dongModal,
        xuLyXoa,
        hienThongBao,
        setModalCheDo,
        setModalHienThi,
        setDangChon
    } = useCrud(layDanhSachTaiKhoan, taoTaiKhoanAdmin, capNhatTaiKhoanAdmin, xoaTaiKhoanAdmin, "tài khoản");

    function hienThiModalCapBac(tk) {
        setModalCheDo("CAP_BAC");
        setDangChon(tk);
        setModalHienThi(true);
    }

    async function handleSave(data) {
        try {
            if (modalCheDo === "THEM") {
                const res = await taoTaiKhoanAdmin(data);
                if (res.success) {
                    hienThongBao("Đã thêm tài khoản mới thành công!");
                    await taiDanhSach();
                }
            } else if (modalCheDo === "CAP_BAC") {
                const res = await capNhatCapBacTaiKhoanAdmin(dangChon.id, data.huong);
                if (res.success) {
                    hienThongBao("Đã cập nhật vai trò tài khoản!");
                    await taiDanhSach();
                }
            } else {
                const res = await capNhatTaiKhoanAdmin(dangChon.id, data);
                if (res.success) {
                    hienThongBao("Đã cập nhật thông tin tài khoản!");
                    await taiDanhSach();
                }
            }
            dongModal();
        } catch (err) {
            alert(err.message || "Lỗi khi lưu thông tin");
        }
    }

    async function xuLyNhapExcel(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        setDangImportExcel(true);
        setLoiImport("");
        setKetQuaImport(null);

        try {
            const res = await nhapTaiKhoanTuExcel(file);
            if (res.success) {
                setKetQuaImport(res.data);
                hienThongBao("Đã nhập tài khoản bằng Excel thành công!");
                await taiDanhSach();
            } else {
                throw new Error(res.message || "Không thể nhập tài khoản từ Excel");
            }
        } catch (err) {
            setLoiImport(err.message || "Không thể nhập tài khoản từ Excel");
        } finally {
            setDangImportExcel(false);
            e.target.value = "";
        }
    }

    async function xuLyTaiFileMauExcel() {
        try {
            await taiFileMauExcel();
        } catch (err) {
            setLoiImport(err.message || "Không thể tải file mẫu Excel");
        }
    }

    function formatNgay(chuoiNgay) {
        if (!chuoiNgay) return "-";
        const d = new Date(chuoiNgay);
        return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
    }

    // Lọc danh sách tài khoản/nhân viên theo từ khóa tìm kiếm
    const danhSachLoc = danhSach.filter((tk) => {
        const search = tuKhoaTimKiem.toLowerCase().trim();
        if (!search) return true;
        return (
            tk.ten_dang_nhap.toLowerCase().includes(search) ||
            (tk.ho_ten && tk.ho_ten.toLowerCase().includes(search)) ||
            (tk.ma_nhan_vien && tk.ma_nhan_vien.toLowerCase().includes(search)) ||
            (tk.email && tk.email.toLowerCase().includes(search)) ||
            (tk.so_dien_thoai && tk.so_dien_thoai.toLowerCase().includes(search)) ||
            (tk.ten_day_chuyen && tk.ten_day_chuyen.toLowerCase().includes(search))
        );
    });

    return (
        <div className="quan-ly-tai-khoan-container">
            <main className="noi-dung-admin">
                <div className="admin-header-bar">
                    <div className="tieu-de-khoi">
                        <h2>Quản lý tài khoản hệ thống</h2>
                        <p>Danh sách tài khoản đăng nhập và phân quyền nhân viên dây chuyền</p>
                    </div>
                    <div className="nhom-nut-admin">
                        <label className="nut-import-excel">
                            <input type="file" accept=".xlsx,.xls" onChange={xuLyNhapExcel} />
                            {dangImportExcel ? "Đang nhập..." : "Nhập bằng Excel"}
                        </label>
                        <button className="nut-chinh nut-them-moi" onClick={hienModalThem}>
                            + Thêm tài khoản mới
                        </button>
                    </div>
                </div>

                {thongBao && <div className="thong-bao-thanh-cong">{thongBao}</div>}
                {loi && <div className="thong-bao-loi">{loi}</div>}
                {loiImport && <div className="thong-bao-loi">{loiImport}</div>}

                {/* Thanh tìm kiếm và ghi chú */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "260px" }}>
                        <input
                            type="text"
                            placeholder="🔍 Tìm kiếm theo tên, mã nhân viên, SĐT, dây chuyền..."
                            value={tuKhoaTimKiem}
                            onChange={(e) => setTuKhoaTimKiem(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px 14px",
                                border: "1px solid #cbd5e1",
                                borderRadius: "var(--radius)",
                                fontSize: "14px"
                            }}
                        />
                    </div>
                    <div className="ghi-chu-import-excel" style={{ margin: 0 }}>
                        <span>Nhập tài khoản bằng Excel hoặc </span>
                        <button
                            type="button"
                            className="nut-hanh-dong nut-sua"
                            onClick={xuLyTaiFileMauExcel}
                            style={{ padding: "6px 10px", marginLeft: "6px" }}
                        >
                            Tải file mẫu Excel
                        </button>
                    </div>
                </div>

                {ketQuaImport && (
                    <div className="thong-bao-thanh-cong">
                        Đã nhập {ketQuaImport.tong_so_dong} dòng. Thành công {ketQuaImport.so_thanh_cong}, lỗi {ketQuaImport.so_loi}.
                    </div>
                )}

                <div className="bang-du-lieu-wrapper">
                    {dangTai ? (
                        <div className="man-hinh-dang-tai">Đang tải danh sách tài khoản...</div>
                    ) : (
                        <table className="bang-du-lieu">
                            <thead>
                                <tr>
                                    <th>Mã NV</th>
                                    <th>Tên đăng nhập</th>
                                    <th>Họ và tên</th>
                                    <th>Giới tính</th>
                                    <th>Số điện thoại</th>
                                    <th>Dây chuyền cố định</th>
                                    <th>Vai trò</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                    <th style={{ textAlign: "center" }}>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {danhSachLoc.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                                            Không tìm thấy tài khoản nào khớp với từ khóa tìm kiếm
                                        </td>
                                    </tr>
                                ) : (
                                    danhSachLoc.map((tk) => (
                                        <tr
                                            key={tk.id}
                                            className={`${Number(tk.id) === Number(nguoiDung.id) ? "dong-hien-tai" : ""} ${tk.role === "NHAN_VIEN" ? "dong-nhan-vien" : tk.role === "LEADER_LINE" ? "dong-leader-line" : tk.role === "LEADER_KHU_VUC" ? "dong-leader-khu-vuc" : "dong-admin"}`}
                                        >
                                            <td><strong>{tk.ma_nhan_vien || "-"}</strong></td>
                                            <td>
                                                <strong>{tk.ten_dang_nhap}</strong>
                                                {Number(tk.id) === Number(nguoiDung.id) && <span className="nhan-ban-than"> (Bạn)</span>}
                                            </td>
                                            <td>{tk.ho_ten || <span className="text-unspecified">Chưa cập nhật</span>}</td>
                                            <td>{tk.gioi_tinh || "-"}</td>
                                            <td>{tk.so_dien_thoai || "-"}</td>
                                            <td>
                                                {tk.ten_day_chuyen ? (
                                                    <span style={{ fontWeight: 600, color: "var(--primary-color)" }}>{tk.ten_day_chuyen}</span>
                                                ) : (
                                                    <span className="text-unspecified" style={{ fontStyle: "italic" }}>Chưa gán cố định</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="cell-role-stack">
                                                    <RoleBadge role={tk.role} />
                                                </div>
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
                                                        onClick={() => hienModalSua(tk)}
                                                        title="Sửa thông tin tài khoản"
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button 
                                                        className="nut-hanh-dong nut-vai-tro" 
                                                        onClick={() => hienThiModalCapBac(tk)}
                                                        title="Thăng cấp / hạ cấp vai trò"
                                                        style={{ backgroundColor: "#ef9a9a", color: "#b71c1c", marginRight: "4px" }}
                                                    >
                                                        Vai trò
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
                isOpen={modalHienThi}
                cheDo={modalCheDo}
                taiKhoan={dangChon}
                onClose={dongModal}
                onSave={handleSave}
                nguoiDungHienTai={nguoiDung}
            />
        </div>
    );
}

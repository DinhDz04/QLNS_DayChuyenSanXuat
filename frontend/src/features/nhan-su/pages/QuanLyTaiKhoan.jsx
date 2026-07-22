import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import RoleBadge from "../../../components/ui/Badge.jsx";
import ModalTaiKhoan from "../components/ModalTaiKhoan.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import { useCrud } from "../../../hooks/useCrud.js";
import {
    layDanhSachTaiKhoan,
    taoTaiKhoanAdmin,
    capNhatTaiKhoanAdmin,
    capNhatCapBacTaiKhoanAdmin,
    xoaTaiKhoanAdmin,
    nhapTaiKhoanTuExcel,
    taiFileMauExcel,
    layLichSuPhanCong,
    ganCaLamHangLoat
} from "../services/nhanSu.service.js";
import { layDanhSachCaLam } from "../../ca-lam/services/caLam.service.js";

export default function QuanLyTaiKhoan() {
    const { nguoiDung } = useAuth();
    
    const [dangImportExcel, setDangImportExcel] = useState(false);
    const [ketQuaImport, setKetQuaImport] = useState(null);
    const [loiImport, setLoiImport] = useState("");
    const [tuKhoaTimKiem, setTuKhoaTimKiem] = useState(""); // State tìm kiếm nhân viên
    
    // States cho lọc ca làm cố định
    const [locCaLamId, setLocCaLamId] = useState("tat-ca");
    const [danhSachCaLamOption, setDanhSachCaLamOption] = useState([]);

    // States cho modal xem lịch sử phân công công việc
    const [modalLichSuOpen, setModalLichSuOpen] = useState(false);
    const [lichSuData, setLichSuData] = useState([]);
    const [dangTaiLichSu, setDangTaiLichSu] = useState(false);
    const [nhanVienLichSu, setNhanVienLichSu] = useState(null);

    // States cho gán ca làm hàng loạt
    const [idsDaChon, setIdsDaChon] = useState([]);
    const [modalBatchCaOpen, setModalBatchCaOpen] = useState(false);
    const [batchCaLamId, setBatchCaLamId] = useState("");
    const [dangXuLyBatch, setDangXuLyBatch] = useState(false);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setIdsDaChon(danhSachLoc.map(tk => tk.id));
        } else {
            setIdsDaChon([]);
        }
    };

    const handleSelectRow = (id, checked) => {
        if (checked) {
            setIdsDaChon(prev => [...prev, id]);
        } else {
            setIdsDaChon(prev => prev.filter(item => item !== id));
        }
    };

    const xuLyBatchGanCa = async (e) => {
        e.preventDefault();
        if (idsDaChon.length === 0) return;
        setDangXuLyBatch(true);
        try {
            const res = await ganCaLamHangLoat(idsDaChon, batchCaLamId || null);
            if (res.success) {
                setModalBatchCaOpen(false);
                setIdsDaChon([]);
                setBatchCaLamId("");
                hienThongBao(`Đã thiết lập ca làm việc hàng loạt thành công cho ${idsDaChon.length} nhân sự!`);
                taiDanhSach();
            }
        } catch (err) {
            alert(err.message || "Gán ca hàng loạt thất bại!");
        } finally {
            setDangXuLyBatch(false);
        }
    };

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

    useEffect(() => {
        // Tải danh sách ca làm việc để phục vụ lọc
        layDanhSachCaLam().then(res => {
            if (res.success) {
                setDanhSachCaLamOption(res.data.filter(c => c.loai_ca === "THUONG"));
            }
        }).catch(console.error);
    }, []);

    function hienThiModalCapBac(tk) {
        setModalCheDo("CAP_BAC");
        setDangChon(tk);
        setModalHienThi(true);
    }

    async function handleXemLichSu(tk) {
        setNhanVienLichSu(tk);
        setLichSuData([]);
        setDangTaiLichSu(true);
        setModalLichSuOpen(true);
        try {
            const res = await layLichSuPhanCong(tk.nhan_vien_id);
            if (res.success) {
                setLichSuData(res.data);
            }
        } catch (err) {
            alert(err.message || "Lỗi khi lấy lịch sử phân công");
        } finally {
            setDangTaiLichSu(false);
        }
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

    // Lọc danh sách tài khoản/nhân viên theo bộ lọc ca và từ khóa tìm kiếm
    const danhSachLoc = danhSach.filter((tk) => {
        // 1. Lọc theo Ca làm cố định
        if (locCaLamId !== "tat-ca") {
            if (locCaLamId === "chua-gan") {
                if (tk.ca_lam_id) return false;
            } else {
                if (Number(tk.ca_lam_id) !== Number(locCaLamId)) return false;
            }
        }

        // 2. Lọc theo Từ khóa tìm kiếm
        const search = tuKhoaTimKiem.toLowerCase().trim();
        if (!search) return true;
        return (
            tk.ten_dang_nhap.toLowerCase().includes(search) ||
            (tk.ho_ten && tk.ho_ten.toLowerCase().includes(search)) ||
            (tk.ma_nhan_vien && tk.ma_nhan_vien.toLowerCase().includes(search)) ||
            (tk.email && tk.email.toLowerCase().includes(search)) ||
            (tk.so_dien_thoai && tk.so_dien_thoai.toLowerCase().includes(search)) ||
            (tk.ten_day_chuyen && tk.ten_day_chuyen.toLowerCase().includes(search)) ||
            (tk.ten_ca_lam && tk.ten_ca_lam.toLowerCase().includes(search))
        );
    });



    return (
        <div className="quan-ly-tai-khoan-container">
            <main className="noi-dung-admin">
                <div className="admin-header-bar">
                    <div className="tieu-de-khoi">
                        <h2>Quản lý nhân sự & tài khoản</h2>
                        <p>Danh sách tài khoản đăng nhập và nhân sự của công ty</p>
                    </div>
                    <div className="nhom-nut-admin" style={{ display: "flex", gap: "8px" }}>
                        {idsDaChon.length > 0 && (
                            <button 
                                className="nut-chinh" 
                                onClick={() => setModalBatchCaOpen(true)}
                                style={{ backgroundColor: "#0284c7", border: "1px solid #0284c7" }}
                                type="button"
                            >
                                ⚙️ Xếp Ca làm cho nhân viên ({idsDaChon.length} đã chọn)
                            </button>
                        )}
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

                <div>
                    <>
                        {/* Bộ lọc nâng cao */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
                            <div style={{ display: "flex", gap: "12px", flex: 1, minWidth: "300px" }}>
                                <div style={{ flex: 1 }}>
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

                                <div style={{ width: "220px" }}>
                                    <select
                                        value={locCaLamId}
                                        onChange={(e) => setLocCaLamId(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "var(--radius)",
                                            fontSize: "14px",
                                            backgroundColor: "#fff",
                                            fontWeight: "bold",
                                            color: "#1c2128"
                                        }}
                                    >
                                        <option value="tat-ca">-- Lọc theo Nhóm Ca --</option>
                                        {danhSachCaLamOption.map(ca => (
                                            <option key={ca.id} value={ca.id}>Nhóm Ca: {ca.ten_ca}</option>
                                        ))}
                                        <option value="chua-gan">Chưa gán Ca cố định</option>
                                    </select>
                                </div>
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
                                            <th style={{ width: "40px", textAlign: "center" }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={danhSachLoc.length > 0 && idsDaChon.length === danhSachLoc.length} 
                                                    onChange={handleSelectAll} 
                                                />
                                            </th>
                                            <th>Mã NV</th>
                                            <th>Tên đăng nhập</th>
                                            <th>Họ và tên</th>
                                            <th>Giới tính</th>
                                            <th>Số điện thoại</th>
                                            <th>Ngày sinh</th>
                                            <th>Địa chỉ</th>
                                            <th>Xoay ca</th>
                                            <th>Dây chuyền cố định</th>
                                            <th>Ca làm cố định</th>
                                            <th>Vai trò</th>
                                            <th>Trạng thái</th>
                                            <th>Ngày tạo</th>
                                            <th style={{ textAlign: "center" }}>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {danhSachLoc.length === 0 ? (
                                            <tr>
                                                <td colSpan="15" style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                                                    Không tìm thấy tài khoản nào khớp với bộ lọc hiện tại
                                                </td>
                                            </tr>
                                        ) : (
                                            danhSachLoc.map((tk) => (
                                                <tr
                                                    key={tk.id}
                                                    className={`${Number(tk.id) === Number(nguoiDung.id) ? "dong-hien-tai" : ""} ${tk.role === "NHAN_VIEN" ? "dong-nhan-vien" : tk.role === "LEADER_LINE" ? "dong-leader-line" : tk.role === "LEADER_KHU_VUC" ? "dong-leader-khu-vuc" : "dong-admin"}`}
                                                >
                                                    <td style={{ textAlign: "center" }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={idsDaChon.includes(tk.id)} 
                                                            onChange={(e) => handleSelectRow(tk.id, e.target.checked)} 
                                                        />
                                                    </td>
                                                    <td><strong>{tk.ma_nhan_vien || "-"}</strong></td>
                                                    <td>
                                                        <strong>{tk.ten_dang_nhap}</strong>
                                                        {Number(tk.id) === Number(nguoiDung.id) && <span className="nhan-ban-than"> (Bạn)</span>}
                                                    </td>
                                                    <td>{tk.ho_ten || <span className="text-unspecified">Chưa cập nhật</span>}</td>
                                                    <td>{tk.gioi_tinh || "-"}</td>
                                                    <td>{tk.so_dien_thoai || "-"}</td>
                                                    <td>{tk.ngay_sinh ? new Date(tk.ngay_sinh).toLocaleDateString("vi-VN") : "-"}</td>
                                                    <td>
                                                        <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={tk.dia_chi}>
                                                            {tk.dia_chi || "-"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {tk.co_xoay_ca === 0 ? (
                                                            <span style={{ color: "#d97706", fontWeight: "bold", background: "#fef3c7", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>Khóa ca</span>
                                                        ) : (
                                                            <span style={{ color: "#16a34a", fontWeight: "bold", background: "#dcfce7", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>Xoay ca</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {tk.ten_day_chuyen ? (
                                                            <span style={{ fontWeight: 600, color: "var(--primary-color)" }}>{tk.ten_day_chuyen}</span>
                                                        ) : (
                                                            <span className="text-unspecified" style={{ fontStyle: "italic" }}>Chưa gán cố định</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {tk.ten_ca_lam ? (
                                                            <span style={{ fontWeight: 600, color: "var(--amber-dark)" }}>{tk.ten_ca_lam}</span>
                                                        ) : (
                                                            <span className="text-unspecified" style={{ fontStyle: "italic" }}>Chưa gán ca</span>
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
                                                        <div className="nhom-nut-hanh-dong" style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                                                            <button 
                                                                className="nut-sua nut-hanh-dong" 
                                                                onClick={() => hienModalSua(tk)}
                                                                title="Sửa thông tin tài khoản"
                                                            >
                                                                Sửa
                                                            </button>
                                                            {tk.nhan_vien_id && (
                                                                <button 
                                                                    className="nut-sua nut-hanh-dong" 
                                                                    onClick={() => handleXemLichSu(tk)}
                                                                    title="Xem lịch sử phân công nhân viên"
                                                                    style={{ backgroundColor: "#0284c7", color: "#fff", borderColor: "#0284c7" }}
                                                                >
                                                                    Lịch sử
                                                                </button>
                                                            )}
                                                            <button 
                                                                className="nut-vai-tro nut-hanh-dong" 
                                                                onClick={() => hienThiModalCapBac(tk)}
                                                                title="Thăng cấp / hạ cấp vai trò"
                                                                style={{ backgroundColor: "#ef9a9a", color: "#b71c1c" }}
                                                            >
                                                                Vai trò
                                                            </button>
                                                            <button 
                                                                className="nut-xoa nut-hanh-dong" 
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
                    </>
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

            {/* MODAL XEM LỊCH SỬ PHÂN CÔNG CÔNG VIỆC */}
            {modalLichSuOpen && (
                <Modal
                    isOpen={modalLichSuOpen}
                    onClose={() => setModalLichSuOpen(false)}
                    title={`Lịch sử phân công công việc: ${nhanVienLichSu?.ho_ten || nhanVienLichSu?.ten_dang_nhap}`}
                    footer={
                        <button type="button" className="nut-huy" onClick={() => setModalLichSuOpen(false)}>Đóng</button>
                    }
                >
                    {dangTaiLichSu ? (
                        <p style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontStyle: "italic" }}>
                            Đang tải lịch sử phân công...
                        </p>
                    ) : lichSuData.length === 0 ? (
                        <p style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontStyle: "italic" }}>
                            Nhân viên này chưa từng được phân công công việc nào trên các dây chuyền.
                        </p>
                    ) : (
                        <div style={{ maxHeight: "350px", overflowY: "auto" }}>
                            <table className="bang-du-lieu" style={{ fontSize: "13px" }}>
                                <thead>
                                    <tr>
                                        <th>Ngày</th>
                                        <th>Dây chuyền</th>
                                        <th>Công đoạn sản xuất</th>
                                        <th>Ca gán làm việc</th>
                                        <th>Điểm danh</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lichSuData.map((item, idx) => {
                                        const isDieuDong = item.loai === "DIEU_DONG";
                                        const laVang = item.hanh_dong === "NGHI";
                                        return (
                                            <tr key={idx} style={{ backgroundColor: isDieuDong ? "#f0f9ff" : laVang ? "#fff1f2" : "transparent" }}>
                                                <td>
                                                    <strong>
                                                        {new Date(item.ngay || item.thoi_gian).toLocaleDateString("vi-VN")}
                                                    </strong>
                                                </td>
                                                <td>
                                                    {isDieuDong ? (
                                                        <span style={{ fontSize: "11px", color: "#0369a1", fontWeight: "600" }}>
                                                            🔁 {item.tu_day_chuyen || "Tự do"} ➔ {item.den_day_chuyen || "Tự do"}
                                                        </span>
                                                    ) : (
                                                        item.ten_day_chuyen
                                                    )}
                                                </td>
                                                <td>
                                                    {isDieuDong ? (
                                                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500" }}>
                                                            {item.cong_doan_cu || "Chưa xếp"} ➔ {item.cong_doan_moi || "Chưa xếp"}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "var(--primary-color)", fontWeight: "600" }}>{item.ten_cong_doan}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {isDieuDong ? (
                                                        <em style={{ fontSize: "11px", color: "var(--text-muted)" }}>{item.ly_do}</em>
                                                    ) : (
                                                        <strong>{item.ten_ca || "Mặc định"}</strong>
                                                    )}
                                                </td>
                                                <td>
                                                    {isDieuDong ? (
                                                        <span style={{ color: "#0369a1", fontWeight: "bold", background: "#e0f2fe", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>ĐIỀU ĐỘNG</span>
                                                    ) : laVang ? (
                                                        <span style={{ color: "var(--red)", fontWeight: "bold", background: "#fee2e2", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>VẮNG MẶT</span>
                                                    ) : item.hanh_dong === "GAN" ? (
                                                        <span style={{ color: "var(--green)", fontWeight: "bold", background: "#dcfce7", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>GÁN CA</span>
                                                    ) : item.hanh_dong === "GO" ? (
                                                        <span style={{ color: "var(--text-muted)", fontWeight: "bold", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>GỠ CA</span>
                                                    ) : (
                                                        <span style={{ color: "var(--text-muted)", fontWeight: "bold", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>{item.hanh_dong}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Modal>
            )}
            {/* MODAL THIẾT LẬP CA LÀM HÀNG LOẠT */}
            {modalBatchCaOpen && (
                <Modal
                    isOpen={modalBatchCaOpen}
                    onClose={() => setModalBatchCaOpen(false)}
                    title={`Xếp Ca làm việc cho nhân sự (${idsDaChon.length} đã chọn)`}
                    footer={
                        <>
                            <button type="button" className="nut-huy" onClick={() => setModalBatchCaOpen(false)} disabled={dangXuLyBatch}>Hủy</button>
                            <button type="submit" form="form-batch-ca-lam" className="nut-chinh" style={{ width: "auto" }} disabled={dangXuLyBatch}>
                                {dangXuLyBatch ? "Đang xử lý..." : "Xác nhận áp dụng"}
                            </button>
                        </>
                    }
                >
                    <form id="form-batch-ca-lam" onSubmit={xuLyBatchGanCa}>
                        <p style={{ fontSize: "14px", marginBottom: "16px", color: "var(--text-muted)" }}>
                            Bạn đang chuẩn bị thay đổi Ca làm việc cho <strong>{idsDaChon.length}</strong> nhân sự đã chọn. Vui lòng chọn một ca trong các ca làm việc hiện có dưới đây:
                        </p>

                        <div className="nhom-o-nhap">
                            <label htmlFor="batch_ca_lam">Chọn ca làm việc cố định mới</label>
                            <select
                                id="batch_ca_lam"
                                value={batchCaLamId}
                                onChange={(e) => setBatchCaLamId(e.target.value)}
                                style={{ width: "100%", padding: "10px", borderRadius: "var(--radius)", border: "1px solid #cbd5e1" }}
                            >
                                <option value="">-- Chưa gán ca làm việc (Tự do) --</option>
                                {danhSachCaLamOption.map(ca => (
                                    <option key={ca.id} value={ca.id}>Nhóm Ca: {ca.ten_ca} ({ca.gio_bat_dau.slice(0, 5)} - {ca.gio_ket_thuc.slice(0, 5)})</option>
                                ))}
                            </select>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

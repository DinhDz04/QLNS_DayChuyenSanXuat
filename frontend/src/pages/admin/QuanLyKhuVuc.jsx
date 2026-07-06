import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { layDanhSachKhuVuc, taoKhuVuc, capNhatKhuVuc, xoaKhuVuc } from "../../servives/khuVuc.service.js";
import ModalKhuVuc from "../../components/admin/ModalKhuVuc.jsx";

export default function QuanLyKhuVuc() {
    const { nguoiDung } = useAuth();
    
    const [danhSach, setDanhSach] = useState([]);
    const [dangTai, setDangTai] = useState(true);
    const [loi, setLoi] = useState("");
    const [thongBao, setThongBao] = useState("");

    // State cho Modal
    const [modalHienThi, setModalHienThi] = useState(false);
    const [modalCheDo, setModalCheDo] = useState("THEM"); // "THEM" hoặc "SUA"
    const [khuVucDangChon, setKhuVucDangChon] = useState(null);

    const laAdmin = nguoiDung && nguoiDung.role === "ADMIN";

    useEffect(() => {
        TaiDanhSach();
    }, []);

    async function TaiDanhSach() {
        setDangTai(true);
        setLoi("");
        try {
            const res = await layDanhSachKhuVuc();
            if (res.success) {
                setDanhSach(res.data);
            }
        } catch (err) {
            setLoi(err.message || "Không thể tải danh sách khu vực");
        } finally {
            setDangTai(false);
        }
    }

    function hienThiModalThem() {
        if (!laAdmin) return;
        setModalCheDo("THEM");
        setKhuVucDangChon(null);
        setLoi("");
        setModalHienThi(true);
    }

    function hienThiModalSua(kv) {
        if (!laAdmin) return;
        setModalCheDo("SUA");
        setKhuVucDangChon(kv);
        setLoi("");
        setModalHienThi(true);
    }

    async function handleSave(data) {
        try {
            if (modalCheDo === "THEM") {
                const res = await taoKhuVuc(data);
                if (res.success) {
                    hienThongBao("Đã tạo khu vực mới thành công!");
                    TaiDanhSach();
                }
            } else {
                const res = await capNhatKhuVuc(khuVucDangChon.id, data);
                if (res.success) {
                    hienThongBao("Đã cập nhật thông tin khu vực thành công!");
                    TaiDanhSach();
                }
            }
        } catch (err) {
            alert(err.message || "Lỗi khi lưu thông tin");
        }
    }

    async function xuLyXoa(id, ten) {
        if (!laAdmin) return;
        if (window.confirm(`Bạn có chắc chắn muốn xóa khu vực "${ten}" không?`)) {
            try {
                const res = await xoaKhuVuc(id);
                if (res.success) {
                    hienThongBao("Đã xóa khu vực thành công!");
                    TaiDanhSach();
                }
            } catch (err) {
                alert(err.message || "Không thể xóa khu vực");
            }
        }
    }

    function hienThongBao(msg) {
        setThongBao(msg);
        setTimeout(() => setThongBao(""), 4000);
    }

    return (
        <div className="noi-dung-admin">
            <div className="admin-header-bar">
                <div className="tieu-de-khoi">
                    <h2>Quản lý khu vực nhà máy</h2>
                    <p>Danh sách các khu vực vận hành, khách hàng liên kết và leader phụ trách</p>
                </div>
                {laAdmin && (
                    <button className="nut-chinh nut-them-moi" onClick={hienThiModalThem}>
                        + Thêm khu vực mới
                    </button>
                )}
            </div>

            {thongBao && <div className="thong-bao-thanh-cong">{thongBao}</div>}
            {loi && <div className="thong-bao-loi">{loi}</div>}

            <div className="bang-du-lieu-wrapper">
                {dangTai ? (
                    <div className="man-hinh-dang-tai">Đang tải danh sách khu vực...</div>
                ) : (
                    <table className="bang-du-lieu">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên khu vực</th>
                                <th>Khách hàng liên kết</th>
                                <th>Trưởng khu vực (Leader)</th>
                                <th>Mã số nhân viên</th>
                                {laAdmin && <th style={{ textAlign: "center" }}>Hành động</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {danhSach.length === 0 ? (
                                <tr>
                                    <td colSpan={laAdmin ? 6 : 5} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                                        Chưa có khu vực nào được tạo
                                    </td>
                                </tr>
                            ) : (
                                danhSach.map((kv) => (
                                    <tr key={kv.id}>
                                        <td>{kv.id}</td>
                                        <td><strong>{kv.ten_khu_vuc}</strong></td>
                                        <td>{kv.ten_khach_hang}</td>
                                        <td>
                                            {kv.ten_leader ? (
                                                <span style={{ fontWeight: 600, color: "var(--green)" }}>{kv.ten_leader}</span>
                                            ) : (
                                                <span className="text-unspecified">Chưa gán leader</span>
                                            )}
                                        </td>
                                        <td>{kv.ma_leader || "-"}</td>
                                        {laAdmin && (
                                            <td style={{ textAlign: "center" }}>
                                                <div className="nhom-nut-hanh-dong">
                                                    <button 
                                                        className="nut-hanh-dong nut-sua" 
                                                        onClick={() => hienThiModalSua(kv)}
                                                        title="Sửa thông tin khu vực"
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button 
                                                        className="nut-hanh-dong nut-xoa" 
                                                        onClick={() => xuLyXoa(kv.id, kv.ten_khu_vuc)}
                                                        title="Xóa khu vực"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <ModalKhuVuc
                hienThi={modalHienThi}
                cheDo={modalCheDo}
                khuVuc={khuVucDangChon}
                onClose={() => setModalHienThi(false)}
                onSave={handleSave}
            />
        </div>
    );
}

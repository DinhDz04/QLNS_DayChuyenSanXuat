import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { layDanhSachDayChuyen, taoDayChuyen, capNhatDayChuyen, xoaDayChuyen } from "../../servives/dayChuyen.service.js";
import ModalDayChuyen from "../../components/admin/ModalDayChuyen.jsx";

export default function QuanLyDayChuyen() {
    const { nguoiDung } = useAuth();
    const navigate = useNavigate();
    
    const [danhSach, setDanhSach] = useState([]);
    const [dangTai, setDangTai] = useState(true);
    const [loi, setLoi] = useState("");
    const [thongBao, setThongBao] = useState("");

    // State cho Modal
    const [modalHienThi, setModalHienThi] = useState(false);
    const [modalCheDo, setModalCheDo] = useState("THEM"); // "THEM" hoặc "SUA"
    const [dayChuyenDangChon, setDayChuyenDangChon] = useState(null);

    const laAdmin = nguoiDung && nguoiDung.role === "ADMIN";
    const laAdminOrLeaderKhuVuc = nguoiDung && ["ADMIN", "LEADER_KHU_VUC"].includes(nguoiDung.role);

    useEffect(() => {
        TaiDanhSach();
    }, []);

    async function TaiDanhSach() {
        setDangTai(true);
        setLoi("");
        try {
            const res = await layDanhSachDayChuyen();
            if (res.success) {
                setDanhSach(res.data);
            }
        } catch (err) {
            setLoi(err.message || "Không thể tải danh sách dây chuyền");
        } finally {
            setDangTai(false);
        }
    }

    function hienThiModalThem() {
        if (!laAdminOrLeaderKhuVuc) return;
        setModalCheDo("THEM");
        setDayChuyenDangChon(null);
        setLoi("");
        setModalHienThi(true);
    }

    function hienThiModalSua(dc) {
        if (!laAdminOrLeaderKhuVuc) return;
        setModalCheDo("SUA");
        setDayChuyenDangChon(dc);
        setLoi("");
        setModalHienThi(true);
    }

    async function handleSave(data) {
        try {
            if (modalCheDo === "THEM") {
                const res = await taoDayChuyen(data);
                if (res.success) {
                    hienThongBao("Đã tạo dây chuyền mới thành công!");
                    TaiDanhSach();
                }
            } else {
                const res = await capNhatDayChuyen(dayChuyenDangChon.id, data);
                if (res.success) {
                    hienThongBao("Đã cập nhật thông tin dây chuyền thành công!");
                    TaiDanhSach();
                }
            }
        } catch (err) {
            alert(err.message || "Lỗi khi lưu thông tin");
        }
    }

    async function xuLyXoa(id, ten) {
        if (!laAdmin) return;
        if (window.confirm(`Bạn có chắc chắn muốn xóa dây chuyền "${ten}" không?`)) {
            try {
                const res = await xoaDayChuyen(id);
                if (res.success) {
                    hienThongBao("Đã xóa dây chuyền thành công!");
                    TaiDanhSach();
                }
            } catch (err) {
                alert(err.message || "Không thể xóa dây chuyền");
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
                    <h2>Quản lý dây chuyền sản xuất</h2>
                    <p>Danh sách dây chuyền, khu vực nhà xưởng, leader quản lý và trạng thái hoạt động</p>
                </div>
                {laAdminOrLeaderKhuVuc && (
                    <button className="nut-chinh nut-them-moi" onClick={hienThiModalThem}>
                        + Thêm dây chuyền mới
                    </button>
                )}
            </div>

            {thongBao && <div className="thong-bao-thanh-cong">{thongBao}</div>}
            {loi && <div className="thong-bao-loi">{loi}</div>}

            <div className="bang-du-lieu-wrapper">
                {dangTai ? (
                    <div className="man-hinh-dang-tai">Đang tải danh sách dây chuyền...</div>
                ) : (
                    <table className="bang-du-lieu">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên dây chuyền</th>
                                <th>Thuộc khu vực</th>
                                <th>Trưởng dây chuyền (Leader)</th>
                                <th>Mã số nhân viên</th>
                                <th>Trạng thái</th>
                                <th style={{ textAlign: "center" }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {danhSach.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                                        Chưa có dây chuyền nào được tạo
                                    </td>
                                </tr>
                            ) : (
                                danhSach.map((dc) => (
                                    <tr key={dc.id}>
                                        <td>{dc.id}</td>
                                        <td><strong>{dc.ten_day_chuyen}</strong></td>
                                        <td>{dc.ten_khu_vuc}</td>
                                        <td>
                                            {dc.ten_leader ? (
                                                <span style={{ fontWeight: 600, color: "var(--amber-dark)" }}>{dc.ten_leader}</span>
                                            ) : (
                                                <span className="text-unspecified">Chưa gán leader</span>
                                            )}
                                        </td>
                                        <td>{dc.ma_leader || "-"}</td>
                                        <td>
                                            {dc.trang_thai === "HOAT_DONG" ? (
                                                <span className="trang-thai-badge active">Hoạt động</span>
                                            ) : (
                                                <span className="trang-thai-badge locked">Tạm dừng</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <div className="nhom-nut-hanh-dong">
                                                <button 
                                                    className="nut-hanh-dong" 
                                                    onClick={() => navigate(`/admin/day-chuyen/${dc.id}`)}
                                                    title="Xem chi tiết phân công nhân sự"
                                                    style={{ backgroundColor: "#e2f0fd", color: "#1e3a8a", border: "1px solid #cbd5e0" }}
                                                >
                                                    Chi tiết
                                                </button>
                                                {laAdminOrLeaderKhuVuc && (
                                                    <button 
                                                        className="nut-hanh-dong nut-sua" 
                                                        onClick={() => hienThiModalSua(dc)}
                                                        title="Sửa thông tin dây chuyền"
                                                    >
                                                        Sửa
                                                    </button>
                                                )}
                                                {laAdmin && (
                                                    <button 
                                                        className="nut-hanh-dong nut-xoa" 
                                                        onClick={() => xuLyXoa(dc.id, dc.ten_day_chuyen)}
                                                        title="Xóa dây chuyền"
                                                    >
                                                        Xóa
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <ModalDayChuyen
                hienThi={modalHienThi}
                cheDo={modalCheDo}
                dayChuyen={dayChuyenDangChon}
                onClose={() => setModalHienThi(false)}
                onSave={handleSave}
            />
        </div>
    );
}

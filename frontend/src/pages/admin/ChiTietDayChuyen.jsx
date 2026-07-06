import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
    layChiTietDayChuyen,
    layUngVienChoBoPhan,
    phanCongNhanSu,
    goPhanCongNhanSu
} from "../../servives/dayChuyen.service.js";

export default function ChiTietDayChuyen() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { nguoiDung } = useAuth();

    const [duLieu, setDuLieu] = useState(null);
    const [ngay, setNgay] = useState(new Date().toISOString().split("T")[0]);
    const [dangTai, setDangTai] = useState(true);
    const [loi, setLoi] = useState("");
    const [thongBao, setThongBao] = useState("");

    // State quản lý việc chọn nhân viên gán vào công đoạn
    const [hienThiGan, setHienThiGan] = useState(null); // Lưu ID của cong_doan đang muốn gán
    const [danhSachUngVien, setDanhSachUngVien] = useState([]);
    const [ungVienDuocChon, setUngVienDuocChon] = useState("");
    const [dangTaiUngVien, setDangTaiUngVien] = useState(false);

    // Quyền thêm/gỡ nhân sự: chỉ ADMIN và LEADER_KHU_VUC được thực hiện
    const laAdminOrLeaderKhuVuc = nguoiDung && ["ADMIN", "LEADER_KHU_VUC"].includes(nguoiDung.role);

    useEffect(() => {
        TaiChiTiet();
    }, [id, ngay]);

    async function TaiChiTiet() {
        setDangTai(true);
        setLoi("");
        try {
            const res = await layChiTietDayChuyen(id, ngay);
            if (res.success) {
                setDuLieu(res.data);
            }
        } catch (err) {
            setLoi(err.message || "Không thể tải chi tiết dây chuyền");
        } finally {
            setDangTai(false);
        }
    }

    async function kichHoatGanNhanVien(congDoanId) {
        setHienThiGan(congDoanId);
        setUngVienDuocChon("");
        setDanhSachUngVien([]);
        setDangTaiUngVien(true);
        try {
            const res = await layUngVienChoBoPhan(congDoanId);
            if (res.success) {
                setDanhSachUngVien(res.data);
            }
        } catch (err) {
            alert(err.message || "Không thể tải danh sách ứng viên");
        } finally {
            setDangTaiUngVien(false);
        }
    }

    async function xuLyGan() {
        if (!ungVienDuocChon) {
            alert("Vui lòng chọn một nhân viên!");
            return;
        }

        try {
            const res = await phanCongNhanSu({
                nhan_vien_id: Number(ungVienDuocChon),
                day_chuyen_id: Number(id),
                cong_doan_id: Number(hienThiGan),
                ngay: ngay
            });

            if (res.success) {
                hienThongBao("Đã phân công nhân viên thành công!");
                setHienThiGan(null);
                TaiChiTiet();
            }
        } catch (err) {
            alert(err.message || "Gán nhân viên thất bại");
        }
    }

    async function xuLyGo(nhanVienId, congDoanId) {
        if (!laAdminOrLeaderKhuVuc) return;
        if (window.confirm("Bạn có chắc chắn muốn gỡ nhân viên này khỏi công đoạn trong hôm nay?")) {
            try {
                const res = await goPhanCongNhanSu({
                    nhan_vien_id: Number(nhanVienId),
                    day_chuyen_id: Number(id),
                    cong_doan_id: Number(congDoanId),
                    ngay: ngay
                });

                if (res.success) {
                    hienThongBao("Đã gỡ nhân viên thành công!");
                    TaiChiTiet();
                }
            } catch (err) {
                alert(err.message || "Gỡ nhân viên thất bại");
            }
        }
    }

    function hienThongBao(msg) {
        setThongBao(msg);
        setTimeout(() => setThongBao(""), 4000);
    }

    if (dangTai && !duLieu) {
        return <div className="man-hinh-dang-tai">Đang tải dữ liệu dây chuyền...</div>;
    }

    if (loi) {
        return (
            <div className="noi-dung-admin">
                <div className="thong-bao-loi">{loi}</div>
                <button className="nut-chinh" onClick={() => navigate("/admin/day-chuyen")}>Quay lại danh sách</button>
            </div>
        );
    }

    const { day_chuyen, bo_phan } = duLieu;

    return (
        <div className="noi-dung-admin">
            <div className="admin-header-bar" style={{ borderBottom: "1px solid #cbd5e1", paddingBottom: "16px", marginBottom: "20px" }}>
                <div className="tieu-de-khoi">
                    <h2>Chi tiết dây chuyền: {day_chuyen.ten_day_chuyen}</h2>
                    <p style={{ marginTop: "4px" }}>
                        Khu vực: <strong>{day_chuyen.ten_khu_vuc}</strong> | Leader dây chuyền: <strong>{day_chuyen.ten_leader || "Chưa gán"}</strong>
                    </p>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <label style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-muted)", textTransform: "uppercase" }}>Chọn Ngày Làm Việc</label>
                        <input
                            type="date"
                            value={ngay}
                            onChange={(e) => setNgay(e.target.value)}
                            style={{ padding: "8px 12px", border: "1px solid #cbd5e0", borderRadius: "var(--radius)", fontSize: "14px" }}
                        />
                    </div>
                    <button className="nut-chinh" onClick={() => navigate("/admin/day-chuyen")} style={{ alignSelf: "flex-end", height: "38px" }}>
                        Quay lại
                    </button>
                </div>
            </div>

            {thongBao && <div className="thong-bao-thanh-cong">{thongBao}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                {bo_phan.length === 0 ? (
                    <div className="the-thong-tin" style={{ textAlign: "center", padding: "40px" }}>
                        <p style={{ fontStyle: "italic", color: "var(--text-muted)" }}>Dây chuyền này chưa được cấu hình công đoạn sản xuất nào.</p>
                    </div>
                ) : (
                    bo_phan.map((bp) => (
                        <div key={bp.cong_doan_id} className="the-thong-tin" style={{ borderLeft: bp.trang_thai === "THIEU" ? "5px solid var(--red)" : "5px solid var(--green)", paddingLeft: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "16px", color: "var(--charcoal)", display: "flex", alignItems: "center", gap: "8px" }}>
                                        Công đoạn: {bp.ten_bo_phan}
                                        {bp.trang_thai === "THIEU" ? (
                                            <span style={{ fontSize: "11px", fontWeight: "bold", background: "#fee2e2", color: "var(--red)", padding: "2px 8px", borderRadius: "999px" }}>
                                                Thiếu {bp.so_luong_thieu} nhân sự
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: "11px", fontWeight: "bold", background: "#dcfce7", color: "var(--green)", padding: "2px 8px", borderRadius: "999px" }}>
                                                Đủ nhân sự
                                            </span>
                                        )}
                                    </h3>
                                    <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                                        Yêu cầu định biên: <strong>{bp.so_luong_can}</strong> người | Hiện tại: <strong>{bp.so_luong_da_gan}</strong> người
                                    </p>
                                </div>
                                {laAdminOrLeaderKhuVuc && bp.trang_thai === "THIEU" && hienThiGan !== bp.cong_doan_id && (
                                    <button
                                        className="nut-chinh"
                                        onClick={() => kichHoatGanNhanVien(bp.cong_doan_id)}
                                        style={{ padding: "6px 12px", fontSize: "12px", width: "auto" }}
                                    >
                                        + Gán nhân viên
                                    </button>
                                )}
                            </div>

                            {/* Dropdown chọn nhân viên gán */}
                            {hienThiGan === bp.cong_doan_id && (
                                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "14px", borderRadius: "var(--radius)", marginBottom: "16px" }}>
                                    <h4 style={{ margin: "0 0 8px 0", fontSize: "13px" }}>Gán nhân sự phù hợp (Dựa trên chứng chỉ chuyên môn)</h4>
                                    {dangTaiUngVien ? (
                                        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Đang quét tìm ứng viên có chứng chỉ...</p>
                                    ) : danhSachUngVien.length === 0 ? (
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <p style={{ margin: 0, fontSize: "13px", color: "var(--red)" }}>Không tìm thấy nhân viên nào có chứng chỉ hiệu lực cho công đoạn này!</p>
                                            <button type="button" className="nut-huy" onClick={() => setHienThiGan(null)} style={{ padding: "4px 10px" }}>Đóng</button>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                            <select
                                                value={ungVienDuocChon}
                                                onChange={(e) => setUngVienDuocChon(e.target.value)}
                                                style={{ flex: 1, padding: "8px 10px", border: "1px solid #cbd5e0", borderRadius: "var(--radius)", fontSize: "14px" }}
                                            >
                                                <option value="">-- Chọn nhân viên có chứng chỉ --</option>
                                                {danhSachUngVien.map(uv => (
                                                    <option key={uv.id} value={uv.id}>
                                                        [{uv.ma_nhan_vien}] - {uv.ho_ten} (Cấp độ {uv.cap_do || 1})
                                                    </option>
                                                ))}
                                            </select>
                                            <button className="nut-chinh" onClick={xuLyGan} style={{ width: "auto", padding: "8px 14px", fontSize: "14px" }}>
                                                Xác nhận gán
                                            </button>
                                            <button className="nut-huy" onClick={() => setHienThiGan(null)} style={{ padding: "8px 14px", fontSize: "14px" }}>
                                                Hủy
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Danh sách nhân viên đang được phân công */}
                            {bp.nhan_vien.length === 0 ? (
                                <p style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>Chưa có nhân sự nào được phân công làm việc ở công đoạn này.</p>
                            ) : (
                                <div className="bang-du-lieu-wrapper" style={{ boxShadow: "none" }}>
                                    <table className="bang-du-lieu" style={{ fontSize: "13px" }}>
                                        <thead>
                                            <tr>
                                                <th>Mã nhân viên</th>
                                                <th>Họ và tên</th>
                                                <th>Giới tính</th>
                                                <th>Số điện thoại</th>
                                                {laAdminOrLeaderKhuVuc && <th style={{ textAlign: "center" }}>Hành động</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bp.nhan_vien.map((nv) => (
                                                <tr key={nv.nhan_vien_id}>
                                                    <td><strong>{nv.ma_nhan_vien}</strong></td>
                                                    <td>{nv.ho_ten}</td>
                                                    <td>{nv.gioi_tinh || "-"}</td>
                                                    <td>{nv.so_dien_thoai || "-"}</td>
                                                    {laAdminOrLeaderKhuVuc && (
                                                        <td style={{ textAlign: "center" }}>
                                                            <button
                                                                className="nut-hanh-dong nut-xoa"
                                                                onClick={() => xuLyGo(nv.nhan_vien_id, bp.cong_doan_id)}
                                                                style={{ padding: "4px 8px", fontSize: "11px" }}
                                                            >
                                                                Gỡ khỏi công đoạn
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

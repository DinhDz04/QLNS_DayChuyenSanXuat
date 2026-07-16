import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import {
    layChiTietDayChuyen,
    layUngVienChoBoPhan,
    phanCongNhanSu,
    goPhanCongNhanSu,
    tuDongGanNhanSu,
    capNhatDayChuyen
} from "../services/dayChuyen.service.js";

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
    const [danhSachChonMulti, setDanhSachChonMulti] = useState([]); // Mảng các ID nhân viên được tích chọn
    const [dangTaiUngVien, setDangTaiUngVien] = useState(false);
    const [dangAutoAssign, setDangAutoAssign] = useState(false);

    // Chế độ xem: "CONG_DOAN" (xem theo từng công đoạn) hoặc "TAT_CA" (xem gộp toàn bộ)
    const [cheDoXem, setCheDoXem] = useState("CONG_DOAN");
    const [tuKhoaTimKiemNhanSu, setTuKhoaTimKiemNhanSu] = useState("");

    // State cho Modal thêm/sửa công đoạn đẹp mắt thay thế window.prompt
    const [modalCongDoanOpen, setModalCongDoanOpen] = useState(false);
    const [modalCongDoanCheDo, setModalCongDoanCheDo] = useState("THEM"); // "THEM" hoặc "SUA"
    const [modalCongDoanTarget, setModalCongDoanTarget] = useState(null);
    const [modalCongDoanTen, setModalCongDoanTen] = useState("");
    const [modalCongDoanMin, setModalCongDoanMin] = useState(1);
    const [modalCongDoanMax, setModalCongDoanMax] = useState(1);

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
        setDanhSachChonMulti([]);
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

    // Toggle tích chọn nhân viên
    function handleToggleChonNhanVien(nvId) {
        if (danhSachChonMulti.includes(nvId)) {
            setDanhSachChonMulti(danhSachChonMulti.filter(id => id !== nvId));
        } else {
            setDanhSachChonMulti([...danhSachChonMulti, nvId]);
        }
    }

    // Gán nhiều nhân sự đã chọn
    async function xuLyGanMulti(congDoanId, bp) {
        if (danhSachChonMulti.length === 0) {
            alert("Vui lòng chọn ít nhất một nhân viên!");
            return;
        }

        const max = bp.so_luong_max !== null ? bp.so_luong_max : bp.so_luong_can;
        if (danhSachChonMulti.length + bp.so_luong_da_gan > max) {
            alert(`Lỗi: Không thể gán quá số lượng nhân sự tối đa (${max} người)! Hiện tại đã gán ${bp.so_luong_da_gan} người.`);
            return;
        }

        try {
            await Promise.all(
                danhSachChonMulti.map((nvId) =>
                    phanCongNhanSu({
                        nhan_vien_id: Number(nvId),
                        day_chuyen_id: Number(id),
                        cong_doan_id: Number(congDoanId),
                        ngay: ngay
                    })
                )
            );

            hienThongBao(`Đã gán thành công ${danhSachChonMulti.length} nhân viên!`);
            setHienThiGan(null);
            setDanhSachChonMulti([]);
            TaiChiTiet();
        } catch (err) {
            alert(err.message || "Gán nhân viên thất bại");
        }
    }

    // Tự động gán nhân sự trống
    async function xuLyAutoAssign() {
        setDangAutoAssign(true);
        setLoi("");
        try {
            const res = await tuDongGanNhanSu(id, ngay);
            if (res.success) {
                hienThongBao(res.message || "Đã tự động gán nhân sự thành công!");
                TaiChiTiet();
            }
        } catch (err) {
            alert(err.message || "Lỗi tự động gán nhân sự");
        } finally {
            setDangAutoAssign(false);
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

    // Mở modal Thêm công đoạn
    function kichHoatThemCongDoan() {
        if (!laAdminOrLeaderKhuVuc) return;
        setModalCongDoanCheDo("THEM");
        setModalCongDoanTen(`${day_chuyen.ten_day_chuyen} ${bo_phan.length + 1}`);
        setModalCongDoanMin(1);
        setModalCongDoanMax(1);
        setModalCongDoanOpen(true);
    }

    // Mở modal Sửa định biên công đoạn
    function kichHoatSuaDinhBien(bp) {
        if (!laAdminOrLeaderKhuVuc) return;
        setModalCongDoanCheDo("SUA");
        setModalCongDoanTarget(bp);
        setModalCongDoanTen(bp.ten_bo_phan);
        setModalCongDoanMin(bp.so_luong_min !== null ? bp.so_luong_min : bp.so_luong_can);
        setModalCongDoanMax(bp.so_luong_max !== null ? bp.so_luong_max : bp.so_luong_can);
        setModalCongDoanOpen(true);
    }

    // Xử lý lưu công đoạn từ Modal đẹp mắt (thay thế window.prompt)
    async function xuLyLuuModalCongDoan() {
        if (!modalCongDoanTen.trim()) {
            alert("Tên công đoạn không được để trống!");
            return;
        }
        if (modalCongDoanMax < modalCongDoanMin) {
            alert("Lỗi: Số lượng tối đa phải lớn hơn hoặc bằng tối thiểu!");
            return;
        }

        try {
            let updatedBoPhan = [];
            if (modalCongDoanCheDo === "THEM") {
                updatedBoPhan = bo_phan.map(bp => ({
                    cong_doan_id: bp.cong_doan_id,
                    loai_bo_phan: bp.ten_bo_phan,
                    so_luong_can: bp.so_luong_min !== null ? bp.so_luong_min : bp.so_luong_can,
                    so_luong_min: bp.so_luong_min !== null ? bp.so_luong_min : bp.so_luong_can,
                    so_luong_max: bp.so_luong_max !== null ? bp.so_luong_max : bp.so_luong_can
                }));
                updatedBoPhan.push({
                    cong_doan_id: null,
                    loai_bo_phan: modalCongDoanTen.trim(),
                    so_luong_can: modalCongDoanMin,
                    so_luong_min: modalCongDoanMin,
                    so_luong_max: modalCongDoanMax
                });
            } else {
                updatedBoPhan = bo_phan.map(bp => ({
                    cong_doan_id: bp.cong_doan_id,
                    loai_bo_phan: bp.ten_bo_phan,
                    so_luong_can: bp.cong_doan_id === modalCongDoanTarget.cong_doan_id ? modalCongDoanMin : (bp.so_luong_min !== null ? bp.so_luong_min : bp.so_luong_can),
                    so_luong_min: bp.cong_doan_id === modalCongDoanTarget.cong_doan_id ? modalCongDoanMin : (bp.so_luong_min !== null ? bp.so_luong_min : bp.so_luong_can),
                    so_luong_max: bp.cong_doan_id === modalCongDoanTarget.cong_doan_id ? modalCongDoanMax : (bp.so_luong_max !== null ? bp.so_luong_max : bp.so_luong_can)
                }));
            }

            const res = await capNhatDayChuyen(day_chuyen.id, {
                ten_day_chuyen: day_chuyen.ten_day_chuyen,
                khu_vuc_id: day_chuyen.khu_vuc_id,
                leader_id: day_chuyen.leader_id,
                trang_thai: day_chuyen.trang_thai,
                bo_phan: updatedBoPhan
            });

            if (res.success) {
                hienThongBao(
                    modalCongDoanCheDo === "THEM"
                        ? `Đã thêm thành công công đoạn "${modalCongDoanTen}"!`
                        : `Đã sửa định biên công đoạn "${modalCongDoanTarget.ten_bo_phan}" thành ${modalCongDoanMin}-${modalCongDoanMax} người!`
                );
                setModalCongDoanOpen(false);
                TaiChiTiet();
            }
        } catch (err) {
            alert(err.message || "Lưu công đoạn thất bại");
        }
    }

    // Xóa công đoạn trực tiếp
    async function xuLyXoaCongDoan(bpTarget) {
        if (!laAdminOrLeaderKhuVuc) return;

        let confirmMsg = `Bạn có chắc chắn muốn xóa công đoạn "${bpTarget.ten_bo_phan}"?\nHành động này cũng sẽ gỡ tất cả nhân sự đang gán tại công đoạn này.`;
        if (bpTarget.so_luong_da_gan > 0) {
            confirmMsg += `\n⚠️ Cảnh báo: Hiện đang có ${bpTarget.so_luong_da_gan} nhân viên đang làm việc ở đây!`;
        }

        if (window.confirm(confirmMsg)) {
            try {
                const updatedBoPhan = bo_phan
                    .filter(bp => bp.cong_doan_id !== bpTarget.cong_doan_id)
                    .map((bp, idx) => ({
                        cong_doan_id: bp.cong_doan_id,
                        loai_bo_phan: `${day_chuyen.ten_day_chuyen} ${idx + 1}`,
                        so_luong_can: bp.so_luong_min !== null ? bp.so_luong_min : bp.so_luong_can,
                        so_luong_min: bp.so_luong_min !== null ? bp.so_luong_min : bp.so_luong_can,
                        so_luong_max: bp.so_luong_max !== null ? bp.so_luong_max : bp.so_luong_can
                    }));

                const res = await capNhatDayChuyen(day_chuyen.id, {
                    ten_day_chuyen: day_chuyen.ten_day_chuyen,
                    khu_vuc_id: day_chuyen.khu_vuc_id,
                    leader_id: day_chuyen.leader_id,
                    trang_thai: day_chuyen.trang_thai,
                    bo_phan: updatedBoPhan
                });

                if (res.success) {
                    hienThongBao(`Đã xóa thành công công đoạn "${bpTarget.ten_bo_phan}"!`);
                    TaiChiTiet();
                }
            } catch (err) {
                alert(err.message || "Xóa công đoạn thất bại");
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

    const tatCaNhanVienDaGan = bo_phan.reduce((acc, bp) => {
        const nvBp = bp.nhan_vien.map(nv => ({
            ...nv,
            ten_bo_phan: bp.ten_bo_phan,
            cong_doan_id: bp.cong_doan_id
        }));
        return [...acc, ...nvBp];
    }, []);

    const locNhanVienTheoTuKhoa = (nvList) => {
        const query = tuKhoaTimKiemNhanSu.toLowerCase().trim();
        if (!query) return nvList;
        return nvList.filter(nv => 
            nv.ho_ten.toLowerCase().includes(query) || 
            nv.ma_nhan_vien.toLowerCase().includes(query) ||
            (nv.so_dien_thoai && nv.so_dien_thoai.toLowerCase().includes(query))
        );
    };

    return (
        <div className="noi-dung-admin">
            {/* Header chi tiết */}
            <div className="admin-header-bar" style={{ borderBottom: "1px solid #cbd5e1", paddingBottom: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
                <div className="tieu-de-khoi" style={{ flex: "1 1 300px" }}>
                    <h2 style={{ margin: 0 }}>Chi tiết dây chuyền: {day_chuyen.ten_day_chuyen}</h2>
                    <p style={{ marginTop: "6px", marginBottom: 0 }}>
                        Khu vực: <strong>{day_chuyen.ten_khu_vuc}</strong> | Leader dây chuyền: <strong>{day_chuyen.ten_leader || "Chưa gán"}</strong>
                    </p>
                </div>
                
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-muted)", textTransform: "uppercase" }}>Chọn Ngày Làm Việc</label>
                        <input
                            type="date"
                            value={ngay}
                            onChange={(e) => setNgay(e.target.value)}
                            style={{ padding: "8px 12px", border: "1px solid #cbd5e0", borderRadius: "var(--radius)", fontSize: "14px", height: "38px" }}
                        />
                    </div>
                    {laAdminOrLeaderKhuVuc && (
                        <>
                            <button
                                className="nut-chinh"
                                onClick={kichHoatThemCongDoan}
                                style={{ height: "38px", backgroundColor: "#10b981", width: "auto", padding: "0 16px" }}
                            >
                                + Thêm công đoạn
                            </button>
                            <button 
                                className="nut-chinh" 
                                onClick={xuLyAutoAssign}
                                disabled={dangAutoAssign}
                                style={{ height: "38px", backgroundColor: "#0284c7", width: "auto", padding: "0 16px" }}
                            >
                                {dangAutoAssign ? "Đang gán..." : "🤖 Tự động gán nhân sự"}
                            </button>
                        </>
                    )}
                    <button className="nut-chinh" onClick={() => navigate("/admin/day-chuyen")} style={{ height: "38px", width: "auto", padding: "0 16px" }}>
                        Quay lại
                    </button>
                </div>
            </div>

            {thongBao && <div className="thong-bao-thanh-cong">{thongBao}</div>}

            {/* 1. SƠ ĐỒ TRỰC QUAN CÁC CÔNG ĐOẠN SẢN XUẤT */}
            <div className="the-thong-tin" style={{ marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "15px" }}>⛓️ Sơ đồ dòng chảy công đoạn sản xuất (Line Flowchart)</h3>
                <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "12px", 
                    overflowX: "auto", 
                    padding: "10px 0",
                    scrollbarWidth: "thin"
                }}>
                    {bo_phan.length === 0 ? (
                        <p style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "13px" }}>Chưa cấu hình sơ đồ công đoạn.</p>
                    ) : (
                        bo_phan.map((bp, idx) => {
                            const isThieu = bp.trang_thai === "THIEU";
                            const isDuThua = bp.trang_thai === "DU_THUA";
                            const mauVien = isThieu ? "var(--red)" : (isDuThua ? "#f97316" : "var(--green)");
                            const mauNen = isThieu ? "#fef2f2" : (isDuThua ? "#fff7ed" : "#f0fdf4");
                            const mauChu = isThieu ? "var(--red)" : (isDuThua ? "#ea580c" : "var(--green)");
                            return (
                                <React.Fragment key={bp.cong_doan_id}>
                                    <div style={{
                                        minWidth: "160px",
                                        border: `2px solid ${mauVien}`,
                                        borderRadius: "6px",
                                        padding: "10px 14px",
                                        backgroundColor: mauNen,
                                        textAlign: "center",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                                    }}>
                                        <div style={{ fontWeight: "bold", fontSize: "13px", color: "var(--charcoal)" }}>{bp.ten_bo_phan}</div>
                                        <div style={{ 
                                            fontSize: "11px", 
                                            marginTop: "6px", 
                                            color: mauChu,
                                            fontWeight: "bold"
                                        }}>
                                            {bp.so_luong_da_gan} / {bp.so_luong_min !== null && bp.so_luong_max !== null ? `${bp.so_luong_min}-${bp.so_luong_max}` : bp.so_luong_can} nhân sự
                                        </div>
                                        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                                            {isThieu ? `⚠️ Thiếu ${bp.so_luong_thieu}` : (isDuThua ? `📈 Dư ${bp.so_luong_du}` : "✅ Đủ nhân sự")}
                                        </div>
                                    </div>
                                    {idx < bo_phan.length - 1 && (
                                        <span style={{ fontSize: "20px", color: "#94a3b8", fontWeight: "bold" }}>➔</span>
                                    )}
                                </React.Fragment>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Tìm kiếm nhân sự */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "2px", backgroundColor: "#e2e8f0", padding: "4px", borderRadius: "8px" }}>
                    <button 
                        onClick={() => setCheDoXem("CONG_DOAN")}
                        style={{
                            padding: "6px 12px",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: "600",
                            backgroundColor: cheDoXem === "CONG_DOAN" ? "#ffffff" : "transparent",
                            color: cheDoXem === "CONG_DOAN" ? "var(--primary-color)" : "#475569",
                            cursor: "pointer"
                        }}
                    >
                        Phân công theo công đoạn
                    </button>
                    <button 
                        onClick={() => setCheDoXem("TAT_CA")}
                        style={{
                            padding: "6px 12px",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: "600",
                            backgroundColor: cheDoXem === "TAT_CA" ? "#ffffff" : "transparent",
                            color: cheDoXem === "TAT_CA" ? "var(--primary-color)" : "#475569",
                            cursor: "pointer"
                        }}
                    >
                        Tất cả nhân sự hôm nay ({tatCaNhanVienDaGan.length})
                    </button>
                </div>

                <div style={{ width: "300px" }}>
                    <input
                        type="text"
                        placeholder="🔍 Tìm nhanh nhân sự đang làm việc trên Line..."
                        value={tuKhoaTimKiemNhanSu}
                        onChange={(e) => setTuKhoaTimKiemNhanSu(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "var(--radius)",
                            fontSize: "13px"
                        }}
                    />
                </div>
            </div>

            {/* HIỂN THỊ CÁC CÔNG ĐOẠN HOẶC GỘP */}
            {cheDoXem === "CONG_DOAN" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                    {bo_phan.length === 0 ? (
                        <div className="the-thong-tin" style={{ textAlign: "center", padding: "40px" }}>
                            <p style={{ fontStyle: "italic", color: "var(--text-muted)" }}>Dây chuyền này chưa được cấu hình công đoạn sản xuất nào.</p>
                        </div>
                    ) : (
                        bo_phan.map((bp) => {
                            const filteredNhanVien = locNhanVienTheoTuKhoa(bp.nhan_vien);
                            return (
                                <div key={bp.cong_doan_id} className="the-thong-tin" style={{ borderLeft: bp.trang_thai === "THIEU" ? "5px solid var(--red)" : (bp.trang_thai === "DU_THUA" ? "5px solid #f97316" : "5px solid var(--green)"), paddingLeft: "20px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: "16px", color: "var(--charcoal)", display: "flex", alignItems: "center", gap: "8px" }}>
                                                {bp.ten_bo_phan}
                                                {bp.trang_thai === "THIEU" ? (
                                                    <span style={{ fontSize: "11px", fontWeight: "bold", background: "#fee2e2", color: "var(--red)", padding: "2px 8px", borderRadius: "999px" }}>
                                                        Thiếu {bp.so_luong_thieu} nhân sự
                                                    </span>
                                                ) : bp.trang_thai === "DU_THUA" ? (
                                                    <span style={{ fontSize: "11px", fontWeight: "bold", background: "#fff7ed", color: "#ea580c", padding: "2px 8px", borderRadius: "999px" }}>
                                                        Dư {bp.so_luong_du} nhân sự
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: "11px", fontWeight: "bold", background: "#dcfce7", color: "var(--green)", padding: "2px 8px", borderRadius: "999px" }}>
                                                        Đủ nhân sự
                                                    </span>
                                                )}
                                            </h3>
                                            <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "var(--text-muted)", display: "flex", gap: "12px", alignItems: "center" }}>
                                                <span>Yêu cầu định biên: <strong>{bp.so_luong_min !== null && bp.so_luong_max !== null ? `${bp.so_luong_min}-${bp.so_luong_max}` : bp.so_luong_can}</strong> người | Hiện tại: <strong>{bp.so_luong_da_gan}</strong> người</span>
                                                {laAdminOrLeaderKhuVuc && (
                                                    <span style={{ display: "flex", gap: "8px" }}>
                                                        <button 
                                                            onClick={() => kichHoatSuaDinhBien(bp)} 
                                                            style={{ border: "none", background: "none", color: "var(--primary-color)", fontWeight: "bold", cursor: "pointer", padding: 0 }}
                                                        >
                                                            ✏️ Sửa định biên
                                                        </button>
                                                        <span style={{ color: "#cbd5e1" }}>|</span>
                                                        <button 
                                                            onClick={() => xuLyXoaCongDoan(bp)} 
                                                            style={{ border: "none", background: "none", color: "var(--red)", fontWeight: "bold", cursor: "pointer", padding: 0 }}
                                                        >
                                                            🗑️ Xóa công đoạn
                                                        </button>
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        {laAdminOrLeaderKhuVuc && bp.so_luong_da_gan < bp.so_luong_max && hienThiGan !== bp.cong_doan_id && (
                                            <button
                                                className="nut-chinh"
                                                onClick={() => kichHoatGanNhanVien(bp.cong_doan_id)}
                                                style={{ padding: "6px 12px", fontSize: "12px", width: "auto" }}
                                            >
                                                + Gán nhân viên phù hợp
                                            </button>
                                        )}
                                    </div>

                                    {hienThiGan === bp.cong_doan_id && (
                                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "var(--radius)", marginBottom: "16px" }}>
                                            <h4 style={{ margin: "0 0 4px 0", fontSize: "13px" }}>Gán nhân viên có chứng chỉ kỹ năng phù hợp</h4>
                                            <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "var(--text-muted)" }}>
                                                Tích chọn các nhân sự trống để phân công vào công đoạn (Tối đa gán thêm: {bp.so_luong_max - bp.so_luong_da_gan} người).
                                            </p>

                                            {dangTaiUngVien ? (
                                                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Đang quét tìm ứng viên có chứng chỉ...</p>
                                            ) : danhSachUngVien.length === 0 ? (
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <p style={{ margin: 0, fontSize: "13px", color: "var(--red)", fontWeight: "600" }}>Không tìm thấy nhân viên nào có chứng chỉ hiệu lực cho công đoạn này!</p>
                                                    <button type="button" className="nut-huy" onClick={() => setHienThiGan(null)} style={{ padding: "4px 10px" }}>Đóng</button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "8px", background: "#ffffff", marginBottom: "12px" }}>
                                                        {danhSachUngVien.map(uv => (
                                                            <label key={uv.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px", borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={danhSachChonMulti.includes(uv.id)}
                                                                    onChange={() => handleToggleChonNhanVien(uv.id)}
                                                                />
                                                                <span style={{ fontSize: "13px" }}>
                                                                    <strong>[{uv.ma_nhan_vien}]</strong> - {uv.ho_ten} (Cấp độ chứng chỉ: {uv.cap_do || 1})
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>

                                                    {danhSachChonMulti.length + bp.so_luong_da_gan > bp.so_luong_max && (
                                                        <div style={{ padding: "8px 12px", backgroundColor: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "4px", color: "var(--red)", fontSize: "12px", fontWeight: "bold", marginBottom: "12px" }}>
                                                            ⚠️ Cảnh báo: Định biên công đoạn tối đa là {bp.so_luong_max} nhân sự, nhưng bạn đang chọn gán tổng cộng {danhSachChonMulti.length + bp.so_luong_da_gan} nhân sự!
                                                        </div>
                                                    )}

                                                    <div style={{ display: "flex", gap: "10px" }}>
                                                        <button 
                                                            className="nut-chinh" 
                                                            onClick={() => xuLyGanMulti(bp.cong_doan_id, bp)} 
                                                            style={{ width: "auto", padding: "8px 16px", fontSize: "13px" }}
                                                        >
                                                            Xác nhận gán ({danhSachChonMulti.length} người)
                                                        </button>
                                                        <button 
                                                            className="nut-huy" 
                                                            onClick={() => { setHienThiGan(null); setDanhSachChonMulti([]); }} 
                                                            style={{ padding: "8px 16px", fontSize: "13px" }}
                                                        >
                                                            Hủy
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {filteredNhanVien.length === 0 ? (
                                        <p style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>
                                            {tuKhoaTimKiemNhanSu ? "Không tìm thấy nhân sự phù hợp." : "Chưa có nhân sự nào được phân công làm việc ở công đoạn này."}
                                        </p>
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
                                                    {filteredNhanVien.map((nv) => (
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
                            );
                        })
                    )}
                </div>
            ) : (
                // TAB XEM GỘP TẤT CẢ NHÂN SỰ
                <div className="the-thong-tin">
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "15px" }}>📋 Tổng hợp danh sách nhân sự làm việc trên line ({locNhanVienTheoTuKhoa(tatCaNhanVienDaGan).length} người)</h3>
                    {locNhanVienTheoTuKhoa(tatCaNhanVienDaGan).length === 0 ? (
                        <p style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "13px" }}>Chưa có nhân sự nào được gán cho dây chuyền trong ngày.</p>
                    ) : (
                        <div className="bang-du-lieu-wrapper">
                            <table className="bang-du-lieu">
                                <thead>
                                    <tr>
                                        <th>Mã nhân viên</th>
                                        <th>Họ và tên</th>
                                        <th>Công đoạn được gán</th>
                                        <th>Giới tính</th>
                                        <th>Số điện thoại</th>
                                        {laAdminOrLeaderKhuVuc && <th style={{ textAlign: "center" }}>Hành động</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {locNhanVienTheoTuKhoa(tatCaNhanVienDaGan).map((nv) => (
                                        <tr key={nv.nhan_vien_id}>
                                            <td><strong>{nv.ma_nhan_vien}</strong></td>
                                            <td><strong>{nv.ho_ten}</strong></td>
                                            <td>
                                                <span style={{ fontWeight: "600", color: "var(--primary-color)" }}>{nv.ten_bo_phan}</span>
                                            </td>
                                            <td>{nv.gioi_tinh || "-"}</td>
                                            <td>{nv.so_dien_thoai || "-"}</td>
                                            {laAdminOrLeaderKhuVuc && (
                                                <td style={{ textAlign: "center" }}>
                                                    <button
                                                        className="nut-hanh-dong nut-xoa"
                                                        onClick={() => xuLyGo(nv.nhan_vien_id, nv.cong_doan_id)}
                                                    >
                                                        Gỡ khỏi line
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
            )}

            {/* MODAL THÊM / SỬA CÔNG ĐOẠN ĐẸP MẮT (THAY THẾ WINDOW.PROMPT NATIVE) */}
            {modalCongDoanOpen && (
                <Modal
                    isOpen={modalCongDoanOpen}
                    onClose={() => setModalCongDoanOpen(false)}
                    title={modalCongDoanCheDo === "THEM" ? "Thêm công đoạn mới" : `Sửa định biên: ${modalCongDoanTen}`}
                    footer={
                        <>
                            <button type="button" className="nut-huy" onClick={() => setModalCongDoanOpen(false)}>Hủy</button>
                            <button type="button" className="nut-chinh" onClick={xuLyLuuModalCongDoan} style={{ width: "auto", padding: "0 20px" }}>Lưu thay đổi</button>
                        </>
                    }
                >
                    <div className="nhom-o-nhap">
                        <label>Tên công đoạn</label>
                        <input
                            type="text"
                            value={modalCongDoanTen}
                            onChange={(e) => setModalCongDoanTen(e.target.value)}
                            disabled={modalCongDoanCheDo === "SUA"}
                            style={{ 
                                backgroundColor: modalCongDoanCheDo === "SUA" ? "#f1f5f9" : "#fff",
                                color: modalCongDoanCheDo === "SUA" ? "#64748b" : "#1c2128",
                                fontWeight: "bold"
                            }}
                            placeholder="Nhập tên công đoạn sản xuất..."
                        />
                    </div>
                    <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
                        <div className="nhom-o-nhap" style={{ flex: 1 }}>
                            <label>Định biên Tối thiểu (min)</label>
                            <input
                                type="number"
                                min="0"
                                value={modalCongDoanMin}
                                onChange={(e) => setModalCongDoanMin(Number(e.target.value))}
                                required
                            />
                        </div>
                        <div className="nhom-o-nhap" style={{ flex: 1 }}>
                            <label>Định biên Tối đa (max)</label>
                            <input
                                type="number"
                                min="1"
                                value={modalCongDoanMax}
                                onChange={(e) => setModalCongDoanMax(Number(e.target.value))}
                                required
                            />
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

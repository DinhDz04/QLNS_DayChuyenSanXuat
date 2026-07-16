import { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal.jsx";
import { layDanhSachLeaderLine, layChiTietDayChuyen } from "../services/dayChuyen.service.js";
import { layDanhSachKhuVuc } from "../../khu-vuc/services/khuVuc.service.js";

export default function ModalDayChuyen({ isOpen, cheDo, dayChuyen, onClose, onSave }) {
    const [tenDayChuyen, setTenDayChuyen] = useState("");
    const [khuVucId, setKhuVucId] = useState("");
    const [leaderId, setLeaderId] = useState("");
    const [trangThai, setTrangThai] = useState("HOAT_DONG");
    
    const [congDoan, setCongDoan] = useState([
        { so_luong_can: 1, so_luong_min: 1, so_luong_max: 1 }
    ]);
    
    const [danhSachKhuVuc, setDanhSachKhuVuc] = useState([]);
    const [danhSachLeader, setDanhSachLeader] = useState([]);
    const [loi, setLoi] = useState("");
    const [dangXuLy, setDangXuLy] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoi("");
            taiDropdowns();
            if (cheDo === "SUA" && dayChuyen) {
                setTenDayChuyen(dayChuyen.ten_day_chuyen || "");
                setKhuVucId(dayChuyen.khu_vuc_id || "");
                setLeaderId(dayChuyen.leader_id || "");
                setTrangThai(dayChuyen.trang_thai || "HOAT_DONG");
                setCongDoan([]);
                taiCongDoanCuaLine(dayChuyen.id);
            } else {
                setTenDayChuyen("");
                setKhuVucId("");
                setLeaderId("");
                setTrangThai("HOAT_DONG");
                setCongDoan([
                    { so_luong_can: 1, so_luong_min: 1, so_luong_max: 1 }
                ]);
            }
        }
    }, [isOpen, cheDo, dayChuyen]);

    async function taiDropdowns() {
        try {
            const [resKv, resLd] = await Promise.all([
                layDanhSachKhuVuc(),
                layDanhSachLeaderLine()
            ]);
            if (resKv.success) setDanhSachKhuVuc(resKv.data);
            if (resLd.success) setDanhSachLeader(resLd.data);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu dropdown:", err);
        }
    }

    async function taiCongDoanCuaLine(lineId) {
        try {
            const res = await layChiTietDayChuyen(lineId);
            if (res.success && res.data && res.data.bo_phan) {
                const mapped = res.data.bo_phan.map(bp => ({
                    cong_doan_id: bp.cong_doan_id,
                    so_luong_can: bp.so_luong_can,
                    so_luong_min: bp.so_luong_min !== null ? bp.so_luong_min : bp.so_luong_can,
                    so_luong_max: bp.so_luong_max !== null ? bp.so_luong_max : bp.so_luong_can
                }));
                setCongDoan(mapped);
            }
        } catch (err) {
            console.error("Lỗi khi tải các công đoạn của dây chuyền:", err);
        }
    }

    function themCongDoan() {
        setCongDoan([...congDoan, { so_luong_can: 1, so_luong_min: 1, so_luong_max: 1 }]);
    }

    function xoaCongDoan(index) {
        const list = [...congDoan];
        list.splice(index, 1);
        setCongDoan(list);
    }

    function thayDoiCongDoan(index, field, value) {
        const list = [...congDoan];
        list[index] = {
            ...list[index],
            [field]: Number(value)
        };
        setCongDoan(list);
    }

    async function xuLySubmit(e) {
        e.preventDefault();
        setLoi("");
        setDangXuLy(true);

        if (!tenDayChuyen.trim() || !khuVucId) {
            setLoi("Vui lòng điền đầy đủ Tên dây chuyền và chọn Khu vực");
            setDangXuLy(false);
            return;
        }

        // Kiểm tra tối đa >= tối thiểu
        for (let i = 0; i < congDoan.length; i++) {
            const cd = congDoan[i];
            const min = cd.so_luong_min !== undefined ? cd.so_luong_min : cd.so_luong_can;
            const max = cd.so_luong_max !== undefined ? cd.so_luong_max : cd.so_luong_can;
            if (max < min) {
                setLoi(`Công đoạn ${i + 1} có số lượng tối đa (${max}) nhỏ hơn số lượng tối thiểu (${min})`);
                setDangXuLy(false);
                return;
            }
        }

        try {
            const data = {
                ten_day_chuyen: tenDayChuyen.trim(),
                khu_vuc_id: Number(khuVucId),
                leader_id: leaderId ? Number(leaderId) : null,
                trang_thai: trangThai,
                bo_phan: congDoan.map((cd, idx) => ({
                    cong_doan_id: cd.cong_doan_id || null,
                    loai_bo_phan: `${tenDayChuyen.trim()} ${idx + 1}`,
                    so_luong_can: cd.so_luong_min !== undefined ? cd.so_luong_min : cd.so_luong_can,
                    so_luong_min: cd.so_luong_min !== undefined ? cd.so_luong_min : cd.so_luong_can,
                    so_luong_max: cd.so_luong_max !== undefined ? cd.so_luong_max : cd.so_luong_can
                }))
            };
            await onSave(data);
            onClose();
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
                form="form-day-chuyen"
                className="nut-chinh nut-luu" 
                disabled={dangXuLy}
            >
                {dangXuLy ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={cheDo === "THEM" ? "Tạo dây chuyền mới" : "Chỉnh sửa dây chuyền"}
            footer={nutFooter}
            isSubmitting={dangXuLy}
        >
            <form id="form-day-chuyen" onSubmit={xuLySubmit}>
                {loi && <div className="thong-bao-loi">{loi}</div>}

                <div className="nhom-o-nhap">
                    <label htmlFor="modal_ten_day_chuyen">Tên dây chuyền *</label>
                    <input
                        id="modal_ten_day_chuyen"
                        type="text"
                        value={tenDayChuyen}
                        onChange={(e) => setTenDayChuyen(e.target.value)}
                        placeholder="Dây chuyền 1, Assembly Line A,..."
                        required
                    />
                </div>

                <div className="nhom-o-nhap">
                    <label htmlFor="modal_khu_vuc">Thuộc khu vực *</label>
                    <select
                        id="modal_khu_vuc"
                        value={khuVucId}
                        onChange={(e) => setKhuVucId(e.target.value)}
                        required
                    >
                        <option value="">-- Chọn khu vực --</option>
                        {danhSachKhuVuc.map((kv) => (
                            <option key={kv.id} value={kv.id}>
                                {kv.ten_khu_vuc} ({kv.ten_khach_hang})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="nhom-o-nhap">
                    <label htmlFor="modal_leader">Leader phụ trách dây chuyền</label>
                    <select
                        id="modal_leader"
                        value={leaderId}
                        onChange={(e) => setLeaderId(e.target.value)}
                    >
                        <option value="">-- Chưa chọn leader (Có thể chọn sau) --</option>
                        {danhSachLeader.map((ld) => (
                            <option key={ld.id} value={ld.id}>
                                [{ld.ma_nhan_vien}] - {ld.ho_ten}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="nhom-o-nhap">
                    <label htmlFor="modal_trang_thai">Trạng thái dây chuyền</label>
                    <select
                        id="modal_trang_thai"
                        value={trangThai}
                        onChange={(e) => setTrangThai(e.target.value)}
                    >
                        <option value="HOAT_DONG">Hoạt động (HOAT_DONG)</option>
                        <option value="TAM_DUNG">Tạm dừng (TAM_DUNG)</option>
                    </select>
                </div>

                {/* HIỂN THỊ CẤU HÌNH CÔNG ĐOẠN TỰ ĐỘNG THEO TÊN DÂY CHUYỀN */}
                <div className="cau-hinh-bo-phan-dây-chuyen" style={{ marginTop: "24px", borderTop: "1px dashed #cbd5e1", paddingTop: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <h4 style={{ margin: 0, textTransform: "uppercase", fontSize: "13px", color: "var(--text-muted)", letterSpacing: "0.04em" }}>Cấu hình công đoạn dây chuyền</h4>
                        <button type="button" className="nut-hanh-dong nut-sua" onClick={themCongDoan} style={{ padding: "4px 10px", fontSize: "12px" }}>
                            + Thêm công đoạn
                        </button>
                    </div>

                    {congDoan.length === 0 ? (
                        <p style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "13px" }}>Chưa thêm công đoạn nào. Nhân viên sẽ được phân công trực tiếp vào dây chuyền.</p>
                    ) : (
                        congDoan.map((cd, index) => {
                            const tenCongDoanHienThi = `${tenDayChuyen.trim() || "Dây chuyền"} ${index + 1}`;
                            return (
                                <div key={index} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
                                    <div style={{ flex: 1.5 }}>
                                        <input
                                            type="text"
                                            value={tenCongDoanHienThi}
                                            disabled
                                            style={{ 
                                                width: "100%", 
                                                padding: "8px 10px", 
                                                fontSize: "14px", 
                                                border: "1px solid #cbd5e0", 
                                                borderRadius: "var(--radius)", 
                                                backgroundColor: "#f8fafc",
                                                color: "#475569",
                                                fontWeight: "bold"
                                            }}
                                        />
                                    </div>
                                    
                                    <div style={{ flex: 2.2, display: "flex", alignItems: "center", gap: "6px" }}>
                                        <span style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Min:</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={cd.so_luong_min !== undefined ? cd.so_luong_min : cd.so_luong_can}
                                            onChange={(e) => thayDoiCongDoan(index, "so_luong_min", e.target.value)}
                                            placeholder="Tối thiểu"
                                            style={{ width: "65px", padding: "8px", fontSize: "14px", border: "1px solid #cbd5e0", borderRadius: "var(--radius)" }}
                                            required
                                        />
                                        <span style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Max:</span>
                                        <input
                                            type="number"
                                            min="1"
                                            value={cd.so_luong_max !== undefined ? cd.so_luong_max : cd.so_luong_can}
                                            onChange={(e) => thayDoiCongDoan(index, "so_luong_max", e.target.value)}
                                            placeholder="Tối đa"
                                            style={{ width: "65px", padding: "8px", fontSize: "14px", border: "1px solid #cbd5e0", borderRadius: "var(--radius)" }}
                                            required
                                        />
                                        <span style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>người</span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => xoaCongDoan(index)}
                                        style={{ padding: "8px 12px", background: "none", border: "none", color: "var(--red)", fontSize: "16px", cursor: "pointer" }}
                                        title="Xóa công đoạn"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </form>
        </Modal>
    );
}

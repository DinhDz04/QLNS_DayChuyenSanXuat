import { useState, useEffect } from "react";
import { layDanhSachLeaderLine } from "../../servives/dayChuyen.service.js";
import { layDanhSachKhuVuc } from "../../servives/khuVuc.service.js";

const LOAI_CONG_DOAN_MAC_DINH = [
    { value: "Lap rap", label: "Lắp ráp" },
    { value: "Cam tay", label: "Cắm tay" },
    { value: "Van hanh may", label: "Vận hành máy" },
    { value: "May han", label: "Máy hàn" },
    { value: "Sau may han", label: "Sau máy hàn" },
    { value: "Van hanh aoi", label: "Vận hành AOI" },
    { value: "QC", label: "QC" }
];

export default function ModalDayChuyen({ hienThi, cheDo, dayChuyen, onClose, onSave }) {
    const [tenDayChuyen, setTenDayChuyen] = useState("");
    const [khuVucId, setKhuVucId] = useState("");
    const [leaderId, setLeaderId] = useState("");
    const [trangThai, setTrangThai] = useState("HOAT_DONG");
    
    // State quản lý danh sách công đoạn khi tạo mới dây chuyền
    const [congDoan, setCongDoan] = useState([
        { loai_bo_phan: "Lap rap", so_luong_can: 1 }
    ]);
    
    const [danhSachKhuVuc, setDanhSachKhuVuc] = useState([]);
    const [danhSachLeader, setDanhSachLeader] = useState([]);
    const [loi, setLoi] = useState("");
    const [dangXuLy, setDangXuLy] = useState(false);

    useEffect(() => {
        if (hienThi) {
            setLoi("");
            taiDropdowns();
            if (cheDo === "SUA" && dayChuyen) {
                setTenDayChuyen(dayChuyen.ten_day_chuyen || "");
                setKhuVucId(dayChuyen.khu_vuc_id || "");
                setLeaderId(dayChuyen.leader_id || "");
                setTrangThai(dayChuyen.trang_thai || "HOAT_DONG");
                setCongDoan([]);
            } else {
                setTenDayChuyen("");
                setKhuVucId("");
                setLeaderId("");
                setTrangThai("HOAT_DONG");
                setCongDoan([
                    { loai_bo_phan: "Lap rap", so_luong_can: 1 }
                ]);
            }
        }
    }, [hienThi, cheDo, dayChuyen]);

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

    // Các hàm xử lý động mảng công đoạn
    function themCongDoan() {
        setCongDoan([...congDoan, { loai_bo_phan: "Lap rap", so_luong_can: 1 }]);
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
            [field]: field === "so_luong_can" ? Number(value) : value
        };
        setCongDoan(list);
    }

    if (!hienThi) return null;

    async function xuLySubmit(e) {
        e.preventDefault();
        setLoi("");
        setDangXuLy(true);

        if (!tenDayChuyen.trim() || !khuVucId) {
            setLoi("Vui lòng điền đầy đủ Tên dây chuyền và chọn Khu vực");
            setDangXuLy(false);
            return;
        }

        try {
            const data = {
                ten_day_chuyen: tenDayChuyen.trim(),
                khu_vuc_id: Number(khuVucId),
                leader_id: leaderId ? Number(leaderId) : null,
                trang_thai: trangThai
            };
            if (cheDo === "THEM") {
                data.bo_phan = congDoan; // Backend nhận trường này là 'bo_phan' trong payload
            }
            await onSave(data);
            onClose();
        } catch (err) {
            setLoi(err.message || "Lỗi khi lưu thông tin");
        } finally {
            setDangXuLy(false);
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "560px" }}>
                <div className="modal-header">
                    <h3>{cheDo === "THEM" ? "Tạo dây chuyền mới" : "Chỉnh sửa dây chuyền"}</h3>
                    <button className="nut-dong-modal" type="button" onClick={onClose} disabled={dangXuLy}>×</button>
                </div>
                <form onSubmit={xuLySubmit}>
                    <div className="modal-body">
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

                        {cheDo === "THEM" && (
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
                                    congDoan.map((cd, index) => (
                                        <div key={index} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
                                            <div style={{ flex: 2 }}>
                                                <select
                                                    value={cd.loai_bo_phan}
                                                    onChange={(e) => thayDoiCongDoan(index, "loai_bo_phan", e.target.value)}
                                                    style={{ width: "100%", padding: "8px 10px", fontSize: "14px", border: "1px solid #cbd5e0", borderRadius: "var(--radius)" }}
                                                >
                                                    {LOAI_CONG_DOAN_MAC_DINH.map((item) => (
                                                        <option key={item.value} value={item.value}>{item.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={cd.so_luong_can}
                                                    onChange={(e) => thayDoiCongDoan(index, "so_luong_can", e.target.value)}
                                                    placeholder="Số người"
                                                    style={{ width: "100%", padding: "8px 10px", fontSize: "14px", border: "1px solid #cbd5e0", borderRadius: "var(--radius)" }}
                                                    required
                                                />
                                                <span style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>nhân sự</span>
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
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
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
                            className="nut-chinh nut-luu" 
                            disabled={dangXuLy}
                        >
                            {dangXuLy ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

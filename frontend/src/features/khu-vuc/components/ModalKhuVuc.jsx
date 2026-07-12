import { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal.jsx";
import { layDanhSachLeaderKhuVuc, layDanhSachKhachHang } from "../services/khuVuc.service.js";

export default function ModalKhuVuc({ isOpen, cheDo, khuVuc, onClose, onSave }) {
    const [tenKhuVuc, setTenKhuVuc] = useState("");
    const [khachHangId, setKhachHangId] = useState("");
    const [leaderId, setLeaderId] = useState("");
    
    const [danhSachKhachHang, setDanhSachKhachHang] = useState([]);
    const [danhSachLeader, setDanhSachLeader] = useState([]);
    const [loi, setLoi] = useState("");
    const [dangXuLy, setDangXuLy] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoi("");
            taiDropdowns();
            if (cheDo === "SUA" && khuVuc) {
                setTenKhuVuc(khuVuc.ten_khu_vuc || "");
                setKhachHangId(khuVuc.khach_hang_id || "");
                setLeaderId(khuVuc.leader_id || "");
            } else {
                setTenKhuVuc("");
                setKhachHangId("");
                setLeaderId("");
            }
        }
    }, [isOpen, cheDo, khuVuc]);

    async function taiDropdowns() {
        try {
            const [resKh, resLd] = await Promise.all([
                layDanhSachKhachHang(),
                layDanhSachLeaderKhuVuc()
            ]);
            if (resKh.success) setDanhSachKhachHang(resKh.data);
            if (resLd.success) setDanhSachLeader(resLd.data);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu dropdown:", err);
        }
    }

    async function xuLySubmit(e) {
        e.preventDefault();
        setLoi("");
        setDangXuLy(true);

        if (!tenKhuVuc.trim() || !khachHangId) {
            setLoi("Vui lòng điền đầy đủ Tên khu vực và chọn Khách hàng");
            setDangXuLy(false);
            return;
        }

        try {
            const data = {
                ten_khu_vuc: tenKhuVuc.trim(),
                khach_hang_id: Number(khachHangId),
                leader_id: leaderId ? Number(leaderId) : null
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
                form="form-khu-vuc"
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
            title={cheDo === "THEM" ? "Tạo khu vực mới" : "Chỉnh sửa khu vực"}
            footer={nutFooter}
            isSubmitting={dangXuLy}
        >
            <form id="form-khu-vuc" onSubmit={xuLySubmit}>
                {loi && <div className="thong-bao-loi">{loi}</div>}

                <div className="nhom-o-nhap">
                    <label htmlFor="modal_ten_khu_vuc">Tên khu vực *</label>
                    <input
                        id="modal_ten_khu_vuc"
                        type="text"
                        value={tenKhuVuc}
                        onChange={(e) => setTenKhuVuc(e.target.value)}
                        placeholder="Khu vực A, Line 1 Area,..."
                        required
                    />
                </div>

                <div className="nhom-o-nhap">
                    <label htmlFor="modal_khach_hang">Khách hàng liên kết *</label>
                    <select
                        id="modal_khach_hang"
                        value={khachHangId}
                        onChange={(e) => setKhachHangId(e.target.value)}
                        required
                    >
                        <option value="">-- Chọn khách hàng --</option>
                        {danhSachKhachHang.map((kh) => (
                            <option key={kh.id} value={kh.id}>
                                {kh.ten_khach_hang}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="nhom-o-nhap">
                    <label htmlFor="modal_leader">Leader phụ trách khu vực</label>
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
            </form>
        </Modal>
    );
}

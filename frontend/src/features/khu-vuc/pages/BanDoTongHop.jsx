import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import { layDanhSachKhuVuc, layBanDoKhuVuc, luuBanDoKhuVuc } from "../services/khuVuc.service.js";

const GRID_SIZE = 12;

export default function BanDoTongHop() {
    const navigate = useNavigate();
    const { nguoiDung } = useAuth();

    const [danhSachKhuVuc, setDanhSachKhuVuc] = useState([]);
    const [selectedKhuVucId, setSelectedKhuVucId] = useState("");
    const [dayChuyen, setDayChuyen] = useState([]);
    const [selectedDayChuyenId, setSelectedDayChuyenId] = useState(""); // Lọc theo dây chuyền
    const [congDoanList, setCongDoanList] = useState([]);
    const [selectedCdId, setSelectedCdId] = useState(null);
    
    const [dangTaiDs, setDangTaiDs] = useState(true);
    const [dangTaiMap, setDangTaiMap] = useState(false);
    const [dangSave, setDangSave] = useState(false);
    const [loi, setLoi] = useState("");
    const [thongBao, setThongBao] = useState("");

    const laAdminOrLeaderKhuVuc = nguoiDung && ["ADMIN", "LEADER_KHU_VUC"].includes(nguoiDung.role);

    useEffect(() => {
        taiDanhSach();
    }, []);

    async function taiDanhSach() {
        setDangTaiDs(true);
        setLoi("");
        try {
            const res = await layDanhSachKhuVuc();
            if (res.success && res.data.length > 0) {
                setDanhSachKhuVuc(res.data);
                setSelectedKhuVucId(res.data[0].id);
                taiMap(res.data[0].id);
            } else {
                setDanhSachKhuVuc([]);
            }
        } catch (err) {
            setLoi(err.message || "Lỗi khi tải danh sách khu vực");
        } finally {
            setDangTaiDs(false);
        }
    }

    async function taiMap(kvId) {
        if (!kvId) return;
        setDangTaiMap(true);
        setLoi("");
        setSelectedCdId(null);
        setSelectedDayChuyenId(""); // Reset lọc dây chuyền
        try {
            const res = await layBanDoKhuVuc(kvId);
            if (res.success) {
                setDayChuyen(res.data.day_chuyen || []);
                const list = res.data.cong_doan.map(cd => ({
                    ...cd,
                    vi_tri_x: cd.vi_tri_x !== null ? Number(cd.vi_tri_x) : null,
                    vi_tri_y: cd.vi_tri_y !== null ? Number(cd.vi_tri_y) : null,
                    xoay: cd.xoay !== null ? Number(cd.xoay) : 0
                }));
                setCongDoanList(list);
            }
        } catch (err) {
            setLoi(err.message || "Không thể tải sa bàn khu vực");
        } finally {
            setDangTaiMap(false);
        }
    }

    function handleKhuVucChange(e) {
        const val = e.target.value;
        setSelectedKhuVucId(val);
        setCongDoanList([]);
        setDayChuyen([]);
        taiMap(val);
    }

    // Hàm phát hiện va chạm chồng lấn giữa các block trên lưới 12x12
    function kiemTraTrungLap(cdId, x, y, xoay, currentList) {
        const laChieuDocTarget = xoay === 90 || xoay === 270;
        const targetW = laChieuDocTarget ? 1 : 2;
        const targetH = laChieuDocTarget ? 2 : 1;

        const targetLeft = x;
        const targetRight = x + targetW - 1;
        const targetTop = y;
        const targetBottom = y + targetH - 1;

        // Vượt quá bản đồ
        if (targetRight >= GRID_SIZE || targetBottom >= GRID_SIZE) {
            return "Vị trí đặt vượt quá giới hạn sa bàn lưới (12x12).";
        }

        for (const cd of currentList) {
            if (cd.cong_doan_id === cdId || cd.vi_tri_x === null || cd.vi_tri_y === null) {
                continue;
            }

            const laChieuDocOther = cd.xoay === 90 || cd.xoay === 270;
            const otherW = laChieuDocOther ? 1 : 2;
            const otherH = laChieuDocOther ? 2 : 1;

            const otherLeft = cd.vi_tri_x;
            const otherRight = cd.vi_tri_x + otherW - 1;
            const otherTop = cd.vi_tri_y;
            const otherBottom = cd.vi_tri_y + otherH - 1;

            const overlapX = Math.max(0, Math.min(targetRight, otherRight) - Math.max(targetLeft, otherLeft) + 1);
            const overlapY = Math.max(0, Math.min(targetBottom, otherBottom) - Math.max(targetTop, otherTop) + 1);

            if (overlapX > 0 && overlapY > 0) {
                return `Trùng tọa độ: Đè lên công đoạn "${cd.ten_cong_doan}" của dây chuyền "${cd.ten_day_chuyen}".`;
            }
        }
        return null;
    }

    // Đặt cả Line vào ô trống tuần tự (tự động tìm hàng trống tránh chồng đè)
    function datDayChuyenVaoBanDo(dcId) {
        setCongDoanList(prevList => {
            const stepsOfDc = prevList.filter(cd => Number(cd.day_chuyen_id) === Number(dcId));
            if (stepsOfDc.length === 0) return prevList;

            // Tìm hàng y (từ 0 tới GRID_SIZE-1) có thể chứa hết tất cả công đoạn nằm ngang của Line này
            let selectedY = -1;
            for (let y = 0; y < GRID_SIZE; y++) {
                let col = 0;
                let biTrung = false;
                const tempPlacedList = prevList.filter(cd => Number(cd.day_chuyen_id) !== Number(dcId));

                for (const step of stepsOfDc) {
                    if (col + 1 >= GRID_SIZE) {
                        biTrung = true;
                        break;
                    }
                    
                    const targetLeft = col;
                    const targetRight = col + 1;
                    const targetTop = y;
                    const targetBottom = y;

                    const hasCollision = tempPlacedList.some(other => {
                        if (other.vi_tri_x === null || other.vi_tri_y === null) return false;
                        const laChieuDocOther = other.xoay === 90 || other.xoay === 270;
                        const otherW = laChieuDocOther ? 1 : 2;
                        const otherH = laChieuDocOther ? 2 : 1;

                        const otherLeft = other.vi_tri_x;
                        const otherRight = other.vi_tri_x + otherW - 1;
                        const otherTop = other.vi_tri_y;
                        const otherBottom = other.vi_tri_y + otherH - 1;

                        const overlapX = Math.max(0, Math.min(targetRight, otherRight) - Math.max(targetLeft, otherLeft) + 1);
                        const overlapY = Math.max(0, Math.min(targetBottom, otherBottom) - Math.max(targetTop, otherTop) + 1);

                        return overlapX > 0 && overlapY > 0;
                    });

                    if (hasCollision) {
                        biTrung = true;
                        break;
                    }
                    col += 2;
                }

                if (!biTrung) {
                    selectedY = y;
                    break;
                }
            }

            if (selectedY === -1) {
                setLoi("Không tìm thấy hàng trống nào trên sa bàn lưới đủ diện tích đặt dây chuyền này. Vui lòng gỡ hoặc dọn bớt công đoạn khác!");
                setTimeout(() => setLoi(""), 5000);
                return prevList;
            }

            // Gán tọa độ không bị chồng chéo
            let col = 0;
            const updatedList = prevList.map(cd => {
                if (Number(cd.day_chuyen_id) === Number(dcId)) {
                    const updated = { ...cd, vi_tri_x: col, vi_tri_y: selectedY, xoay: 0 };
                    col += 2;
                    return updated;
                }
                return cd;
            });

            // Chọn công đoạn đầu tiên
            const firstCd = updatedList.find(cd => Number(cd.day_chuyen_id) === Number(dcId));
            if (firstCd) {
                setSelectedCdId(firstCd.cong_doan_id);
            }

            return updatedList;
        });
    }

    // Gỡ cả dây chuyền
    function goDayChuyenKhoiBanDo(dcId) {
        setCongDoanList(prevList => 
            prevList.map(cd => {
                if (Number(cd.day_chuyen_id) === Number(dcId)) {
                    return { ...cd, vi_tri_x: null, vi_tri_y: null, xoay: 0 };
                }
                return cd;
            })
        );
        setSelectedCdId(null);
    }

    // Gỡ 1 công đoạn
    function goKhoiBanDo(cdId) {
        setCongDoanList(prevList => 
            prevList.map(cd => {
                if (cd.cong_doan_id === cdId) {
                    return { ...cd, vi_tri_x: null, vi_tri_y: null, xoay: 0 };
                }
                return cd;
            })
        );
        if (selectedCdId === cdId) {
            setSelectedCdId(null);
        }
    }

    // Thay đổi vị trí / xoay bằng nút bấm (có check va chạm)
    function capNhatThuocTinh(cdId, field, delta) {
        setLoi("");
        setCongDoanList(prevList => {
            const currentStep = prevList.find(cd => cd.cong_doan_id === cdId);
            if (!currentStep) return prevList;

            let nextX = currentStep.vi_tri_x;
            let nextY = currentStep.vi_tri_y;
            let nextXoay = currentStep.xoay;

            if (field === "vi_tri_x") {
                nextX = Math.max(0, Math.min(GRID_SIZE - 1, (currentStep.vi_tri_x || 0) + delta));
            } else if (field === "vi_tri_y") {
                nextY = Math.max(0, Math.min(GRID_SIZE - 1, (currentStep.vi_tri_y || 0) + delta));
            } else if (field === "xoay") {
                nextXoay = (currentStep.xoay + 90) % 360;
            }

            const trungLapMsg = kiemTraTrungLap(cdId, nextX, nextY, nextXoay, prevList);
            if (trungLapMsg) {
                setLoi(trungLapMsg);
                setTimeout(() => setLoi(""), 4000);
                return prevList; // Giữ nguyên vị trí cũ
            }

            return prevList.map(cd => {
                if (cd.cong_doan_id === cdId) {
                    return { ...cd, vi_tri_x: nextX, vi_tri_y: nextY, xoay: nextXoay };
                }
                return cd;
            });
        });
    }

    // Click ô trống trên lưới để di chuyển (có check va chạm)
    function handleCellClick(x, y) {
        if (!laAdminOrLeaderKhuVuc) return;
        setLoi("");

        const occupiedCd = congDoanList.find(cd => {
            if (cd.vi_tri_x === null) return false;
            const laChieuDoc = cd.xoay === 90 || cd.xoay === 270;
            const widthSpan = laChieuDoc ? 1 : 2;
            const heightSpan = laChieuDoc ? 2 : 1;
            
            return (
                x >= cd.vi_tri_x && x < cd.vi_tri_x + widthSpan &&
                y >= cd.vi_tri_y && y < cd.vi_tri_y + heightSpan
            );
        });

        if (occupiedCd) {
            setSelectedCdId(occupiedCd.cong_doan_id);
        } else if (selectedCdId) {
            const selectedStep = congDoanList.find(cd => cd.cong_doan_id === selectedCdId);
            if (selectedStep) {
                const trungLapMsg = kiemTraTrungLap(selectedCdId, x, y, selectedStep.xoay, congDoanList);
                if (trungLapMsg) {
                    setLoi(trungLapMsg);
                    setTimeout(() => setLoi(""), 4000);
                    return; // Chặn dịch chuyển
                }
            }

            setCongDoanList(prevList => 
                prevList.map(cd => {
                    if (cd.cong_doan_id === selectedCdId) {
                        return { ...cd, vi_tri_x: x, vi_tri_y: y };
                    }
                    return cd;
                })
            );
        }
    }

    // Lưu sa bàn
    async function xuLyLuuBanDo() {
        if (!laAdminOrLeaderKhuVuc) return;
        setDangSave(true);
        setLoi("");
        setThongBao("");

        // Kiểm tra trùng lặp lần cuối trước khi lưu
        const congDoanDaDatTemp = congDoanList.filter(cd => cd.vi_tri_x !== null);
        for (let i = 0; i < congDoanDaDatTemp.length; i++) {
            const cdA = congDoanDaDatTemp[i];
            const laChieuDocA = cdA.xoay === 90 || cdA.xoay === 270;
            const wA = laChieuDocA ? 1 : 2;
            const hA = laChieuDocA ? 2 : 1;

            for (let j = i + 1; j < congDoanDaDatTemp.length; j++) {
                const cdB = congDoanDaDatTemp[j];
                const laChieuDocB = cdB.xoay === 90 || cdB.xoay === 270;
                const wB = laChieuDocB ? 1 : 2;
                const hB = laChieuDocB ? 2 : 1;

                const overlapX = Math.max(0, Math.min(cdA.vi_tri_x + wA - 1, cdB.vi_tri_x + wB - 1) - Math.max(cdA.vi_tri_x, cdB.vi_tri_x) + 1);
                const overlapY = Math.max(0, Math.min(cdA.vi_tri_y + hA - 1, cdB.vi_tri_y + hB - 1) - Math.max(cdA.vi_tri_y, cdB.vi_tri_y) + 1);

                if (overlapX > 0 && overlapY > 0) {
                    setLoi(`Không thể lưu: Công đoạn "${cdA.ten_cong_doan}" đang bị xếp chồng lấn lên công đoạn "${cdB.ten_cong_doan}". Vui lòng điều chỉnh lại!`);
                    setDangSave(false);
                    return;
                }
            }
        }

        try {
            const payload = {
                cong_doan_positions: congDoanList.map(cd => ({
                    cong_doan_id: cd.cong_doan_id,
                    vi_tri_x: cd.vi_tri_x,
                    vi_tri_y: cd.vi_tri_y,
                    xoay: cd.xoay
                }))
            };

            const res = await luuBanDoKhuVuc(selectedKhuVucId, payload);
            if (res.success) {
                setThongBao("Đã lưu sơ đồ bản đồ khu vực thành công xuống database!");
                setTimeout(() => setThongBao(""), 4000);
            }
        } catch (err) {
            setLoi(err.message || "Không thể lưu sơ đồ");
        } finally {
            setDangSave(false);
        }
    }

    const selectedStep = congDoanList.find(cd => cd.cong_doan_id === selectedCdId);
    const congDoanDaDat = congDoanList.filter(cd => cd.vi_tri_x !== null);

    // Tính danh sách Dây chuyền chưa đặt
    const dayChuyenChuaDat = dayChuyen.filter(dc => {
        const stepsOfDc = congDoanList.filter(cd => Number(cd.day_chuyen_id) === Number(dc.id));
        if (stepsOfDc.length === 0) return false;
        return stepsOfDc.every(cd => cd.vi_tri_x === null);
    });

    // Lọc theo bộ lọc
    const congDoanDaDatLoc = congDoanDaDat.filter(cd => {
        if (!selectedDayChuyenId) return true;
        return Number(cd.day_chuyen_id) === Number(selectedDayChuyenId);
    });

    const dayChuyenChuaDatLoc = dayChuyenChuaDat.filter(dc => {
        if (!selectedDayChuyenId) return true;
        return Number(dc.id) === Number(selectedDayChuyenId);
    });

    // Tạo danh sách lưới 12x12
    const cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            cells.push({ x, y });
        }
    }

    return (
        <div className="noi-dung-admin" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
            {/* Header */}
            <div className="admin-header-bar" style={{ flexShrink: 0, borderBottom: "1px solid #cbd5e1", paddingBottom: "12px", marginBottom: "16px" }}>
                <div className="tieu-de-khoi">
                    <h2>Bản đồ sa bàn mặt bằng nhà máy</h2>
                    <p>Đặt cả dây chuyền (Line) vào sa bàn, click chọn từng công đoạn của dây chuyền đó trên lưới để sắp đặt chi tiết</p>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <span style={{ fontSize: "13px", fontWeight: "bold" }}>Khu vực:</span>
                        {dangTaiDs ? (
                            <span style={{ fontSize: "13px" }}>Đang tải...</span>
                        ) : (
                            <select 
                                value={selectedKhuVucId} 
                                onChange={handleKhuVucChange}
                                style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", minWidth: "160px", fontSize: "14px" }}
                            >
                                <option value="">-- Chọn khu vực --</option>
                                {danhSachKhuVuc.map(kv => (
                                    <option key={kv.id} value={kv.id}>{kv.ten_khu_vuc}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {selectedKhuVucId && (
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <span style={{ fontSize: "13px", fontWeight: "bold" }}>Lọc Dây chuyền:</span>
                            <select 
                                value={selectedDayChuyenId} 
                                onChange={(e) => { setSelectedDayChuyenId(e.target.value); setSelectedCdId(null); }}
                                style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", minWidth: "160px", fontSize: "14px" }}
                            >
                                <option value="">-- Tất cả dây chuyền --</option>
                                {dayChuyen.map(dc => (
                                    <option key={dc.id} value={dc.id}>{dc.ten_day_chuyen}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {laAdminOrLeaderKhuVuc && selectedKhuVucId && (
                        <button 
                            className="nut-chinh" 
                            onClick={xuLyLuuBanDo} 
                            disabled={dangSave}
                            style={{ backgroundColor: "var(--green)", height: "38px" }}
                        >
                            {dangSave ? "Đang lưu..." : "💾 Lưu sơ đồ bản đồ"}
                        </button>
                    )}
                </div>
            </div>

            {thongBao && <div className="thong-bao-thanh-cong" style={{ flexShrink: 0, margin: "0 0 12px 0" }}>{thongBao}</div>}
            {loi && <div className="thong-bao-loi" style={{ flexShrink: 0, margin: "0 0 12px 0" }}>{loi}</div>}

            <div style={{ display: "flex", flex: 1, gap: "16px", minHeight: 0, overflow: "hidden" }}>
                
                {/* SIDEBAR TRÁI */}
                <div style={{ width: "300px", display: "flex", flexDirection: "column", gap: "16px", flexShrink: 0, overflowY: "auto" }}>
                    
                    {selectedKhuVucId && (
                        <div className="the-thong-tin" style={{ padding: "16px", margin: 0 }}>
                            <h3 style={{ fontSize: "14px", marginTop: 0, marginBottom: "12px" }}>⛓️ Dây chuyền chưa đặt ({dayChuyenChuaDatLoc.length})</h3>
                            {dayChuyenChuaDatLoc.length === 0 ? (
                                <p style={{ fontStyle: "italic", fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Không còn dây chuyền nào chưa đặt.</p>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {dayChuyenChuaDatLoc.map(dc => {
                                        const countCd = congDoanList.filter(cd => Number(cd.day_chuyen_id) === Number(dc.id)).length;
                                        return (
                                            <div 
                                                key={dc.id} 
                                                style={{ 
                                                    padding: "10px", 
                                                    border: "1px solid #cbd5e0", 
                                                    borderRadius: "6px",
                                                    backgroundColor: "#f8fafc"
                                                }}
                                            >
                                                <div style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>
                                                    {dc.ten_day_chuyen}
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{countCd} công đoạn</span>
                                                    {laAdminOrLeaderKhuVuc && (
                                                        <button 
                                                            onClick={() => datDayChuyenVaoBanDo(dc.id)}
                                                            style={{ 
                                                                padding: "4px 10px", 
                                                                fontSize: "11px", 
                                                                backgroundColor: "var(--green)", 
                                                                color: "#ffffff", 
                                                                border: "none", 
                                                                borderRadius: "4px",
                                                                cursor: "pointer",
                                                                fontWeight: "bold"
                                                            }}
                                                        >
                                                            + Đặt sa bàn
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {selectedStep ? (
                        <div className="the-thong-tin" style={{ padding: "16px", margin: 0, border: "2px solid var(--primary-color)", backgroundColor: "#f0f9ff" }}>
                            <h3 style={{ fontSize: "14px", marginTop: 0, marginBottom: "4px", color: "var(--primary-color)" }}>⚙️ Điều chỉnh vị trí</h3>
                            <p style={{ fontSize: "12px", margin: "0 0 8px 0" }}>
                                Đang chọn: <strong>{selectedStep.ten_cong_doan}</strong>
                            </p>
                            <div style={{ fontSize: "11px", backgroundColor: "#ffffff", padding: "8px", borderRadius: "4px", border: "1px solid #e2e8f0", marginBottom: "12px" }}>
                                <span style={{ display: "block", color: "var(--text-muted)" }}>Dây chuyền phụ thuộc:</span>
                                <strong>{selectedStep.ten_day_chuyen}</strong>
                            </div>

                            {laAdminOrLeaderKhuVuc ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: "12px" }}>Tọa độ Ngang (X):</span>
                                        <div style={{ display: "flex", gap: "6px" }}>
                                            <button onClick={() => capNhatThuocTinh(selectedCdId, "vi_tri_x", -1)} style={{ padding: "4px 10px", fontWeight: "bold" }}>-</button>
                                            <span style={{ minWidth: "20px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }}>{selectedStep.vi_tri_x}</span>
                                            <button onClick={() => capNhatThuocTinh(selectedCdId, "vi_tri_x", 1)} style={{ padding: "4px 10px", fontWeight: "bold" }}>+</button>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: "12px" }}>Tọa độ Dọc (Y):</span>
                                        <div style={{ display: "flex", gap: "6px" }}>
                                            <button onClick={() => capNhatThuocTinh(selectedCdId, "vi_tri_y", -1)} style={{ padding: "4px 10px", fontWeight: "bold" }}>-</button>
                                            <span style={{ minWidth: "20px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }}>{selectedStep.vi_tri_y}</span>
                                            <button onClick={() => capNhatThuocTinh(selectedCdId, "vi_tri_y", 1)} style={{ padding: "4px 10px", fontWeight: "bold" }}>+</button>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: "12px" }}>Góc xoay:</span>
                                        <button 
                                            onClick={() => capNhatThuocTinh(selectedCdId, "xoay")}
                                            style={{ padding: "6px 12px", fontSize: "11px", backgroundColor: "#e2e8f0", border: "1px solid #cbd5e0", borderRadius: "4px", cursor: "pointer" }}
                                        >
                                            🔄 Xoay 90° ({selectedStep.xoay}°)
                                        </button>
                                    </div>

                                    <div style={{ width: "1px", height: "10px", backgroundColor: "#cbd5e1" }} />

                                    <button 
                                        onClick={() => goKhoiBanDo(selectedCdId)}
                                        style={{ 
                                            padding: "8px", 
                                            fontSize: "12px", 
                                            backgroundColor: "var(--red)", 
                                            color: "#ffffff", 
                                            border: "none", 
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontWeight: "bold",
                                            marginBottom: "6px"
                                        }}
                                    >
                                        ❌ Gỡ công đoạn này
                                    </button>

                                    <button 
                                        onClick={() => goDayChuyenKhoiBanDo(selectedStep.day_chuyen_id)}
                                        style={{ 
                                            padding: "8px", 
                                            fontSize: "11px", 
                                            backgroundColor: "#b91c1c", 
                                            color: "#ffffff", 
                                            border: "none", 
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontWeight: "bold"
                                        }}
                                    >
                                        🗑️ Gỡ toàn bộ Dây chuyền
                                    </button>
                                </div>
                            ) : (
                                <p style={{ fontSize: "12px", fontStyle: "italic", color: "var(--text-muted)", margin: 0 }}>Bạn chỉ có quyền xem bản đồ.</p>
                            )}
                        </div>
                    ) : (
                        <div className="the-thong-tin" style={{ padding: "16px", margin: 0, fontStyle: "italic", fontSize: "12px", color: "var(--text-muted)" }}>
                            💡 Click **"+ Đặt sa bàn"** trên thẻ Dây chuyền chưa đặt ở trên để đưa toàn bộ dây chuyền lên lưới, sau đó di chuyển các công đoạn của nó bằng cách nhấp ô trống.
                        </div>
                    )}
                </div>

                {/* KHU VỰC SA BÀN LƯỚI TRỰC QUAN */}
                <div style={{ 
                    flex: 1, 
                    border: "2px solid #64748b", 
                    borderRadius: "8px", 
                    background: "#0f172a", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    overflow: "auto",
                    padding: "20px",
                    position: "relative"
                }}>
                    {dangTaiMap ? (
                        <div style={{ color: "#ffffff", fontSize: "16px", fontStyle: "italic" }}>Đang quét tải sa bàn...</div>
                    ) : selectedKhuVucId && congDoanList.length === 0 ? (
                        <div style={{ color: "#94a3b8", fontSize: "14px", fontStyle: "italic", textAlign: "center" }}>
                            Khu vực này chưa cấu hình sa bàn công đoạn nào.
                        </div>
                    ) : !selectedKhuVucId ? (
                        <div style={{ color: "#94a3b8", fontSize: "14px", fontStyle: "italic" }}>Vui lòng chọn 1 khu vực để hiển thị sa bàn.</div>
                    ) : (
                        <div style={{ 
                            position: "relative",
                            display: "grid", 
                            gridTemplateColumns: `repeat(${GRID_SIZE}, 75px)`, 
                            gridTemplateRows: `repeat(${GRID_SIZE}, 75px)`,
                            gap: "2px",
                            backgroundColor: "#334155", 
                            padding: "2px",
                            borderRadius: "4px",
                            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)"
                        }}>
                            {/* Lưới ô nền */}
                            {cells.map(cell => (
                                <div 
                                    key={`${cell.x}-${cell.y}`} 
                                    onClick={() => handleCellClick(cell.x, cell.y)}
                                    style={{ 
                                        width: "75px", 
                                        height: "75px", 
                                        backgroundColor: "#1e293b", 
                                        borderRadius: "2px",
                                        cursor: laAdminOrLeaderKhuVuc ? "crosshair" : "default"
                                    }} 
                                />
                            ))}

                            {/* Vẽ đè các công đoạn đã lọc */}
                            {congDoanDaDatLoc.map(cd => {
                                const isSelected = cd.cong_doan_id === selectedCdId;
                                const isThieu = Number(cd.so_luong_da_gan) < Number(cd.so_luong_can);
                                
                                const laChieuDoc = cd.xoay === 90 || cd.xoay === 270;
                                const gridColSpan = laChieuDoc ? 1 : 2;
                                const gridRowSpan = laChieuDoc ? 2 : 1;

                                return (
                                    <div
                                        key={cd.cong_doan_id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCdId(cd.cong_doan_id);
                                        }}
                                        style={{
                                            gridColumn: `${cd.vi_tri_x + 1} / span ${gridColSpan}`,
                                            gridRow: `${cd.vi_tri_y + 1} / span ${gridRowSpan}`,
                                            backgroundColor: isThieu ? "#ef4444" : "#10b981",
                                            border: isSelected ? "3px solid #f59e0b" : "1px solid rgba(255,255,255,0.2)",
                                            borderRadius: "6px",
                                            padding: "6px",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "space-between",
                                            color: "#ffffff",
                                            cursor: "pointer",
                                            boxShadow: isSelected ? "0 0 12px #f59e0b" : "0 4px 6px rgba(0,0,0,0.15)",
                                            transition: "all 0.15s ease",
                                            zIndex: isSelected ? 10 : 5,
                                            transform: `scale(${isSelected ? 1.02 : 1})`
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "9px" }}>
                                            <span style={{ opacity: 0.85, fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "90px" }}>
                                                {cd.ten_day_chuyen}
                                            </span>
                                            <span>{isThieu ? "⚠️" : "✅"}</span>
                                        </div>
                                        
                                        <div style={{ fontWeight: "bold", fontSize: "11px", textAlign: "center", margin: "1px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {cd.ten_cong_doan}
                                        </div>

                                        <div style={{ 
                                            fontSize: "8px", 
                                            opacity: 0.9, 
                                            maxHeight: "22px", 
                                            overflowY: "auto", 
                                            textAlign: "center", 
                                            lineHeight: "1.1", 
                                            borderTop: "1px solid rgba(255,255,255,0.15)", 
                                            paddingTop: "2px",
                                            marginBottom: "2px",
                                            scrollbarWidth: "none"
                                        }}>
                                            {cd.danh_sach_nv ? cd.danh_sach_nv : <span style={{ opacity: 0.6, fontStyle: "italic" }}>Chưa gán</span>}
                                        </div>

                                        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                            <div style={{ fontSize: "9px", fontWeight: "bold", flex: 1 }}>
                                                👥 {cd.so_luong_da_gan}/{cd.so_luong_can}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/admin/day-chuyen/${cd.day_chuyen_id}`);
                                                }}
                                                style={{
                                                    padding: "2px 4px",
                                                    fontSize: "8px",
                                                    backgroundColor: "rgba(255,255,255,0.25)",
                                                    border: "none",
                                                    borderRadius: "3px",
                                                    color: "#ffffff",
                                                    cursor: "pointer",
                                                    fontWeight: "bold"
                                                }}
                                                title="Bấm để sang trang gán nhân viên"
                                            >
                                                👉 Gán
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

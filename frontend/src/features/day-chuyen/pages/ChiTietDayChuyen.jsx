import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import {
    layChiTietDayChuyen,
    layUngVienChoBoPhan,
    phanCongNhanSu,
    thayDoiNhanSu,
    goPhanCongNhanSu,
    dieuChinhPhanCong,
    tuDongGanNhanSu,
    nghiPhepPhanCong,
    capNhatDayChuyen,
    capNhatTrangThaiPhanCong,
    layLichSuPhanCong
} from "../services/dayChuyen.service.js";


export default function ChiTietDayChuyen() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { nguoiDung } = useAuth();

    const [duLieu, setDuLieu] = useState(null);
    const [ngay, setNgay] = useState(new Date().toISOString().split("T")[0]);
    const [ngayBatDau, setNgayBatDau] = useState(new Date().toISOString().split("T")[0]);
    const [ngayKetThuc, setNgayKetThuc] = useState(new Date().toISOString().split("T")[0]);
    const [caLamId, setCaLamId] = useState("");
    const [hienKhungAutoAssign, setHienKhungAutoAssign] = useState(false);
    const [dangTai, setDangTai] = useState(true);
    const [loi, setLoi] = useState("");
    const [thongBao, setThongBao] = useState("");

    // State quản lý việc chọn nhân viên gán vào công đoạn
    const [hienThiGan, setHienThiGan] = useState(null); // Lưu ID của cong_doan đang muốn gán
    const [danhSachUngVien, setDanhSachUngVien] = useState([]);
    const [danhSachChonMulti, setDanhSachChonMulti] = useState([]); // Mảng các ID nhân viên được tích chọn
    const [loiPhanCong, setLoiPhanCong] = useState("");
    const [dangTaiUngVien, setDangTaiUngVien] = useState(false);
    const [ganStartDatetime, setGanStartDatetime] = useState("");
    const [ganEndDatetime, setGanEndDatetime] = useState("");
    const [daKiemTraLichGan, setDaKiemTraLichGan] = useState(false);
    const [dangAutoAssign, setDangAutoAssign] = useState(false);
    const [hienGioAutoAssign, setHienGioAutoAssign] = useState(false); // Hiện ô chọn khoảng ngày ngay cạnh nút "Tự động gán"

    // State quản lý Thay đổi/Thay thế nhân viên
    const [modalThayDoiOpen, setModalThayDoiOpen] = useState(false);
    const [targetNhanVienCu, setTargetNhanVienCu] = useState(null);
    const [targetCongDoanThayDoi, setTargetCongDoanThayDoi] = useState(null);
    const [danhSachUngVienThayDoi, setDanhSachUngVienThayDoi] = useState([]);
    const [selectedNhanVienMoiId, setSelectedNhanVienMoiId] = useState("");
    const [dangTaiUngVienThayDoi, setDangTaiUngVienThayDoi] = useState(false);
    const [dangLuuThayDoi, setDangLuuThayDoi] = useState(false);
    const [thayTheStartDatetime, setThayTheStartDatetime] = useState("");
    const [thayTheEndDatetime, setThayTheEndDatetime] = useState("");
    const [loiThayDoi, setLoiThayDoi] = useState("");
    const [daKiemTraLichThayThe, setDaKiemTraLichThayThe] = useState(false);
    const [modalDieuChinhOpen, setModalDieuChinhOpen] = useState(false);
    const [targetDieuChinh, setTargetDieuChinh] = useState(null);
    const [dieuChinhStartDatetime, setDieuChinhStartDatetime] = useState("");
    const [dieuChinhEndDatetime, setDieuChinhEndDatetime] = useState("");
    const [dangLuuDieuChinh, setDangLuuDieuChinh] = useState(false);
    const [loiDieuChinh, setLoiDieuChinh] = useState("");
    const [modalGoOpen, setModalGoOpen] = useState(false);
    const [targetNguoiGo, setTargetNguoiGo] = useState(null);
    const [targetCongDoanGo, setTargetCongDoanGo] = useState(null);
    const [goStartDatetime, setGoStartDatetime] = useState("");
    const [goEndDatetime, setGoEndDatetime] = useState("");
    const [dangXacNhanGo, setDangXacNhanGo] = useState(false);
    const [modalNghiPhepOpen, setModalNghiPhepOpen] = useState(false);
    const [targetNghiPhep, setTargetNghiPhep] = useState(null);
    const [nghiPhepStartDatetime, setNghiPhepStartDatetime] = useState("");
    const [nghiPhepEndDatetime, setNghiPhepEndDatetime] = useState("");
    const [dangLuuNghiPhep, setDangLuuNghiPhep] = useState(false);
    const [loiNghiPhep, setLoiNghiPhep] = useState("");

    // Chế độ xem: "CONG_DOAN" (xem theo từng công đoạn) hoặc "TAT_CA" (xem gộp toàn bộ)
    const [cheDoXem, setCheDoXem] = useState("CONG_DOAN");
    const [tuKhoaTimKiemNhanSu, setTuKhoaTimKiemNhanSu] = useState("");

    // Bộ lọc lịch sử phân công theo Line → công đoạn → nhân viên → thời gian.
    const [lichSuPhanCong, setLichSuPhanCong] = useState([]);
    const [lichSuCongDoanId, setLichSuCongDoanId] = useState("");
    const [lichSuNhanVienId, setLichSuNhanVienId] = useState("");
    const [lichSuTuNgay, setLichSuTuNgay] = useState(ngayBatDau);
    const [lichSuDenNgay, setLichSuDenNgay] = useState(ngayKetThuc);
    const [lichSuHanhDong, setLichSuHanhDong] = useState("");
    const [dangTaiLichSu, setDangTaiLichSu] = useState(false);

    // Modal & Chế độ xem Lịch làm việc Timeline / Calendar
    const [modalXemLichOpen, setModalXemLichOpen] = useState(false);
    const [cheDoLocThoiGian, setCheDoLocThoiGian] = useState("TUAN"); // "TUAN", "THANG", "NAM", "TUY_CHINH"
    const [namLoc, setNamLoc] = useState(new Date().getFullYear());
    const [thangLoc, setThangLoc] = useState(new Date().getMonth() + 1);
    const [tuanDuocChon, setTuanDuocChon] = useState(1);

    // Tính danh sách 52-53 tuần trong năm được chọn
    const danhSachTuan = useMemo(() => {
        const weeks = [];
        let d = new Date(namLoc, 0, 1);
        const day = d.getDay();
        const diff = (day === 0 ? -6 : 1) - day;
        d.setDate(d.getDate() + diff);

        let weekNum = 1;
        while (weekNum <= 53) {
            const start = new Date(d);
            const end = new Date(d);
            end.setDate(end.getDate() + 6);

            if (start.getFullYear() > namLoc && weekNum > 50) break;

            const startStr = start.toISOString().slice(0, 10);
            const endStr = end.toISOString().slice(0, 10);
            const f = (dt) => `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;

            weeks.push({
                weekNum,
                label: `Tuần ${weekNum} (${f(start)} - ${f(end)})`,
                startStr,
                endStr
            });

            d.setDate(d.getDate() + 7);
            weekNum++;
        }
        return weeks;
    }, [namLoc]);

    // Tìm tuần tương ứng với ngày hiện tại khi đổi năm
    useEffect(() => {
        if (danhSachTuan.length > 0 && cheDoLocThoiGian === "TUAN") {
            const todayStr = new Date().toISOString().slice(0, 10);
            const foundWeek = danhSachTuan.find(w => w.startStr <= todayStr && w.endStr >= todayStr) || danhSachTuan[0];
            if (foundWeek) {
                setTuanDuocChon(foundWeek.weekNum);
                setLichSuTuNgay(foundWeek.startStr);
                setLichSuDenNgay(foundWeek.endStr);
            }
        }
    }, [danhSachTuan]);

    const capNhatKhoangThoiGianLichSu = (mode, year = namLoc, month = thangLoc, weekNum = tuanDuocChon) => {
        setCheDoLocThoiGian(mode);
        const y = Number(year) || new Date().getFullYear();
        const m = Number(month) || (new Date().getMonth() + 1);

        if (mode === "TUAN") {
            const weekObj = danhSachTuan.find(w => w.weekNum === Number(weekNum)) || danhSachTuan[0];
            if (weekObj) {
                setTuanDuocChon(weekObj.weekNum);
                setLichSuTuNgay(weekObj.startStr);
                setLichSuDenNgay(weekObj.endStr);
            }
        } else if (mode === "THANG") {
            const firstDay = `${y}-${String(m).padStart(2, '0')}-01`;
            const lastDayDate = new Date(y, m, 0);
            const lastDay = `${y}-${String(m).padStart(2, '0')}-${String(lastDayDate.getDate()).padStart(2, '0')}`;
            setLichSuTuNgay(firstDay);
            setLichSuDenNgay(lastDay);
        } else if (mode === "NAM") {
            setLichSuTuNgay(`${y}-01-01`);
            setLichSuDenNgay(`${y}-12-31`);
        }
    };

    // Mảng danh sách các ngày để vẽ Timeline matrix
    const danhSachNgayTimeline = useMemo(() => {
        if (!lichSuTuNgay || !lichSuDenNgay) return [];
        const list = [];
        let curr = new Date(lichSuTuNgay);
        const last = new Date(lichSuDenNgay);
        let count = 0;
        while (curr <= last && count < 62) {
            list.push(curr.toISOString().slice(0, 10));
            curr.setDate(curr.getDate() + 1);
            count++;
        }
        return list;
    }, [lichSuTuNgay, lichSuDenNgay]);

    // State cho Modal thêm/sửa công đoạn đẹp mắt thay thế window.prompt
    const [modalCongDoanOpen, setModalCongDoanOpen] = useState(false);
    const [modalCongDoanCheDo, setModalCongDoanCheDo] = useState("THEM"); // "THEM" hoặc "SUA"
    const [modalCongDoanTarget, setModalCongDoanTarget] = useState(null);
    const [modalCongDoanTen, setModalCongDoanTen] = useState("");
    const [modalCongDoanMin, setModalCongDoanMin] = useState(1);
    const [modalCongDoanMax, setModalCongDoanMax] = useState(1);

    // Phân công nhân sự hằng ngày: chỉ ADMIN và Trưởng khu vực
    const laAdminOrLeaderKhuVuc = nguoiDung && ["ADMIN", "LEADER_KHU_VUC"].includes(nguoiDung.role);
    // Cấu hình công đoạn/định biên: thêm cả Trưởng dây chuyền (chỉ line của mình - backend kiểm tra phạm vi)
    const laQuyenCauHinh = nguoiDung && ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE"].includes(nguoiDung.role);
    // ADMIN/MANAGER xem được tất cả các ca; Leader bị khóa về ca của chính mình
    const laAdmin = nguoiDung && ["ADMIN", "MANAGER"].includes(nguoiDung.role);

    useEffect(() => {
        TaiChiTiet();
    }, [id, ngay, caLamId]);

    useEffect(() => {
        if (!id || !duLieu) return;
        let daHuy = false;
        setDangTaiLichSu(true);
        layLichSuPhanCong({
            dayChuyenId: id,
            congDoanId: lichSuCongDoanId || undefined,
            nhanVienId: lichSuNhanVienId || undefined,
            tuNgay: lichSuTuNgay || undefined,
            denNgay: lichSuDenNgay || undefined,
            hanhDong: lichSuHanhDong || undefined
        }).then((res) => {
            if (!daHuy) setLichSuPhanCong(res.data || []);
        }).catch((err) => {
            if (!daHuy) setLoi(err.message || "Không thể tải lịch sử phân công");
        }).finally(() => {
            if (!daHuy) setDangTaiLichSu(false);
        });
        return () => { daHuy = true; };
    }, [id, duLieu, lichSuCongDoanId, lichSuNhanVienId, lichSuTuNgay, lichSuDenNgay, lichSuHanhDong]);

    async function TaiChiTiet() {
        setDangTai(true);
        setLoi("");
        try {
            const res = await layChiTietDayChuyen(id, ngay, caLamId);
            if (res.success) {
                setDuLieu(res.data);
                // Leader: khóa ca về đúng ca cố định của chính mình để chỉ thấy nhân sự cùng ca.
                if (!laAdmin && res.data.ca_lam_id_cua_toi) {
                    if (caLamId !== res.data.ca_lam_id_cua_toi) {
                        setCaLamId(res.data.ca_lam_id_cua_toi);
                    }
                } else if (laAdmin && !caLamId) {
                    setCaLamId("ALL");
                }
            }
        } catch (err) {
            setLoi(err.message || "Không thể tải chi tiết dây chuyền");
        } finally {
            setDangTai(false);
        }
    }

    const toDateTimeLocal = (value) => {
        if (!value) return "";
        let normalized = String(value).trim().replace(" ", "T");
        if (normalized.length >= 16) {
            return normalized.slice(0, 16);
        }
        return normalized;
    };

    const chuyenDateTimeLocalThanhApi = (value) => {
        if (!value) return "";
        return `${value.replace("T", " ")}:00`;
    };

    const layMacDinhThoiGianPhanCong = (ngayApDung, thoiGianBatDau, thoiGianKetThuc) => {
        if (thoiGianBatDau && thoiGianKetThuc) {
            return {
                start: toDateTimeLocal(thoiGianBatDau),
                end: toDateTimeLocal(thoiGianKetThuc)
            };
        }
        const caHienTai = duLieu?.danh_sach_ca_lam?.find((ca) => String(ca.id) === String(caLamId));
        if (caHienTai?.gio_bat_dau && caHienTai?.gio_ket_thuc) {
            const gioBatDau = String(caHienTai.gio_bat_dau).slice(0, 5);
            const gioKetThuc = String(caHienTai.gio_ket_thuc).slice(0, 5);
            const quaDem = gioKetThuc <= gioBatDau;
            const ngayKet = quaDem
                ? new Date(new Date(`${ngayApDung}T00:00:00`).getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
                : ngayApDung;
            return {
                start: `${ngayApDung}T${gioBatDau}`,
                end: `${ngayKet}T${gioKetThuc}`
            };
        }
        return {
            start: `${ngayApDung}T00:00`,
            end: `${ngayApDung}T23:59`
        };
    };

    async function taiDanhSachUngVien(congDoanId, { kiemTraLich = false, startDatetime = "", endDatetime = "" } = {}) {
        setDangTaiUngVien(true);
        setLoiPhanCong("");
        try {
            const res = await layUngVienChoBoPhan(
                congDoanId,
                ngay,
                caLamId,
                ngayBatDau,
                ngayKetThuc,
                kiemTraLich ? startDatetime : undefined,
                kiemTraLich ? endDatetime : undefined
            );
            if (res.success) {
                setDanhSachUngVien(res.data);
                setDaKiemTraLichGan(kiemTraLich);
            }
        } catch (err) {
            setLoiPhanCong(err.message || "Không thể tải danh sách ứng viên");
        } finally {
            setDangTaiUngVien(false);
        }
    }

    async function taiDanhSachUngVienThayThe({ kiemTraLich = false, startDatetime = "", endDatetime = "", congDoanId = null, nhanVienCuId = null } = {}) {
        const bpId = congDoanId ?? targetCongDoanThayDoi?.cong_doan_id;
        const nvCuId = nhanVienCuId ?? targetNhanVienCu?.nhan_vien_id;
        if (!bpId || nvCuId == null) return [];
        setDangTaiUngVienThayDoi(true);
        setLoiThayDoi("");
        try {
            const res = await layUngVienChoBoPhan(
                bpId,
                ngay,
                caLamId,
                ngayBatDau,
                ngayKetThuc,
                kiemTraLich ? startDatetime : undefined,
                kiemTraLich ? endDatetime : undefined
            );
            if (res.success) {
                const filtered = res.data.filter((uv) => Number(uv.id) !== Number(nvCuId));
                setDanhSachUngVienThayDoi(filtered);
                setDaKiemTraLichThayThe(kiemTraLich);
                if (selectedNhanVienMoiId) {
                    const selected = filtered.find((uv) => String(uv.id) === String(selectedNhanVienMoiId));
                    if (selected?.conflict_message) {
                        setLoiThayDoi(`Không thể chọn nhân sự do trùng lịch: ${selected.conflict_message}`);
                    }
                }
                return filtered;
            }
        } catch (err) {
            setLoiThayDoi(err.message || "Không thể tải danh sách nhân sự thay thế");
        } finally {
            setDangTaiUngVienThayDoi(false);
        }
        return [];
    }

    async function kichHoatThayDoiNhanVien(nvCu, bp) {
        const macDinh = layMacDinhThoiGianPhanCong(ngayBatDau, nvCu.thoi_gian_bat_dau, nvCu.thoi_gian_ket_thuc);
        setTargetNhanVienCu(nvCu);
        setTargetCongDoanThayDoi(bp);
        setSelectedNhanVienMoiId("");
        setDanhSachUngVienThayDoi([]);
        setLoiThayDoi("");
        setDaKiemTraLichThayThe(false);
        setThayTheStartDatetime(macDinh.start);
        setThayTheEndDatetime(macDinh.end);
        setModalThayDoiOpen(true);
        await taiDanhSachUngVienThayDoi({
            congDoanId: bp.cong_doan_id,
            nhanVienCuId: nvCu.nhan_vien_id
        });
    }

    function kichHoatNghiPhep(nv, bp) {
        const macDinh = layMacDinhThoiGianPhanCong(ngay, nv.thoi_gian_bat_dau, nv.thoi_gian_ket_thuc);
        setTargetNghiPhep({ nv, bp });
        setNghiPhepStartDatetime(macDinh.start);
        setNghiPhepEndDatetime(macDinh.end);
        setLoiNghiPhep("");
        setModalNghiPhepOpen(true);
    }

    async function xuLyXacNhanNghiPhep() {
        if (!targetNghiPhep) return;
        if (!nghiPhepStartDatetime || !nghiPhepEndDatetime) {
            setLoiNghiPhep("Vui lòng chọn đầy đủ thời gian nghỉ phép!");
            return;
        }
        if (nghiPhepEndDatetime <= nghiPhepStartDatetime) {
            setLoiNghiPhep("Thời gian kết thúc phải sau thời gian bắt đầu");
            return;
        }
        setDangLuuNghiPhep(true);
        setLoiNghiPhep("");
        try {
            const res = await nghiPhepPhanCong({
                nhan_vien_id: Number(targetNghiPhep.nv.nhan_vien_id),
                day_chuyen_id: Number(id),
                cong_doan_id: Number(targetNghiPhep.bp.cong_doan_id),
                start_datetime: chuyenDateTimeLocalThanhApi(nghiPhepStartDatetime),
                end_datetime: chuyenDateTimeLocalThanhApi(nghiPhepEndDatetime)
            });
            if (res.success) {
                hienThongBao(res.message || "Đã đăng ký nghỉ phép thành công!");
                setModalNghiPhepOpen(false);
                TaiChiTiet();
            }
        } catch (err) {
            setLoiNghiPhep(err.message || "Đăng ký nghỉ phép thất bại");
        } finally {
            setDangLuuNghiPhep(false);
        }
    }

    async function kichHoatDieuChinh(nv, bp) {
        setTargetDieuChinh({ nv, bp });
        const startValue = nv.thoi_gian_bat_dau || `${ngay} 00:00:00`;
        const endValue = nv.thoi_gian_ket_thuc || `${ngay} 23:59:59`;
        setDieuChinhStartDatetime(toDateTimeLocal(startValue));
        setDieuChinhEndDatetime(toDateTimeLocal(endValue));
        setLoiDieuChinh("");
        setModalDieuChinhOpen(true);
    }

    async function xuLyXacNhanDieuChinh() {
        if (!targetDieuChinh) return;
        if (!dieuChinhStartDatetime || !dieuChinhEndDatetime) {
            setLoiDieuChinh("Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc!");
            return;
        }
        if (dieuChinhEndDatetime <= dieuChinhStartDatetime) {
            setLoiDieuChinh("Thời gian kết thúc phải sau thời gian bắt đầu");
            return;
        }
        setDangLuuDieuChinh(true);
        setLoiDieuChinh("");
        try {
            const res = await dieuChinhPhanCong({
                nhan_vien_id: Number(targetDieuChinh.nv.nhan_vien_id),
                day_chuyen_id: Number(id),
                cong_doan_id: Number(targetDieuChinh.bp.cong_doan_id),
                ngay: ngay,
                start_datetime: chuyenDateTimeLocalThanhApi(dieuChinhStartDatetime),
                end_datetime: chuyenDateTimeLocalThanhApi(dieuChinhEndDatetime)
            });
            if (res.success) {
                hienThongBao(res.message || "Đã điều chỉnh phân công thành công!");
                setModalDieuChinhOpen(false);
                TaiChiTiet();
            }
        } catch (err) {
            setLoiDieuChinh(err.message || "Điều chỉnh phân công thất bại");
        } finally {
            setDangLuuDieuChinh(false);
        }
    }

    async function kichHoatGo(nv, bp) {
        setTargetNguoiGo(nv);
        setTargetCongDoanGo(bp);
        const startValue = nv.thoi_gian_bat_dau || `${ngay} 00:00:00`;
        const endValue = nv.thoi_gian_ket_thuc || `${ngay} 23:59:59`;
        setGoStartDatetime(toDateTimeLocal(startValue));
        setGoEndDatetime(toDateTimeLocal(endValue));
        setModalGoOpen(true);
    }

    async function xuLyXacNhanGo() {
        if (!targetNguoiGo || !targetCongDoanGo) return;
        if (!goStartDatetime || !goEndDatetime) {
            alert("Vui lòng nhập đầy đủ thời gian gỡ!");
            return;
        }
        if (goEndDatetime <= goStartDatetime) {
            alert("Thời gian kết thúc phải sau thời gian bắt đầu");
            return;
        }
        setDangXacNhanGo(true);
        try {
            const res = await goPhanCongNhanSu({
                nhan_vien_id: Number(targetNguoiGo.nhan_vien_id),
                day_chuyen_id: Number(id),
                cong_doan_id: Number(targetCongDoanGo.cong_doan_id),
                ngay: ngay,
                start_datetime: `${goStartDatetime.replace("T", " ")}:00`,
                end_datetime: `${goEndDatetime.replace("T", " ")}:00`
            });
            if (res.success) {
                hienThongBao("Đã gỡ nhân viên thành công!");
                setModalGoOpen(false);
                TaiChiTiet();
            }
        } catch (err) {
            alert(err.message || "Gỡ nhân viên thất bại");
        } finally {
            setDangXacNhanGo(false);
        }
    }
    async function xuLyXacNhanThayDoiNhanVien() {
        if (!selectedNhanVienMoiId) {
            alert("Vui lòng chọn nhân viên mới để thay thế!");
            return;
        }
        if (!thayTheStartDatetime || !thayTheEndDatetime) {
            alert("Vui lòng nhập đầy đủ thời gian thay thế!");
            return;
        }
        if (thayTheEndDatetime <= thayTheStartDatetime) {
            alert("Thời gian kết thúc phải sau thời gian bắt đầu");
            return;
        }
        setDangLuuThayDoi(true);
        setLoiThayDoi("");
        try {
            const resKiemTra = await layUngVienChoBoPhan(
                targetCongDoanThayDoi.cong_doan_id,
                ngay,
                caLamId,
                ngayBatDau,
                ngayKetThuc,
                chuyenDateTimeLocalThanhApi(thayTheStartDatetime),
                chuyenDateTimeLocalThanhApi(thayTheEndDatetime)
            );
            if (!resKiemTra.success) {
                setLoiThayDoi("Không thể kiểm tra lịch làm việc");
                return;
            }
            const danhSachDaKiemTra = resKiemTra.data.filter((uv) => Number(uv.id) !== Number(targetNhanVienCu.nhan_vien_id));
            setDanhSachUngVienThayDoi(danhSachDaKiemTra);
            setDaKiemTraLichThayThe(true);
            const selected = danhSachDaKiemTra.find((uv) => String(uv.id) === String(selectedNhanVienMoiId));
            if (selected?.conflict_message) {
                setLoiThayDoi(`Không thể thay thế do trùng lịch: ${selected.conflict_message}`);
                return;
            }
            const res = await thayDoiNhanSu({
                nhan_vien_cu_id: Number(targetNhanVienCu.nhan_vien_id),
                nhan_vien_moi_id: Number(selectedNhanVienMoiId),
                day_chuyen_id: Number(id),
                cong_doan_id: Number(targetCongDoanThayDoi.cong_doan_id),
                ca_lam_id: caLamId !== "ALL" ? Number(caLamId) : (targetNhanVienCu.ca_lam_id || null),
                ngay: thayTheStartDatetime.slice(0, 10),
                ngay_bat_dau: thayTheStartDatetime.slice(0, 10),
                ngay_ket_thuc: thayTheEndDatetime.slice(0, 10),
                start_datetime: chuyenDateTimeLocalThanhApi(thayTheStartDatetime),
                end_datetime: chuyenDateTimeLocalThanhApi(thayTheEndDatetime)
            });

            if (res.success) {
                hienThongBao(res.message || "Đã thay đổi nhân viên thành công!");
                setModalThayDoiOpen(false);
                TaiChiTiet();
            }
        } catch (err) {
            setLoiThayDoi(err.message || "Thay đổi nhân viên thất bại");
        } finally {
            setDangLuuThayDoi(false);
        }
    }

    async function xuLyKiemTraLichThayThe() {
        if (!thayTheStartDatetime || !thayTheEndDatetime) {
            setLoiThayDoi("Vui lòng nhập đầy đủ thời gian trước khi kiểm tra lịch!");
            return;
        }
        if (thayTheEndDatetime <= thayTheStartDatetime) {
            setLoiThayDoi("Thời gian kết thúc phải sau thời gian bắt đầu");
            return;
        }
        await taiDanhSachUngVienThayDoi({
            kiemTraLich: true,
            startDatetime: chuyenDateTimeLocalThanhApi(thayTheStartDatetime),
            endDatetime: chuyenDateTimeLocalThanhApi(thayTheEndDatetime),
            congDoanId: targetCongDoanThayDoi?.cong_doan_id,
            nhanVienCuId: targetNhanVienCu?.nhan_vien_id
        });
    }

    async function kichHoatGanNhanVien(congDoanId) {
        const macDinh = layMacDinhThoiGianPhanCong(ngayBatDau);
        setHienThiGan(congDoanId);
        setDanhSachChonMulti([]);
        setDanhSachUngVien([]);
        setLoiPhanCong("");
        setDaKiemTraLichGan(false);
        setGanStartDatetime(macDinh.start);
        setGanEndDatetime(macDinh.end);
        await taiDanhSachUngVien(congDoanId);
    }

    async function xuLyKiemTraLichGan(congDoanId) {
        if (!ganStartDatetime || !ganEndDatetime) {
            setLoiPhanCong("Vui lòng nhập đầy đủ thời gian trước khi kiểm tra lịch!");
            return;
        }
        if (ganEndDatetime <= ganStartDatetime) {
            setLoiPhanCong("Thời gian kết thúc phải sau thời gian bắt đầu");
            return;
        }
        await taiDanhSachUngVien(congDoanId, {
            kiemTraLich: true,
            startDatetime: chuyenDateTimeLocalThanhApi(ganStartDatetime),
            endDatetime: chuyenDateTimeLocalThanhApi(ganEndDatetime)
        });
    }

    // Toggle tích chọn nhân viên
    function handleToggleChonNhanVien(nvId) {
        const uv = danhSachUngVien.find((item) => item.id === nvId);
        if (uv?.conflict_message) {
            setLoiPhanCong(`Không thể chọn nhân sự do trùng lịch: ${uv.conflict_message}`);
            return;
        }
        if (danhSachChonMulti.includes(nvId)) {
            setDanhSachChonMulti(danhSachChonMulti.filter(id => id !== nvId));
        } else {
            setDanhSachChonMulti([...danhSachChonMulti, nvId]);
        }
    }

    // Gán nhiều nhân sự đã chọn
    async function xuLyGanMulti(congDoanId, bp) {
        setLoiPhanCong("");
        if (danhSachChonMulti.length === 0) {
            setLoiPhanCong("Vui lòng chọn ít nhất một nhân viên!");
            return;
        }
        if (!ganStartDatetime || !ganEndDatetime) {
            setLoiPhanCong("Vui lòng thiết lập thời gian phân công trước khi gán!");
            return;
        }
        if (ganEndDatetime <= ganStartDatetime) {
            setLoiPhanCong("Thời gian kết thúc phải sau thời gian bắt đầu");
            return;
        }
        const max = bp.so_luong_max !== null ? bp.so_luong_max : bp.so_luong_can;
        if (danhSachChonMulti.length + bp.so_luong_da_gan > max) {
            setLoiPhanCong(`Lỗi: Không thể gán quá số lượng nhân sự tối đa (${max} người)! Hiện tại đã gán ${bp.so_luong_da_gan} người.`);
            return;
        }

        const startDatetime = chuyenDateTimeLocalThanhApi(ganStartDatetime);
        const endDatetime = chuyenDateTimeLocalThanhApi(ganEndDatetime);

        setDangTaiUngVien(true);
        try {
            const resKiemTra = await layUngVienChoBoPhan(
                congDoanId,
                ngay,
                caLamId,
                ngayBatDau,
                ngayKetThuc,
                startDatetime,
                endDatetime
            );
            if (!resKiemTra.success) {
                setLoiPhanCong("Không thể kiểm tra lịch làm việc");
                return;
            }
            setDanhSachUngVien(resKiemTra.data);
            setDaKiemTraLichGan(true);
            const conflicted = resKiemTra.data.filter((uv) => danhSachChonMulti.includes(uv.id) && uv.conflict_message);
            if (conflicted.length > 0) {
                setLoiPhanCong(`Không thể gán do trùng lịch: ${conflicted[0].conflict_message}`);
                return;
            }
        } catch (err) {
            setLoiPhanCong(err.message || "Không thể kiểm tra lịch làm việc");
            return;
        } finally {
            setDangTaiUngVien(false);
        }

        try {
            await Promise.all(
                danhSachChonMulti.map((nvId) =>
                    phanCongNhanSu({
                        nhan_vien_id: Number(nvId),
                        day_chuyen_id: Number(id),
                        cong_doan_id: Number(congDoanId),
                        ca_lam_id: caLamId !== "ALL" ? Number(caLamId) : undefined,
                        ngay: ganStartDatetime.slice(0, 10),
                        ngay_bat_dau: ganStartDatetime.slice(0, 10),
                        ngay_ket_thuc: ganEndDatetime.slice(0, 10),
                        start_datetime: startDatetime,
                        end_datetime: endDatetime
                    })
                )
            );

            hienThongBao(`Đã gán thành công ${danhSachChonMulti.length} nhân viên!`);
            setHienThiGan(null);
            setDanhSachChonMulti([]);
            TaiChiTiet();
        } catch (err) {
            setLoiPhanCong(err.message || "Gán nhân viên thất bại");
        }
    }

    // Tự động gán nhân sự trống
    async function xuLyAutoAssign() {
        if (!caLamId) {
            alert("Vui lòng chọn ca làm việc trước!");
            return;
        }
        setDangAutoAssign(true);
        setLoi("");
        try {
            const res = await tuDongGanNhanSu(id, ngayBatDau, caLamId, ngayBatDau, ngayKetThuc);
            if (res.success) {
                hienThongBao(res.message || "Đã tự động gán nhân sự thành công!");
                setHienGioAutoAssign(false);
                TaiChiTiet();
            }
        } catch (err) {
            alert(err.message || "Lỗi tự động gán nhân sự");
        } finally {
            setDangAutoAssign(false);
        }
    }

    const layThoiGianPhanCongNv = (nv) => ({
        start: nv?.thoi_gian_bat_dau
            ? chuyenDateTimeLocalThanhApi(toDateTimeLocal(nv.thoi_gian_bat_dau))
            : `${ngay} 00:00:00`,
        end: nv?.thoi_gian_ket_thuc
            ? chuyenDateTimeLocalThanhApi(toDateTimeLocal(nv.thoi_gian_ket_thuc))
            : `${ngay} 23:59:59`
    });

    // Gỡ nhân viên khỏi phân công
    async function xuLyGo(nhanVienId, congDoanId, nv = null) {
        if (!laAdminOrLeaderKhuVuc) return;
        if (window.confirm("Bạn có chắc chắn muốn gỡ nhân viên này khỏi công đoạn trong hôm nay?")) {
            const thoiGian = layThoiGianPhanCongNv(nv);
            try {
                const res = await goPhanCongNhanSu({
                    nhan_vien_id: Number(nhanVienId),
                    day_chuyen_id: Number(id),
                    cong_doan_id: Number(congDoanId),
                    ngay: ngay,
                    start_datetime: thoiGian.start,
                    end_datetime: thoiGian.end
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
        if (!laQuyenCauHinh) return;
        setModalCongDoanCheDo("THEM");
        setModalCongDoanTen(`${day_chuyen.ten_day_chuyen} ${bo_phan.length + 1}`);
        setModalCongDoanMin(1);
        setModalCongDoanMax(1);
        setModalCongDoanOpen(true);
    }

    // Mở modal Sửa định biên công đoạn
    function kichHoatSuaDinhBien(bp) {
        if (!laQuyenCauHinh) return;
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
        if (!laQuyenCauHinh) return;

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

    const dinhDangKhoangThoiGian = (nv) => {
        if (!nv.thoi_gian_bat_dau || !nv.thoi_gian_ket_thuc) return null;
        const formatDateOnly = (value) => String(value).replace("T", " ").slice(0, 10);
        const batDau = formatDateOnly(nv.thoi_gian_bat_dau);
        const ketThuc = formatDateOnly(nv.thoi_gian_ket_thuc);
        return batDau === ketThuc ? batDau : `${batDau} → ${ketThuc}`;
    };

    const formatDateTimeLichSu = (value) => {
        if (!value) return "-";
        const isoString = String(value).trim().replace(" ", "T");
        const dateObj = new Date(isoString);
        return isNaN(dateObj.getTime()) ? String(value) : dateObj.toLocaleString("vi-VN", { hour12: false });
    };

    const dinhDangChiTietLichSu = (item) => {
        if (item.thoi_gian_bat_dau && item.thoi_gian_ket_thuc) {
            return `${formatDateTimeLichSu(item.thoi_gian_bat_dau)} → ${formatDateTimeLichSu(item.thoi_gian_ket_thuc)}`;
        }
        return item.ly_do || "-";
    };

    const locNhanVienTheoTuKhoa = (nvList) => {
        const query = tuKhoaTimKiemNhanSu.toLowerCase().trim();
        if (!query) return nvList;
        return nvList.filter(nv => 
            nv.ho_ten.toLowerCase().includes(query) || 
            nv.ma_nhan_vien.toLowerCase().includes(query) ||
            (nv.so_dien_thoai && nv.so_dien_thoai.toLowerCase().includes(query))
        );
    };

    // Render một dòng ứng viên kèm nhãn Ca làm việc của họ
    const renderUngVienRow = (uv) => (
        <label key={uv.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px", borderBottom: "1px solid #f1f5f9", cursor: uv.conflict_message ? "not-allowed" : "pointer", opacity: uv.conflict_message ? 0.65 : 1 }}>
            <input
                type="checkbox"
                checked={danhSachChonMulti.includes(uv.id)}
                onChange={() => handleToggleChonNhanVien(uv.id)}
                disabled={Boolean(uv.conflict_message)}
            />
            <span style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span><strong>[{uv.ma_nhan_vien}]</strong> - {uv.ho_ten} (Cấp độ chứng chỉ: {uv.cap_do || 1})</span>
                <span style={{ background: "#f1f5f9", color: "#475569", fontSize: "10px", fontWeight: "bold", padding: "2px 8px", borderRadius: "999px" }}>
                    {uv.ten_ca || "Chưa gán ca"}
                </span>
                {uv.conflict_message && (
                    <span style={{ background: "#fee2e2", color: "#b91c1c", fontSize: "10px", fontWeight: "bold", padding: "2px 8px", borderRadius: "999px" }}>
                        Trùng lịch
                    </span>
                )}
            </span>
            {uv.conflict_message && (
                <div style={{ fontSize: "11px", color: "#b91c1c", width: "100%", paddingLeft: "28px" }}>
                    {uv.conflict_message}
                </div>
            )}
        </label>
    );

    // ADMIN: nhóm ứng viên theo Ca để dễ phân loại khi điều động chéo ca.
    // Leader: danh sách phẳng (đã đồng nhất 1 ca của chính họ).
    const renderDanhSachUngVien = () => {
        if (laAdmin) {
            const nhom = {};
            danhSachUngVien.forEach(uv => {
                const key = uv.ten_ca || "Chưa gán ca";
                if (!nhom[key]) nhom[key] = [];
                nhom[key].push(uv);
            });
            return Object.keys(nhom).map(caTen => (
                <div key={caTen} style={{ marginBottom: "6px" }}>
                    <div style={{ fontSize: "11px", fontWeight: "bold", color: "#475569", padding: "4px 8px", background: "#f1f5f9", borderRadius: "4px", marginBottom: "2px" }}>
                        — {caTen} ({nhom[caTen].length} người) —
                    </div>
                    {nhom[caTen].map(uv => renderUngVienRow(uv))}
                </div>
            ));
        }
        return danhSachUngVien.map(uv => renderUngVienRow(uv));
    };

    // Style dùng chung cho các control lọc (ngày/giờ/select) - đồng bộ toàn trang, tối giản
    const nhanBoLoc = { fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.02em" };
    const oNhapBoLoc = { padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13.5px", height: "38px", color: "#1f2937", backgroundColor: "#fff" };

    return (
        <div className="noi-dung-admin">
            {/* Header: tiêu đề + hành động chính */}
            <div className="admin-header-bar" style={{ paddingBottom: "16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                <div className="tieu-de-khoi" style={{ flex: "1 1 300px" }}>
                    <h2 style={{ margin: 0 }}>{day_chuyen.ten_day_chuyen}</h2>
                    <p style={{ marginTop: "6px", marginBottom: 0, color: "#6b7280", fontSize: "13px" }}>
                        Khu vực: <strong style={{ color: "#1f2937" }}>{day_chuyen.ten_khu_vuc}</strong> · Leader dây chuyền: <strong style={{ color: "#1f2937" }}>{day_chuyen.ten_leader || "Chưa gán"}</strong>
                    </p>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    {laQuyenCauHinh && (
                        <button
                            className="nut-chinh"
                            onClick={kichHoatThemCongDoan}
                            style={{ height: "38px", width: "auto", padding: "0 16px" }}
                        >
                            + Thêm công đoạn
                        </button>
                    )}
                    {laAdminOrLeaderKhuVuc && (
                        <div style={{ position: "relative" }}>
                            <button 
                                className="nut-chinh" 
                                onClick={() => setHienGioAutoAssign(v => !v)}
                                style={{ height: "38px", width: "auto", padding: "0 16px" }}
                            >
                                Tự động gán nhân sự
                            </button>

                            {hienGioAutoAssign && (
                                <div style={{ position: "absolute", top: "44px", right: 0, zIndex: 10, minWidth: "300px", padding: "14px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                                    <div style={nhanBoLoc}>Khoảng ngày áp dụng</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                                        <input type="date" value={ngayBatDau} onChange={(e) => setNgayBatDau(e.target.value)} style={{ ...oNhapBoLoc, flex: 1 }} />
                                        <span style={{ color: "#9ca3af", fontSize: "13px" }}>→</span>
                                        <input type="date" value={ngayKetThuc} onChange={(e) => setNgayKetThuc(e.target.value)} min={ngayBatDau} style={{ ...oNhapBoLoc, flex: 1 }} />
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                                        <button
                                            className="nut-chinh"
                                            onClick={xuLyAutoAssign}
                                            disabled={dangAutoAssign}
                                            style={{ width: "auto", padding: "0 16px", height: "34px", fontSize: "13px" }}
                                        >
                                            {dangAutoAssign ? "Đang gán..." : "Xác nhận"}
                                        </button>
                                        <button className="nut-huy" onClick={() => setHienGioAutoAssign(false)} style={{ padding: "0 16px", height: "34px", fontSize: "13px" }}>
                                            Hủy
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <button className="nut-huy" onClick={() => navigate("/admin/day-chuyen")} style={{ height: "38px", width: "auto", padding: "0 16px" }}>
                        Quay lại
                    </button>
                </div>
            </div>

            {/* Thanh bộ lọc: chỉ còn ngày xem + ca làm việc. Khoảng thời gian phân công giờ chọn ngay tại từng thao tác (gán / thay đổi / tự động gán) */}
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap", padding: "14px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", marginBottom: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={nhanBoLoc}>Ngày đang xem</label>
                    <input
                        type="date"
                        value={ngay}
                        onChange={(e) => setNgay(e.target.value)}
                        style={oNhapBoLoc}
                    />
                </div>

                <div style={{ width: "1px", alignSelf: "stretch", background: "#e5e7eb", margin: "0 4px" }} />

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={nhanBoLoc}>
                        {laAdmin ? "Ca làm việc" : "Ca làm việc (theo ca của bạn)"}
                    </label>
                    <select
                        value={caLamId}
                        onChange={(e) => setCaLamId(e.target.value)}
                        disabled={!laAdmin}
                        title={laAdmin ? "" : "Bạn chỉ có thể phân công cho nhân viên cùng ca với mình"}
                        style={{ ...oNhapBoLoc, minWidth: "220px", backgroundColor: laAdmin ? "#fff" : "#f1f5f9", fontWeight: 600, cursor: laAdmin ? "pointer" : "not-allowed" }}
                    >
                        {laAdmin && <option value="ALL">-- Tất cả các ca (Tổng quan) --</option>}
                        {duLieu && duLieu.danh_sach_ca_lam && duLieu.danh_sach_ca_lam.map((ca) => (
                            <option key={ca.id} value={ca.id}>
                                {ca.ten_ca} {ca.gio_bat_dau ? `(${ca.gio_bat_dau.slice(0, 5)} - ${ca.gio_ket_thuc.slice(0, 5)})` : ""}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {thongBao && <div className="thong-bao-thanh-cong">{thongBao}</div>}

            {/* 1. SƠ ĐỒ TRỰC QUAN CÁC CÔNG ĐOẠN SẢN XUẤT */}
            <div className="the-thong-tin" style={{ marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "15px" }}>Sơ đồ dòng chảy công đoạn sản xuất</h3>
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
                            const mauVien = isThieu ? "var(--red)" : (isDuThua ? "#d97706" : "var(--green)");
                            const mauNen = isThieu ? "#fef2f2" : (isDuThua ? "#fffbeb" : "#f0fdf4");
                            const mauChu = isThieu ? "var(--red)" : (isDuThua ? "#b45309" : "var(--green)");
                            return (
                                <React.Fragment key={bp.cong_doan_id}>
                                    <div style={{
                                        minWidth: "160px",
                                        border: `1px solid ${mauVien}`,
                                        borderRadius: "8px",
                                        padding: "10px 14px",
                                        backgroundColor: mauNen,
                                        textAlign: "center"
                                    }}>
                                        <div style={{ fontWeight: "600", fontSize: "13px", color: "var(--charcoal)" }}>{bp.ten_bo_phan}</div>
                                        <div style={{ 
                                            fontSize: "11px", 
                                            marginTop: "6px", 
                                            color: mauChu,
                                            fontWeight: "600"
                                        }}>
                                            {bp.so_luong_da_gan} / {bp.so_luong_min !== null && bp.so_luong_max !== null ? `${bp.so_luong_min}-${bp.so_luong_max}` : bp.so_luong_can} nhân sự
                                        </div>
                                        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                                            {isThieu ? `Thiếu ${bp.so_luong_thieu}` : (isDuThua ? `Dư ${bp.so_luong_du}` : "Đủ nhân sự")}
                                        </div>
                                    </div>
                                    {idx < bo_phan.length - 1 && (
                                        <span style={{ fontSize: "16px", color: "#9ca3af" }}>→</span>
                                    )}
                                </React.Fragment>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Tìm kiếm nhân sự */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "2px", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
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

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button
                        type="button"
                        onClick={() => setModalXemLichOpen(true)}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#7c3aed",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            height: "38px",
                            boxShadow: "0 2px 6px rgba(124, 58, 237, 0.25)"
                        }}
                    >
                        📅 Xem Lịch Làm Chi Tiết 
                    </button>

                    <input
                        type="text"
                        placeholder="Tìm nhanh nhân sự đang làm việc trên Line..."
                        value={tuKhoaTimKiemNhanSu}
                        onChange={(e) => setTuKhoaTimKiemNhanSu(e.target.value)}
                        style={{
                            width: "280px",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "13px",
                            height: "38px"
                        }}
                    />
                </div>
            </div>

            {/* HIỂN THỊ CÁC CÔNG ĐOẠN HOẶC GỘP */}
            {cheDoXem === "CONG_DOAN" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                    {bo_phan.length === 0 ? (
                        <div className="the-thong-tin" style={{ textCenter: "center", padding: "40px" }}>
                            <p style={{ fontStyle: "italic", color: "var(--text-muted)" }}>Dây chuyền này chưa được cấu hình công đoạn sản xuất nào.</p>
                        </div>
                    ) : (
                        bo_phan.map((bp) => {
                            const filteredNhanVien = locNhanVienTheoTuKhoa(bp.nhan_vien).filter(nv => nv.phan_cong_trang_thai !== "NGHI");
                            return (
                                <div key={bp.cong_doan_id} className="the-thong-tin" style={{ borderLeft: bp.trang_thai === "THIEU" ? "5px solid var(--red)" : (bp.trang_thai === "DU_THUA" ? "5px solid #d97706" : "5px solid var(--green)"), paddingLeft: "20px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: "16px", color: "var(--charcoal)", display: "flex", alignItems: "center", gap: "8px" }}>
                                                {bp.ten_bo_phan}
                                                {bp.trang_thai === "THIEU" ? (
                                                    <span style={{ fontSize: "11px", fontWeight: "bold", background: "#fef2f2", color: "var(--red)", padding: "2px 8px", borderRadius: "999px" }}>
                                                        Thiếu {bp.so_luong_thieu} nhân sự
                                                    </span>
                                                ) : bp.trang_thai === "DU_THUA" ? (
                                                    <span style={{ fontSize: "11px", fontWeight: "bold", background: "#fffbeb", color: "#b45309", padding: "2px 8px", borderRadius: "999px" }}>
                                                        Dư {bp.so_luong_du} nhân sự
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: "11px", fontWeight: "bold", background: "#f0fdf4", color: "var(--green)", padding: "2px 8px", borderRadius: "999px" }}>
                                                        Đủ nhân sự
                                                    </span>
                                                )}
                                            </h3>
                                            <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "var(--text-muted)", display: "flex", gap: "12px", alignItems: "center" }}>
                                                <span>Yêu cầu định biên: <strong>{bp.so_luong_min !== null && bp.so_luong_max !== null ? `${bp.so_luong_min}-${bp.so_luong_max}` : bp.so_luong_can}</strong> người | Hiện tại: <strong>{bp.so_luong_da_gan}</strong> người</span>
                                                {laQuyenCauHinh && (
                                                    <span style={{ display: "flex", gap: "8px" }}>
                                                        <button 
                                                            onClick={() => kichHoatSuaDinhBien(bp)} 
                                                            style={{ border: "none", background: "none", color: "var(--primary-color)", fontWeight: "bold", cursor: "pointer", padding: 0 }}
                                                        >
                                                            Sửa định biên
                                                        </button>
                                                        <span style={{ color: "#d1d5db" }}>|</span>
                                                        <button 
                                                            onClick={() => xuLyXoaCongDoan(bp)} 
                                                            style={{ border: "none", background: "none", color: "var(--red)", fontWeight: "bold", cursor: "pointer", padding: 0 }}
                                                        >
                                                            Xóa công đoạn
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
                                        <div style={{ background: "#f8fafc", border: "1px solid #d1d5db", padding: "16px", borderRadius: "var(--radius)", marginBottom: "16px" }}>
                                            <h4 style={{ margin: "0 0 4px 0", fontSize: "13px" }}>Gán nhân viên có chứng chỉ kỹ năng phù hợp</h4>
                                            <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "var(--text-muted)" }}>
                                                Bước 1: Chọn nhân sự từ danh sách bên dưới. Bước 2: Thiết lập thời gian phân công và bấm xác nhận — hệ thống tự kiểm tra trùng lịch.
                                            </p>

                                            <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", flexWrap: "wrap", padding: "10px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: "12px" }}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                                    <span style={nhanBoLoc}>Thời gian bắt đầu</span>
                                                    <input
                                                        type="datetime-local"
                                                        value={ganStartDatetime}
                                                        onChange={(e) => { setGanStartDatetime(e.target.value); setDaKiemTraLichGan(false); }}
                                                        style={oNhapBoLoc}
                                                    />
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                                    <span style={nhanBoLoc}>Thời gian kết thúc</span>
                                                    <input
                                                        type="datetime-local"
                                                        value={ganEndDatetime}
                                                        min={ganStartDatetime}
                                                        onChange={(e) => { setGanEndDatetime(e.target.value); setDaKiemTraLichGan(false); }}
                                                        style={oNhapBoLoc}
                                                    />
                                                </div>

                                                <button type="button" className="nut-huy" onClick={() => kichHoatGanNhanVien(bp.cong_doan_id)} style={{ height: "38px", padding: "0 14px", fontSize: "12px" }}>
                                                    Tải lại danh sách
                                                </button>
                                                <button type="button" className="nut-chinh" onClick={() => xuLyKiemTraLichGan(bp.cong_doan_id)} style={{ height: "38px", padding: "0 14px", fontSize: "12px", width: "auto" }}>
                                                    Kiểm tra lịch
                                                </button>
                                            </div>

                                            {dangTaiUngVien ? (
                                                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Đang quét tìm ứng viên có chứng chỉ...</p>
                                            ) : danhSachUngVien.length === 0 ? (
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <p style={{ margin: 0, fontSize: "13px", color: "var(--red)", fontWeight: "600" }}>Không tìm thấy nhân viên nào có chứng chỉ hiệu lực cho công đoạn này!</p>
                                                    <button type="button" className="nut-huy" onClick={() => setHienThiGan(null)} style={{ padding: "4px 10px" }}>Đóng</button>
                                                </div>
                                            ) : (
                                                <div>
                                                    {loiPhanCong && (
                                                        <div style={{ marginBottom: "12px", padding: "10px 12px", backgroundColor: "#fee2e2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", fontSize: "13px" }}>
                                                            {loiPhanCong}
                                                        </div>
                                                    )}
                                                    <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #d1d5db", borderRadius: "4px", padding: "8px", background: "#ffffff", marginBottom: "12px" }}>
                                                        {renderDanhSachUngVien()}
                                                    </div>

                                                    {danhSachChonMulti.length + bp.so_luong_da_gan > bp.so_luong_max && (
                                                        <div style={{ padding: "8px 12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px", color: "var(--red)", fontSize: "12px", fontWeight: "bold", marginBottom: "12px" }}>
                                                            Cảnh báo: Định biên công đoạn tối đa là {bp.so_luong_max} nhân sự, nhưng bạn đang chọn gán tổng cộng {danhSachChonMulti.length + bp.so_luong_da_gan} nhân sự!
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
                                                        {laAdminOrLeaderKhuVuc && <th style={{ textAlign: "center", width: "340px" }}>Hành động</th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredNhanVien.map((nv) => {
                                                        const laNghi = nv.phan_cong_trang_thai === "NGHI";
                                                        return (
                                                            <tr key={nv.nhan_vien_id} style={{ opacity: laNghi ? 0.6 : 1, backgroundColor: laNghi ? "#f1f5f9" : "transparent" }}>
                                                                <td><strong>{nv.ma_nhan_vien}</strong></td>
                                                                <td>
                                                                    {laNghi ? (
                                                                        <>
                                                                            <span style={{ textDecoration: "line-through", color: "#94a3b8" }}>{nv.ho_ten}</span>
                                                                            <span style={{ background: "#fef2f2", color: "var(--red)", fontSize: "10px", fontWeight: "bold", padding: "2px 6px", borderRadius: "4px", marginLeft: "8px" }}>ĐANG NGHỈ PHÉP</span>
                                                                        </>
                                                                    ) : (
                                                                        <span>{nv.ho_ten}</span>
                                                                    )}
                                                                    <span style={{ background: "#f1f5f9", color: "#475569", fontSize: "10px", fontWeight: "bold", padding: "2px 8px", borderRadius: "999px", marginLeft: "8px" }}>
                                                                        {nv.ten_ca_goc || nv.ten_ca_phan_cong || "Ca làm"}
                                                                    </span>
                                                                    {dinhDangKhoangThoiGian(nv) && (
                                                                        <span title="Khoảng thời gian phân công" style={{ background: "#f8fafc", color: "#475569", fontSize: "10px", padding: "2px 8px", borderRadius: "999px", marginLeft: "6px" }}>
                                                                            {dinhDangKhoangThoiGian(nv)}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td>{nv.gioi_tinh || "-"}</td>
                                                                <td>{nv.so_dien_thoai || "-"}</td>
                                                                {laAdminOrLeaderKhuVuc && (
                                                                    <td style={{ textAlign: "center" }}>
                                                                        {laNghi ? (
                                                                            <>
                                                                                <button
                                                                                    className="nut-hanh-dong nut-sua"
                                                                                    onClick={() => xuLyTrangThaiPhanCong(nv.nhan_vien_id, bp.cong_doan_id, "DANG_LAM", nv)}
                                                                                    style={{ padding: "4px 8px", fontSize: "11px", backgroundColor: "var(--green)", borderColor: "var(--green)" }}
                                                                                >
                                                                                    Đi làm lại
                                                                                </button>
                                                                                <button
                                                                                    className="nut-hanh-dong nut-xoa"
                                                                                    onClick={() => xuLyGo(nv.nhan_vien_id, bp.cong_doan_id, nv)}
                                                                                    style={{ padding: "4px 8px", fontSize: "11px", marginLeft: "6px" }}
                                                                                >
                                                                                    Gỡ hẳn
                                                                                </button>
                                                                            </>
                                                                        ) : (
                                                                            <>

                                                                                <button
                                                                                    className="nut-hanh-dong nut-sua"
                                                                                    onClick={() => kichHoatThayDoiNhanVien(nv, bp)}
                                                                                    style={{ padding: "4px 8px", fontSize: "11px", backgroundColor: "#fff", borderColor: "var(--primary-color)", color: "var(--primary-color)", marginLeft: "6px" }}
                                                                                    title="Thay đổi nhân viên ở công đoạn này"
                                                                                >
                                                                                    Thay thế
                                                                                </button>
                                                                                <button
                                                                                    className="nut-hanh-dong nut-sua"
                                                                                    onClick={() => kichHoatNghiPhep(nv, bp)}
                                                                                    style={{ padding: "4px 8px", fontSize: "11px", backgroundColor: "#fff", borderColor: "#8b5cf6", color: "#7c3aed", marginLeft: "6px" }}
                                                                                    title="Đăng ký nghỉ phép theo khoảng thời gian"
                                                                                >
                                                                                    Nghỉ phép
                                                                                </button>
                                                                                <button
                                                                                    className="nut-hanh-dong nut-sua"
                                                                                    onClick={() => kichHoatDieuChinh(nv, bp)}
                                                                                    style={{ padding: "4px 8px", fontSize: "11px", backgroundColor: "#fff", borderColor: "#3b82f6", color: "#3b82f6", marginLeft: "6px" }}
                                                                                    title="Điều chỉnh thời gian phân công"
                                                                                >
                                                                                    Điều chỉnh
                                                                                </button>
                                                  
                                                                            </>
                                                                        )}
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        );
                                                    })}
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
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "15px" }}>Tổng hợp danh sách nhân sự làm việc trên line ({locNhanVienTheoTuKhoa(tatCaNhanVienDaGan).filter(nv => nv.phan_cong_trang_thai !== "NGHI").length} người)</h3>
                    {locNhanVienTheoTuKhoa(tatCaNhanVienDaGan).filter(nv => nv.phan_cong_trang_thai !== "NGHI").length === 0 ? (
                        <p style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "13px" }}>Chưa có nhân sự nào được gán cho dây chuyền trong ngày.</p>
                    ) : (
                        <div className="bang-du-lieu-wrapper">
                            <table className="bang-du-lieu">
                                <thead>
                                    <tr>
                                        <th>Mã nhân viên</th>
                                        <th>Họ và tên</th>
                                        <th>Trạng thái</th>
                                        <th>Công đoạn được gán</th>
                                        <th>Giới tính</th>
                                        <th>Số điện thoại</th>
                                        {laAdminOrLeaderKhuVuc && <th style={{ textAlign: "center" }}>Hành động</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {locNhanVienTheoTuKhoa(tatCaNhanVienDaGan).filter(nv => nv.phan_cong_trang_thai !== "NGHI").map((nv) => {
                                        const laNghi = nv.phan_cong_trang_thai === "NGHI";
                                        return (
                                            <tr key={nv.nhan_vien_id} style={{ opacity: laNghi ? 0.6 : 1, backgroundColor: laNghi ? "#f1f5f9" : "transparent" }}>
                                                <td><strong>{nv.ma_nhan_vien}</strong></td>
                                                <td>
                                                    {laNghi ? (
                                                        <span style={{ textDecoration: "line-through", color: "#94a3b8" }}>{nv.ho_ten}</span>
                                                    ) : (
                                                        <strong>{nv.ho_ten}</strong>
                                                    )}
                                                    <span style={{ background: "#f1f5f9", color: "#475569", fontSize: "10px", fontWeight: "bold", padding: "2px 6px", borderRadius: "999px", marginLeft: "8px" }}>
                                                        {nv.ten_ca_goc || nv.ten_ca_phan_cong || "Ca làm"}
                                                    </span>
                                                    {dinhDangKhoangThoiGian(nv) && (
                                                        <span title="Khoảng thời gian phân công" style={{ background: "#f8fafc", color: "#475569", fontSize: "10px", padding: "2px 6px", borderRadius: "999px", marginLeft: "6px" }}>
                                                            {dinhDangKhoangThoiGian(nv)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {laNghi ? (
                                                        <span style={{ background: "#fef2f2", color: "var(--red)", fontSize: "10px", fontWeight: "bold", padding: "2px 6px", borderRadius: "4px" }}>ĐANG NGHỈ PHÉP</span>
                                                    ) : (
                                                        <span style={{ background: "#f0fdf4", color: "var(--green)", fontSize: "10px", fontWeight: "bold", padding: "2px 6px", borderRadius: "4px" }}>ĐANG LÀM</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: "600", color: "var(--primary-color)" }}>{nv.ten_bo_phan}</span>
                                                </td>
                                                <td>{nv.gioi_tinh || "-"}</td>
                                                <td>{nv.so_dien_thoai || "-"}</td>
                                                {laAdminOrLeaderKhuVuc && (
                                                    <td style={{ textAlign: "center" }}>
                                                        {laNghi ? (
                                                            <>
                                                                <button
                                                                    className="nut-hanh-dong nut-sua"
                                                                    onClick={() => xuLyTrangThaiPhanCong(nv.nhan_vien_id, nv.cong_doan_id, "DANG_LAM", nv)}
                                                                    style={{ padding: "4px 8px", fontSize: "11px", backgroundColor: "var(--green)", borderColor: "var(--green)" }}
                                                                >
                                                                    Đi làm lại
                                                                </button>
                                                                <button
                                                                    className="nut-hanh-dong nut-xoa"
                                                                    onClick={() => xuLyGo(nv.nhan_vien_id, nv.cong_doan_id, nv)}
                                                                    style={{ padding: "4px 8px", fontSize: "11px", marginLeft: "6px" }}
                                                                >
                                                                    Gỡ hẳn
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                   
                                                                <button
                                                                    className="nut-hanh-dong nut-sua"
                                                                    onClick={() => {
                                                                        const bp = bo_phan.find(b => b.cong_doan_id === nv.cong_doan_id);
                                                                        if (bp) kichHoatThayDoiNhanVien(nv, bp);
                                                                    }}
                                                                    style={{ padding: "4px 8px", fontSize: "11px", backgroundColor: "#fff", borderColor: "var(--primary-color)", color: "var(--primary-color)", marginLeft: "6px" }}
                                                                    title="Thay đổi nhân viên ở công đoạn này"
                                                                >
                                                                    Thay đổi
                                                                </button>

                                                            </>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* LỊCH SỬ PHÂN CÔNG & LỊCH LÀM VIỆC CỦA CÁC CÔNG ĐOẠN */}
            <div className="the-thong-tin" style={{ marginTop: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: "16px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                            📅 Xem lịch làm việc & Phân công nhân sự trong công đoạn
                        </h3>
                        <p style={{ margin: "5px 0 0", color: "var(--text-muted)", fontSize: "12px" }}>
                            Tra cứu lịch làm việc và lịch sử phân công nhân sự đã xảy ra tại các công đoạn theo Tuần, Tháng, Năm hoặc Khoảng thời gian tùy chọn.
                        </p>
                    </div>
                    <span style={{ background: "#e2e8f0", color: "#334155", borderRadius: "999px", padding: "5px 12px", fontSize: "12px", fontWeight: 700 }}>
                        {lichSuPhanCong.length} sự kiện
                    </span>
                </div>

                {/* Thanh chọn nhanh chế độ lọc thời gian xem lịch làm việc */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px", alignItems: "center", background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>

                    {cheDoLocThoiGian === "THANG" && (
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginLeft: "8px" }}>
                            <select
                                value={thangLoc}
                                onChange={(e) => {
                                    const m = Number(e.target.value);
                                    setThangLoc(m);
                                    capNhatKhoangThoiGianLichSu("THANG", namLoc, m);
                                }}
                                style={{ padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: "bold" }}
                            >
                                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                                    <option key={m} value={m}>Tháng {m}</option>
                                ))}
                            </select>
                            <select
                                value={namLoc}
                                onChange={(e) => {
                                    const y = Number(e.target.value);
                                    setNamLoc(y);
                                    capNhatKhoangThoiGianLichSu("THANG", y, thangLoc);
                                }}
                                style={{ padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: "bold" }}
                            >
                                {[2024, 2025, 2026, 2027, 2028].map(y => (
                                    <option key={y} value={y}>Năm {y}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {cheDoLocThoiGian === "NAM" && (
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginLeft: "8px" }}>
                            <select
                                value={namLoc}
                                onChange={(e) => {
                                    const y = Number(e.target.value);
                                    setNamLoc(y);
                                    capNhatKhoangThoiGianLichSu("NAM", y, thangLoc);
                                }}
                                style={{ padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: "bold" }}
                            >
                                {[2024, 2025, 2026, 2027, 2028].map(y => (
                                    <option key={y} value={y}>Năm {y}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Ô chọn tiêu chí & Khoảng ngày chi tiết */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginBottom: "14px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "11px", color: "#64748b", marginBottom: "3px", fontWeight: "bold" }}>Công đoạn</label>
                        <select value={lichSuCongDoanId} onChange={(e) => setLichSuCongDoanId(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "12px" }}>
                            <option value="">Tất cả công đoạn</option>
                            {bo_phan.map((bp) => <option key={bp.cong_doan_id} value={bp.cong_doan_id}>{bp.ten_bo_phan}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "11px", color: "#64748b", marginBottom: "3px", fontWeight: "bold" }}>Nhân viên</label>
                        <select value={lichSuNhanVienId} onChange={(e) => setLichSuNhanVienId(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "12px" }}>
                            <option value="">Tất cả nhân viên</option>
                            {[...new Map([
                                ...tatCaNhanVienDaGan.map((nv) => [nv.nhan_vien_id, nv]),
                                ...lichSuPhanCong.map((nv) => [nv.nhan_vien_id, nv])
                            ]).values()].map((nv) => <option key={nv.nhan_vien_id} value={nv.nhan_vien_id}>{nv.ho_ten} ({nv.ma_nhan_vien})</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "11px", color: "#64748b", marginBottom: "3px", fontWeight: "bold" }}>Từ ngày</label>
                        <input
                            type="date"
                            value={lichSuTuNgay}
                            onChange={(e) => {
                                setCheDoLocThoiGian("TUY_CHINH");
                                setLichSuTuNgay(e.target.value);
                            }}
                            aria-label="Từ ngày lịch sử"
                            style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "12px" }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "11px", color: "#64748b", marginBottom: "3px", fontWeight: "bold" }}>Đến ngày</label>
                        <input
                            type="date"
                            value={lichSuDenNgay}
                            min={lichSuTuNgay}
                            onChange={(e) => {
                                setCheDoLocThoiGian("TUY_CHINH");
                                setLichSuDenNgay(e.target.value);
                            }}
                            aria-label="Đến ngày lịch sử"
                            style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "12px" }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "11px", color: "#64748b", marginBottom: "3px", fontWeight: "bold" }}>Loại sự kiện</label>
                        <select value={lichSuHanhDong} onChange={(e) => setLichSuHanhDong(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "12px" }}>
                            <option value="">Tất cả sự kiện</option>
                            <option value="GAN">Phân công mới</option>
                            <option value="NGHI_PHEP">Đăng ký nghỉ phép</option>
                            <option value="NGHI">Nghỉ / vắng mặt</option>
                            <option value="DI_LAM_LAI">Đi làm lại</option>
                            <option value="GO">Gỡ phân công</option>
                            <option value="THAY_THE">Thay thế nhân viên</option>
                            <option value="DOI_CONG_DOAN">Đổi công đoạn</option>
                            <option value="DIEU_CHUYEN">Điều chuyển Line</option>
                            <option value="DIEU_CHINH">Điều chỉnh thời gian</option>
                        </select>
                    </div>
                </div>
                {dangTaiLichSu ? <p style={{ color: "var(--text-muted)" }}>Đang tải lịch sử...</p> : lichSuPhanCong.length === 0 ? <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Không có sự kiện trong bộ lọc hiện tại.</p> : (
                    <div className="bang-du-lieu-wrapper" style={{ maxHeight: "420px", overflowY: "auto" }}>
                        <table className="bang-du-lieu" style={{ fontSize: "12px" }}>
                            <thead><tr><th>Thời gian</th><th>Nhân viên</th><th>Sự kiện</th><th>Công đoạn</th><th>Chi tiết</th></tr></thead>
                            <tbody>{lichSuPhanCong.map((item) => {
                                const nhan = { GAN: "Phân công", NGHI: "Nghỉ / vắng", NGHI_PHEP: "Nghỉ phép", DI_LAM_LAI: "Đi làm lại", GO: "Kết thúc phân công", THAY_THE: "Thay thế", DOI_CONG_DOAN: "Đổi công đoạn", DIEU_CHUYEN: "Điều chuyển Line", DIEU_CHINH: "Điều chỉnh" }[item.hanh_dong] || item.hanh_dong;
                                return <tr key={item.id}><td style={{ whiteSpace: "nowrap" }}>{formatDateTimeLichSu(item.event_datetime)}</td><td><strong>{item.ho_ten}</strong><br /><span style={{ color: "var(--text-muted)" }}>{item.ma_nhan_vien}</span></td><td><span style={{ background: "#f1f5f9", color: "#475569", padding: "3px 7px", borderRadius: "999px", fontWeight: 700 }}>{nhan}</span></td><td>{item.ten_cong_doan}</td><td style={{ whiteSpace: "nowrap" }}>{dinhDangChiTietLichSu(item)}{item.ten_nguoi_thay_the ? ` · Thay bởi ${item.ten_nguoi_thay_the}` : ""}</td></tr>;
                            })}</tbody>
                        </table>
                    </div>
                )}
            </div>

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
                                color: modalCongDoanCheDo === "SUA" ? "#64748b" : "#1f2937",
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

            {/* MODAL THAY ĐỔI NHÂN VIÊN */}
            {modalThayDoiOpen && targetNhanVienCu && targetCongDoanThayDoi && (
                <Modal
                    isOpen={modalThayDoiOpen}
                    onClose={() => setModalThayDoiOpen(false)}
                    title={`Thay đổi nhân viên: ${targetCongDoanThayDoi.ten_bo_phan}`}
                    footer={
                        <>
                            <button type="button" className="nut-huy" onClick={() => setModalThayDoiOpen(false)}>Hủy</button>
                            <button 
                                type="button" 
                                className="nut-chinh" 
                                onClick={xuLyXacNhanThayDoiNhanVien}
                                disabled={dangLuuThayDoi || !selectedNhanVienMoiId}
                                style={{ width: "auto", padding: "0 20px" }}
                            >
                                {dangLuuThayDoi ? "Đang cập nhật..." : "Xác nhận thay đổi"}
                            </button>
                        </>
                    }
                >
                    <div style={{ marginBottom: "16px", padding: "12px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #d1d5db" }}>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Nhân viên hiện tại trên vị trí:</div>
                        <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1f2937", marginTop: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>[{targetNhanVienCu.ma_nhan_vien}] {targetNhanVienCu.ho_ten}</span>
                            <span style={{ background: "#fef2f2", color: "#dc2626", fontSize: "11px", padding: "2px 8px", borderRadius: "999px" }}>
                                {targetNhanVienCu.ten_ca_goc || targetNhanVienCu.ten_ca_phan_cong || "Ca làm"}
                            </span>
                        </div>
                    </div>

                    <div style={{ marginBottom: "16px", padding: "12px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <label style={nhanBoLoc}>Thời gian bắt đầu thay thế</label>
                                <input
                                    type="datetime-local"
                                    value={thayTheStartDatetime}
                                    onChange={(e) => {
                                        setThayTheStartDatetime(e.target.value);
                                        setDaKiemTraLichThayThe(false);
                                        setSelectedNhanVienMoiId("");
                                    }}
                                    style={oNhapBoLoc}
                                />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <label style={nhanBoLoc}>Thời gian kết thúc thay thế</label>
                                <input
                                    type="datetime-local"
                                    value={thayTheEndDatetime}
                                    min={thayTheStartDatetime}
                                    onChange={(e) => {
                                        setThayTheEndDatetime(e.target.value);
                                        setDaKiemTraLichThayThe(false);
                                        setSelectedNhanVienMoiId("");
                                    }}
                                    style={oNhapBoLoc}
                                />
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
                            <button type="button" className="nut-huy" onClick={() => taiDanhSachUngVienThayDoi({
                                congDoanId: targetCongDoanThayDoi?.cong_doan_id,
                                nhanVienCuId: targetNhanVienCu?.nhan_vien_id
                            })} style={{ height: "38px", padding: "0 14px", fontSize: "12px" }}>
                                Tải lại danh sách
                            </button>
                            <button type="button" className="nut-chinh" onClick={xuLyKiemTraLichThayThe} style={{ height: "38px", padding: "0 14px", fontSize: "12px", width: "auto" }}>
                                Kiểm tra lịch
                            </button>
                        </div>
                    </div>

                    {loiThayDoi && (
                        <div style={{ marginBottom: "12px", padding: "10px 12px", backgroundColor: "#fee2e2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", fontSize: "13px" }}>
                            {loiThayDoi}
                        </div>
                    )}

                    <div className="nhom-o-nhap">
                        <label style={{ fontWeight: "bold", fontSize: "13px" }}>
                            {laAdmin 
                                ? "Chọn nhân viên mới để thay thế (Danh sách đầy đủ tất cả các ca):" 
                                : "Chọn nhân viên mới để thay thế (Danh sách đầy đủ thuộc ca của bạn):"}
                        </label>
                        {dangTaiUngVienThayDoi ? (
                            <p style={{ fontStyle: "italic", color: "#64748b", fontSize: "13px", marginTop: "6px" }}>Đang tải danh sách nhân sự đủ chứng chỉ...</p>
                        ) : danhSachUngVienThayDoi.length === 0 ? (
                            <p style={{ color: "#dc2626", fontWeight: "bold", fontSize: "13px", marginTop: "6px" }}>
                                Không tìm thấy nhân viên có chứng chỉ kỹ năng phù hợp để thay thế!
                            </p>
                        ) : (
                            <select
                                value={selectedNhanVienMoiId}
                                onChange={(e) => {
                                    const nextId = e.target.value;
                                    setSelectedNhanVienMoiId(nextId);
                                    const selected = danhSachUngVienThayDoi.find((uv) => String(uv.id) === String(nextId));
                                    if (selected?.conflict_message) {
                                        setLoiThayDoi(`Không thể chọn nhân sự do trùng lịch: ${selected.conflict_message}`);
                                    } else {
                                        setLoiThayDoi("");
                                    }
                                }}
                                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px", marginTop: "6px", fontWeight: "600" }}
                            >
                                <option value="">-- Chọn nhân viên thay thế --</option>
                                {danhSachUngVienThayDoi.map((uv) => (
                                    <option key={uv.id} value={uv.id} disabled={Boolean(uv.conflict_message)}>
                                        [{uv.ma_nhan_vien}] {uv.ho_ten} - [{uv.ten_ca || "Chưa gán ca"}] (Cấp độ CC: {uv.cap_do || 1}){uv.conflict_message ? " - TRÙNG LỊCH" : ""}
                                    </option>
                                ))}
                            </select>
                        )}
                        {selectedNhanVienMoiId && danhSachUngVienThayDoi.find((uv) => String(uv.id) === String(selectedNhanVienMoiId))?.conflict_message && (
                            <p style={{ marginTop: "8px", fontSize: "12px", color: "#b91c1c" }}>
                                {danhSachUngVienThayDoi.find((uv) => String(uv.id) === String(selectedNhanVienMoiId)).conflict_message}
                            </p>
                        )}
                    </div>
                </Modal>
            )}

            {modalDieuChinhOpen && targetDieuChinh && (
                <Modal
                    isOpen={modalDieuChinhOpen}
                    onClose={() => setModalDieuChinhOpen(false)}
                    title={`Điều chỉnh phân công: ${targetDieuChinh.nv.ho_ten}`}
                    footer={
                        <>
                            <button type="button" className="nut-huy" onClick={() => setModalDieuChinhOpen(false)}>Hủy</button>
                            <button
                                type="button"
                                className="nut-chinh"
                                onClick={xuLyXacNhanDieuChinh}
                                disabled={dangLuuDieuChinh}
                                style={{ width: "auto", padding: "0 20px" }}
                            >
                                {dangLuuDieuChinh ? "Đang lưu..." : "Xác nhận điều chỉnh"}
                            </button>
                        </>
                    }
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ fontSize: "13px", color: "#475569" }}>
                            Nhân viên: <strong>{targetDieuChinh.nv.ho_ten}</strong> · Công đoạn: <strong>{targetDieuChinh.bp.ten_bo_phan}</strong>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={nhanBoLoc}>Thời gian bắt đầu</label>
                            <input
                                type="datetime-local"
                                value={dieuChinhStartDatetime}
                                onChange={(e) => { setDieuChinhStartDatetime(e.target.value); setLoiDieuChinh(""); }}
                                style={oNhapBoLoc}
                            />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={nhanBoLoc}>Thời gian kết thúc</label>
                            <input
                                type="datetime-local"
                                value={dieuChinhEndDatetime}
                                min={dieuChinhStartDatetime}
                                onChange={(e) => { setDieuChinhEndDatetime(e.target.value); setLoiDieuChinh(""); }}
                                style={oNhapBoLoc}
                            />
                        </div>
                        {loiDieuChinh && (
                            <div style={{ padding: "10px 12px", backgroundColor: "#fee2e2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", fontSize: "13px" }}>
                                {loiDieuChinh}
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {modalGoOpen && targetNguoiGo && targetCongDoanGo && (
                <Modal
                    isOpen={modalGoOpen}
                    onClose={() => setModalGoOpen(false)}
                    title={`Gỡ nhân viên: ${targetNguoiGo.ho_ten}`}
                    footer={
                        <>
                            <button type="button" className="nut-huy" onClick={() => setModalGoOpen(false)}>Hủy</button>
                            <button
                                type="button"
                                className="nut-chinh"
                                onClick={xuLyXacNhanGo}
                                disabled={dangXacNhanGo}
                                style={{ width: "auto", padding: "0 20px" }}
                            >
                                {dangXacNhanGo ? "Đang gỡ..." : "Xác nhận gỡ"}
                            </button>
                        </>
                    }
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ fontSize: "13px", color: "#475569" }}>
                            Nhân viên: <strong>{targetNguoiGo.ho_ten}</strong> · Công đoạn: <strong>{targetCongDoanGo.ten_bo_phan}</strong>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={nhanBoLoc}>Thời gian bắt đầu</label>
                            <input
                                type="datetime-local"
                                value={goStartDatetime}
                                onChange={(e) => setGoStartDatetime(e.target.value)}
                                style={oNhapBoLoc}
                            />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={nhanBoLoc}>Thời gian kết thúc</label>
                            <input
                                type="datetime-local"
                                value={goEndDatetime}
                                min={goStartDatetime}
                                onChange={(e) => setGoEndDatetime(e.target.value)}
                                style={oNhapBoLoc}
                            />
                        </div>
                    </div>
                </Modal>
            )}

            {modalNghiPhepOpen && targetNghiPhep && (
                <Modal
                    isOpen={modalNghiPhepOpen}
                    onClose={() => setModalNghiPhepOpen(false)}
                    title={`Đăng ký nghỉ phép: ${targetNghiPhep.nv.ho_ten}`}
                    footer={
                        <>
                            <button type="button" className="nut-huy" onClick={() => setModalNghiPhepOpen(false)}>Hủy</button>
                            <button
                                type="button"
                                className="nut-chinh"
                                onClick={xuLyXacNhanNghiPhep}
                                disabled={dangLuuNghiPhep}
                                style={{ width: "auto", padding: "0 20px" }}
                            >
                                {dangLuuNghiPhep ? "Đang xử lý..." : "Xác nhận nghỉ phép"}
                            </button>
                        </>
                    }
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ fontSize: "13px", color: "#475569" }}>
                            Nhân viên: <strong>{targetNghiPhep.nv.ho_ten}</strong> · Công đoạn: <strong>{targetNghiPhep.bp.ten_bo_phan}</strong>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={nhanBoLoc}>Thời gian bắt đầu nghỉ phép</label>
                            <input
                                type="datetime-local"
                                value={nghiPhepStartDatetime}
                                onChange={(e) => { setNghiPhepStartDatetime(e.target.value); setLoiNghiPhep(""); }}
                                style={oNhapBoLoc}
                            />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={nhanBoLoc}>Thời gian kết thúc nghỉ phép</label>
                            <input
                                type="datetime-local"
                                value={nghiPhepEndDatetime}
                                min={nghiPhepStartDatetime}
                                onChange={(e) => { setNghiPhepEndDatetime(e.target.value); setLoiNghiPhep(""); }}
                                style={oNhapBoLoc}
                            />
                        </div>
                        {loiNghiPhep && (
                            <div style={{ padding: "10px 12px", backgroundColor: "#fee2e2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", fontSize: "13px" }}>
                                {loiNghiPhep}
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* MODAL XEM LỊCH LÀM VIỆC & TIMELINE PHÂN CÔNG CHI TIẾT */}
            {modalXemLichOpen && (
                <Modal
                    isOpen={modalXemLichOpen}
                    onClose={() => setModalXemLichOpen(false)}
                    title="📅 Lịch Làm Việc chi tiết"
                    maxWidth="1400px"
                  
                >
                    {/* ===== BỘ LỌC THỜI GIAN ===== */}
                    <div
                        style={{
                            background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
                            padding: "22px 26px",
                            borderRadius: "14px",
                            border: "1px solid #e2e8f0",
                            marginBottom: "20px",
                            boxShadow: "0 1px 2px rgba(15,23,42,0.04)"
                        }}
                    >
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
                            <span style={{ fontSize: "13px", fontWeight: "700", color: "#334155", marginRight: "4px", letterSpacing: "0.2px" }}>
                                Chế độ xem
                            </span>
                            <div
                                style={{
                                    display: "inline-flex",
                                    background: "#e2e8f0",
                                    borderRadius: "999px",
                                    padding: "3px",
                                    gap: "2px"
                                }}
                            >
                                {[
                                    { key: "TUAN", label: "Theo Tuần", icon: "📆" },
                                    { key: "THANG", label: "Theo Tháng", icon: "🗓️" },
                                    { key: "NAM", label: "Theo Năm", icon: "📊" },
                                    { key: "TUY_CHINH", label: "Tùy chỉnh", icon: "⏱️" }
                                ].map((tab) => {
                                    const dangChon = cheDoLocThoiGian === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => tab.key === "TUY_CHINH" ? setCheDoLocThoiGian("TUY_CHINH") : capNhatKhoangThoiGianLichSu(tab.key)}
                                            style={{
                                                padding: "9px 20px",
                                                borderRadius: "999px",
                                                fontSize: "13px",
                                                fontWeight: "700",
                                                cursor: "pointer",
                                                border: "none",
                                                transition: "all 0.15s ease",
                                                backgroundColor: dangChon ? "#ffffff" : "transparent",
                                                color: dangChon ? "var(--primary-color)" : "#64748b",
                                                boxShadow: dangChon ? "0 1px 3px rgba(15,23,42,0.15)" : "none"
                                            }}
                                        >
                                            <span style={{ marginRight: "5px" }}>{tab.icon}</span>{tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px", alignItems: "end" }}>
                            {/* Chọn Năm */}
                            <div>
                                <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "6px", fontWeight: "600" }}>Năm</label>
                                <select
                                    value={namLoc}
                                    onChange={(e) => {
                                        const y = Number(e.target.value);
                                        setNamLoc(y);
                                        capNhatKhoangThoiGianLichSu(cheDoLocThoiGian, y, thangLoc, tuanDuocChon);
                                    }}
                                    style={{ width: "100%", padding: "11px 12px", borderRadius: "9px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "600", background: "#fff", color: "#1e293b" }}
                                >
                                    {[2024, 2025, 2026, 2027, 2028].map(y => (
                                        <option key={y} value={y}>Năm {y}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Dropdown Tuần của Năm */}
                            {cheDoLocThoiGian === "TUAN" && (
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "6px", fontWeight: "600" }}>Tuần trong năm {namLoc}</label>
                                    <select
                                        value={tuanDuocChon}
                                        onChange={(e) => {
                                            const wNum = Number(e.target.value);
                                            capNhatKhoangThoiGianLichSu("TUAN", namLoc, thangLoc, wNum);
                                        }}
                                        style={{ width: "100%", padding: "11px 12px", borderRadius: "9px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "600", background: "#fff", color: "#1e293b" }}
                                    >
                                        {danhSachTuan.map((w) => (
                                            <option key={w.weekNum} value={w.weekNum}>{w.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Dropdown Tháng của Năm */}
                            {cheDoLocThoiGian === "THANG" && (
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "6px", fontWeight: "600" }}>Tháng trong năm {namLoc}</label>
                                    <select
                                        value={thangLoc}
                                        onChange={(e) => {
                                            const m = Number(e.target.value);
                                            setThangLoc(m);
                                            capNhatKhoangThoiGianLichSu("THANG", namLoc, m);
                                        }}
                                        style={{ width: "100%", padding: "11px 12px", borderRadius: "9px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "600", background: "#fff", color: "#1e293b" }}
                                    >
                                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                                            <option key={m} value={m}>Tháng {m} / {namLoc}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Từ ngày & Đến ngày khi chọn Tùy chỉnh */}
                            {cheDoLocThoiGian === "TUY_CHINH" && (
                                <>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "6px", fontWeight: "600" }}>Từ ngày</label>
                                        <input
                                            type="date"
                                            value={lichSuTuNgay}
                                            onChange={(e) => setLichSuTuNgay(e.target.value)}
                                            style={{ width: "100%", padding: "11px 12px", borderRadius: "9px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#fff" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "6px", fontWeight: "600" }}>Đến ngày</label>
                                        <input
                                            type="date"
                                            value={lichSuDenNgay}
                                            min={lichSuTuNgay}
                                            onChange={(e) => setLichSuDenNgay(e.target.value)}
                                            style={{ width: "100%", padding: "11px 12px", borderRadius: "9px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#fff" }}
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "6px", fontWeight: "600" }}>Lọc theo Công đoạn</label>
                                <select
                                    value={lichSuCongDoanId}
                                    onChange={(e) => setLichSuCongDoanId(e.target.value)}
                                    style={{ width: "100%", padding: "11px 12px", border: "1px solid #cbd5e1", borderRadius: "9px", fontSize: "13px", background: "#fff", color: "#1e293b", fontWeight: "600" }}
                                >
                                    <option value="">Tất cả công đoạn</option>
                                    {bo_phan.map((bp) => <option key={bp.cong_doan_id} value={bp.cong_doan_id}>{bp.ten_bo_phan}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px dashed #cbd5e1", fontSize: "13px", color: "#475569", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontWeight: "700" }}>🗓 Khoảng thời gian đang xem:</span>
                            <span style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "999px", padding: "4px 14px", fontWeight: "700", color: "var(--primary-color)", fontSize: "13px" }}>
                                {lichSuTuNgay} → {lichSuDenNgay}
                            </span>
                        </div>
                    </div>

                    {/* ===== TIMELINE MATRIX / CALENDAR TABLE ===== */}
                    <div style={{ marginBottom: "22px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                            <h4 style={{ margin: 0, fontSize: "15px", color: "#1e293b", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                                📊 Timeline phân công nhân sự các công đoạn
                            </h4>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: "600", color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "999px", padding: "4px 12px" }}>
                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--green)", display: "inline-block" }} /> Đang làm
                                </span>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: "600", color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "999px", padding: "4px 12px" }}>
                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--red)", display: "inline-block" }} /> Nghỉ phép
                                </span>
                        
                            </div>
                        </div>

                        <div className="bang-du-lieu-wrapper" style={{ maxHeight: "460px", overflow: "auto", border: "1px solid #e2e8f0", borderRadius: "10px", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
                            <table className="bang-du-lieu" style={{ fontSize: "12px", minWidth: "820px", borderCollapse: "separate", borderSpacing: 0 }}>
                                <thead>
                                    <tr>
                                        <th style={{ position: "sticky", left: 0, top: 0, background: "#f1f5f9", zIndex: 4, width: "190px", textAlign: "left", padding: "12px", borderBottom: "2px solid #e2e8f0", fontSize: "12px" }}>
                                            Công đoạn / Nhân viên
                                        </th>
                                        {danhSachNgayTimeline.map((dateStr) => {
                                            const d = new Date(dateStr);
                                            const thuNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
                                            const thu = thuNames[d.getDay()];
                                            const dateShort = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
                                            const laChuNhat = d.getDay() === 0;
                                            return (
                                                <th
                                                    key={dateStr}
                                                    style={{
                                                        position: "sticky", top: 0, zIndex: 3,
                                                        textAlign: "center", minWidth: "60px", padding: "10px 4px",
                                                        background: laChuNhat ? "#fef2f2" : "#f1f5f9",
                                                        borderBottom: "2px solid #e2e8f0"
                                                    }}
                                                >
                                                    <div style={{ fontWeight: "700", color: laChuNhat ? "var(--red)" : "#334155" }}>{thu}</div>
                                                    <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "normal" }}>{dateShort}</div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {bo_phan.filter(bp => !lichSuCongDoanId || String(bp.cong_doan_id) === String(lichSuCongDoanId)).map((bp) => {
                                        return (
                                            <React.Fragment key={bp.cong_doan_id}>
                                                {/* Header row cho Công đoạn */}
                                                <tr style={{ background: "#eef2ff" }}>
                                                    <td
                                                        colSpan={danhSachNgayTimeline.length + 1}
                                                        style={{
                                                            color: "var(--primary-color)", padding: "10px 12px", fontWeight: "700", fontSize: "13px",
                                                            borderLeft: "3px solid var(--primary-color)", position: "sticky", left: 0, background: "#eef2ff"
                                                        }}
                                                    >
                                                        🛠️ {bp.ten_bo_phan}
                                                        <span style={{ fontWeight: "500", color: "#64748b", marginLeft: "6px" }}>
                                                            (Định biên: {bp.so_luong_min !== null && bp.so_luong_max !== null ? `${bp.so_luong_min}-${bp.so_luong_max}` : bp.so_luong_can} người)
                                                        </span>
                                                    </td>
                                                </tr>

                                                {/* Hàng từng nhân viên thuộc công đoạn này */}
                                                {bp.nhan_vien.map((nv, idxNv) => {
                                                    const nenXen = idxNv % 2 === 1 ? "#f8fafc" : "#ffffff";
                                                    return (
                                                        <tr key={nv.nhan_vien_id}>
                                                            <td style={{ position: "sticky", left: 0, background: nenXen, zIndex: 2, fontWeight: "600", whiteSpace: "nowrap", padding: "9px 12px", borderBottom: "1px solid #f1f5f9" }}>
                                                                <div style={{ color: "#1e293b" }}>{nv.ho_ten}</div>
                                                                <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "normal" }}>{nv.ma_nhan_vien}</div>
                                                            </td>
                                                            {danhSachNgayTimeline.map((dateStr) => {
                                                                // Kiểm tra sự kiện giao với ngày dateStr (dateStr 00:00:00 -> 23:59:59)
                                                                const dayStart = `${dateStr} 00:00:00`;
                                                                const dayEnd = `${dateStr} 23:59:59`;

                                                                const suKienTrongNgay = lichSuPhanCong.filter(item => {
                                                                    if (Number(item.nhan_vien_id) !== Number(nv.nhan_vien_id) ||
                                                                        Number(item.cong_doan_id) !== Number(bp.cong_doan_id)) {
                                                                        return false;
                                                                    }
                                                                    const itemStart = item.thoi_gian_bat_dau || item.event_datetime || "";
                                                                    const itemEnd = item.thoi_gian_ket_thuc || itemStart;
                                                                    if (!itemStart) return false;
                                                                    return itemStart <= dayEnd && itemEnd >= dayStart;
                                                                });

                                                                const isNghiPhep = suKienTrongNgay.some(s => s.hanh_dong === "NGHI_PHEP");
                                                                const isNghi = suKienTrongNgay.some(s => s.hanh_dong === "NGHI");
                                                                const isGo = suKienTrongNgay.some(s => s.hanh_dong === "GO");

                                                                return (
                                                                    <td key={dateStr} style={{ textAlign: "center", padding: "8px 4px", background: nenXen, borderBottom: "1px solid #f1f5f9" }}>
                                                                        {isNghiPhep ? (
                                                                            <span style={{ display: "inline-block", minWidth: "42px", background: "#fef2f2", color: "var(--red)", border: "1px solid #fecaca", padding: "4px 7px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>
                                                                                NGHỈ
                                                                            </span>
                                                                        ) : isNghi ? (
                                                                            <span style={{ display: "inline-block", minWidth: "42px", background: "#f1f5f9", color: "#64748b", padding: "4px 7px", borderRadius: "6px", fontSize: "11px", fontWeight: "600" }}>
                                                                                VẮNG
                                                                            </span>
                                                                        ) : isGo ? (
                                                                            <span style={{ display: "inline-block", minWidth: "42px", background: "#f8fafc", color: "#94a3b8", border: "1px dashed #cbd5e1", padding: "4px 7px", borderRadius: "6px", fontSize: "11px", fontWeight: "600" }}>
                                                                                GỠ
                                                                            </span>
                                                                        ) : (
                                                                            <span style={{ display: "inline-block", minWidth: "42px", background: "#f0fdf4", color: "var(--green)", border: "1px solid #bbf7d0", padding: "4px 7px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>
                                                                                LÀM
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ===== BẢNG NHẬT KÝ SỰ KIỆN PHÂN CÔNG CHI TIẾT ===== */}
                    <div>
                        <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#1e293b", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                            📝 Nhật ký phân công & thay đổi nhân sự chi tiết
                        </h4>
                        {dangTaiLichSu ? (
                            <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>Đang tải nhật ký...</p>
                        ) : lichSuPhanCong.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "28px", background: "#f8fafc", borderRadius: "10px", border: "1px dashed #cbd5e1", color: "#94a3b8", fontSize: "13px" }}>
                                Không có nhật ký phân công trong khoảng thời gian này.
                            </div>
                        ) : (
                            <div className="bang-du-lieu-wrapper" style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "10px", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
                                <table className="bang-du-lieu" style={{ fontSize: "12px", borderCollapse: "separate", borderSpacing: 0 }}>
                                    <thead>
                                        <tr>
                                            <th style={{ position: "sticky", top: 0, background: "#f1f5f9", padding: "11px 12px", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>Thời gian</th>
                                            <th style={{ position: "sticky", top: 0, background: "#f1f5f9", padding: "11px 12px", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>Nhân viên</th>
                                            <th style={{ position: "sticky", top: 0, background: "#f1f5f9", padding: "11px 12px", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>Sự kiện</th>
                                            <th style={{ position: "sticky", top: 0, background: "#f1f5f9", padding: "11px 12px", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>Công đoạn</th>
                                            <th style={{ position: "sticky", top: 0, background: "#f1f5f9", padding: "11px 12px", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>Chi tiết</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lichSuPhanCong.map((item, idxLog) => {
                                            const nhan = { GAN: "Phân công", NGHI: "Nghỉ / vắng", NGHI_PHEP: "Nghỉ phép", DI_LAM_LAI: "Đi làm lại", GO: "Kết thúc phân công", THAY_THE: "Thay thế", DOI_CONG_DOAN: "Đổi công đoạn", DIEU_CHUYEN: "Điều chuyển Line", DIEU_CHINH: "Điều chỉnh" }[item.hanh_dong] || item.hanh_dong;
                                            const mauSuKien = {
                                                GAN: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
                                                NGHI: { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" },
                                                NGHI_PHEP: { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
                                                DI_LAM_LAI: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
                                                GO: { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" },
                                                THAY_THE: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
                                                DOI_CONG_DOAN: { bg: "#faf5ff", color: "#7e22ce", border: "#e9d5ff" },
                                                DIEU_CHUYEN: { bg: "#ecfeff", color: "#0e7490", border: "#a5f3fc" },
                                                DIEU_CHINH: { bg: "#fefce8", color: "#a16207", border: "#fef08a" }
                                            }[item.hanh_dong] || { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };
                                            const nenXenLog = idxLog % 2 === 1 ? "#f8fafc" : "#ffffff";
                                            return (
                                                <tr key={item.id} style={{ background: nenXenLog }}>
                                                    <td style={{ whiteSpace: "nowrap", padding: "9px 12px", color: "#475569", borderBottom: "1px solid #f1f5f9" }}>{formatDateTimeLichSu(item.event_datetime)}</td>
                                                    <td style={{ padding: "9px 12px", borderBottom: "1px solid #f1f5f9" }}>
                                                        <strong style={{ color: "#1e293b" }}>{item.ho_ten}</strong>{" "}
                                                        <span style={{ color: "#94a3b8" }}>({item.ma_nhan_vien})</span>
                                                    </td>
                                                    <td style={{ padding: "9px 12px", borderBottom: "1px solid #f1f5f9" }}>
                                                        <span style={{ background: mauSuKien.bg, color: mauSuKien.color, border: `1px solid ${mauSuKien.border}`, padding: "4px 11px", borderRadius: "999px", fontWeight: "700", fontSize: "11px", whiteSpace: "nowrap" }}>
                                                            {nhan}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "9px 12px", color: "#334155", borderBottom: "1px solid #f1f5f9" }}>{item.ten_cong_doan}</td>
                                                    <td style={{ whiteSpace: "nowrap", padding: "9px 12px", color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>
                                                        {dinhDangChiTietLichSu(item)}{item.ten_nguoi_thay_the ? ` · Thay bởi ${item.ten_nguoi_thay_the}` : ""}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

        </div>
    );
}
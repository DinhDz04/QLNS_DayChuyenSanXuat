import { goiApi } from "../../../services/api.js";

export function layDanhSachDayChuyen() {
    return goiApi("/day-chuyen");
}

export function layDayChuyenTheoId(id) {
    return goiApi(`/day-chuyen/${id}`);
}

export function layDanhSachLeaderLine() {
    return goiApi("/day-chuyen/leaders");
}

export function taoDayChuyen(duLieu) {
    return goiApi("/day-chuyen", {
        method: "POST",
        body: JSON.stringify(duLieu)
    });
}

export function capNhatDayChuyen(id, duLieu) {
    return goiApi(`/day-chuyen/${id}`, {
        method: "PUT",
        body: JSON.stringify(duLieu)
    });
}

export function xoaDayChuyen(id) {
    return goiApi(`/day-chuyen/${id}`, {
        method: "DELETE"
    });
}

export function layChiTietDayChuyen(id, ngay, caLamId) {
    let url = `/day-chuyen/${id}/chi-tiet`;
    const params = new URLSearchParams();
    if (ngay) params.append("ngay", ngay);
    if (caLamId) params.append("ca_lam_id", caLamId);
    if (params.toString()) url += `?${params.toString()}`;
    return goiApi(url);
}

export function layLichSuPhanCong({ dayChuyenId, congDoanId, nhanVienId, tuNgay, denNgay, hanhDong } = {}) {
    const params = new URLSearchParams();
    if (dayChuyenId) params.append("day_chuyen_id", dayChuyenId);
    if (congDoanId) params.append("cong_doan_id", congDoanId);
    if (nhanVienId) params.append("nhan_vien_id", nhanVienId);
    if (tuNgay) params.append("tu_ngay", tuNgay);
    if (denNgay) params.append("den_ngay", denNgay);
    if (hanhDong) params.append("hanh_dong", hanhDong);
    return goiApi(`/day-chuyen/lich-su-phan-cong?${params.toString()}`);
}

export function layUngVienChoBoPhan(congDoanId, ngay, caLamId, ngayBatDau, ngayKetThuc, startDatetime, endDatetime) {
    const params = new URLSearchParams({ cong_doan_id: congDoanId });
    let url = "/day-chuyen/ung-vien?" + params.toString();
    if (ngay) url += `&ngay=${encodeURIComponent(ngay)}`;
    if (ngayBatDau) url += `&ngay_bat_dau=${encodeURIComponent(ngayBatDau)}`;
    if (ngayKetThuc) url += `&ngay_ket_thuc=${encodeURIComponent(ngayKetThuc)}`;
    if (startDatetime) url += `&start_datetime=${encodeURIComponent(startDatetime)}`;
    if (endDatetime) url += `&end_datetime=${encodeURIComponent(endDatetime)}`;
    if (caLamId && caLamId !== "ALL") url += `&ca_lam_id=${encodeURIComponent(caLamId)}`;
    return goiApi(url);
}

export function capNhatTrangThaiPhanCong(duLieu) {
    return goiApi("/day-chuyen/cap-nhat-trang-thai-phan-cong", {
        method: "POST",
        body: JSON.stringify(duLieu)
    });
}

export function phanCongNhanSu(duLieu) {
    return goiApi("/day-chuyen/phan-cong", {
        method: "POST",
        body: JSON.stringify(duLieu)
    });
}

export function thayDoiNhanSu(duLieu) {
    return goiApi("/day-chuyen/thay-doi-nhan-su", {
        method: "POST",
        body: JSON.stringify(duLieu)
    });
}

export function goPhanCongNhanSu(duLieu) {
    return goiApi("/day-chuyen/go-phan-cong", {
        method: "POST",
        body: JSON.stringify(duLieu)
    });
}

export function dieuChinhPhanCong(duLieu) {
    return goiApi("/day-chuyen/dieu-chinh-phan-cong", {
        method: "POST",
        body: JSON.stringify(duLieu)
    });
}

export function nghiPhepPhanCong(duLieu) {
    return goiApi("/day-chuyen/nghi-phep-phan-cong", {
        method: "POST",
        body: JSON.stringify(duLieu)
    });
}

export function tuDongGanNhanSu(id, ngay, caLamId, ngayBatDau, ngayKetThuc) {
    return goiApi(`/day-chuyen/${id}/auto-assign`, {
        method: "POST",
        body: JSON.stringify({
            ngay,
            ngay_bat_dau: ngayBatDau || ngay,
            ngay_ket_thuc: ngayKetThuc || ngayBatDau || ngay,
            ca_lam_id: caLamId
        })
    });
}

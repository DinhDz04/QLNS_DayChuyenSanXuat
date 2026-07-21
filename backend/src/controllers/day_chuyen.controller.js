import DayChuyenService from "../services/day_chuyen.service.js";
import ApiError from "../utils/api_error.js";

/**
 * Controller xử lý các yêu cầu liên quan đến dây chuyền sản xuất
 */
class DayChuyenController {
    static async layDanhSachDayChuyen(req, res, next) {
        try {
            const data = await DayChuyenService.layDanhSachDayChuyen(req.nguoiDung);
            return res.json({ success: true, message: "Lấy danh sách dây chuyền thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async layDanhSachLeaderLine(req, res, next) {
        try {
            const data = await DayChuyenService.layDanhSachLeaderLine();
            return res.json({ success: true, message: "Lấy danh sách leader line thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async layDayChuyenTheoId(req, res, next) {
        try {
            const data = await DayChuyenService.timDayChuyenTheoId(req.params.id);
            if (!data) {
                throw new ApiError(404, "Không tìm thấy dây chuyền");
            }
            return res.json({ success: true, message: "Lấy chi tiết dây chuyền thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async taoDayChuyen(req, res, next) {
        try {
            const { ten_day_chuyen, khu_vuc_id, leader_id, trang_thai, bo_phan } = req.body;
            const data = await DayChuyenService.taoDayChuyen({ ten_day_chuyen, khu_vuc_id, leader_id, trang_thai, bo_phan });
            return res.status(201).json({ success: true, message: "Tạo dây chuyền thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async capNhatDayChuyen(req, res, next) {
        try {
            const { ten_day_chuyen, khu_vuc_id, leader_id, trang_thai, bo_phan } = req.body;
            const data = await DayChuyenService.capNhatDayChuyen(req.params.id, { ten_day_chuyen, khu_vuc_id, leader_id, trang_thai, bo_phan });
            return res.json({ success: true, message: "Cập nhật dây chuyền thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async xoaDayChuyen(req, res, next) {
        try {
            await DayChuyenService.xoaDayChuyen(req.params.id);
            return res.json({ success: true, message: "Xóa dây chuyền thành công", data: null });
        } catch (err) {
            next(err);
        }
    }

    static async layChiTietDayChuyen(req, res, next) {
        try {
            const { id } = req.params;
            const { ngay } = req.query;
            const data = await DayChuyenService.layChiTietDayChuyen(id, ngay, req.nguoiDung);
            return res.json({ success: true, message: "Lấy chi tiết phân công dây chuyền thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async layUngVienChoBoPhan(req, res, next) {
        try {
            const { cong_doan_id, ngay, ca_lam_id } = req.query;
            if (!cong_doan_id) {
                throw new ApiError(400, "Thiếu cong_doan_id");
            }
            const data = await DayChuyenService.layUngVienChoBoPhan({
                congDoanId: cong_doan_id,
                ngay,
                caLamId: ca_lam_id,
                nguoiDung: req.nguoiDung
            });
            return res.json({ success: true, message: "Lấy danh sách ứng viên thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async phanCongNhanSu(req, res, next) {
        try {
            const { nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay } = req.body;
            const data = await DayChuyenService.phanCongNhanSu({ 
                nhan_vien_id, 
                day_chuyen_id, 
                cong_doan_id, 
                ca_lam_id, 
                ngay, 
                nguoiDung: req.nguoiDung 
            });
            return res.json({ success: true, message: "Phân công nhân viên vào dây chuyền thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async goPhanCongNhanSu(req, res, next) {
        try {
            const { nhan_vien_id, day_chuyen_id, cong_doan_id, ngay } = req.body;
            const data = await DayChuyenService.goPhanCongNhanSu({ nhan_vien_id, day_chuyen_id, cong_doan_id, ngay });
            return res.json({ success: true, message: "Đã gỡ nhân viên khỏi bộ phận dây chuyền", data });
        } catch (err) {
            next(err);
        }
    }

    static async capNhatTrangThaiPhanCong(req, res, next) {
        try {
            const { nhan_vien_id, day_chuyen_id, cong_doan_id, ngay, trang_thai } = req.body;
            const data = await DayChuyenService.capNhatTrangThaiPhanCong({ nhan_vien_id, day_chuyen_id, cong_doan_id, ngay, trang_thai });
            return res.json({ success: true, message: data.message, data: null });
        } catch (err) {
            next(err);
        }
    }

    static async tuDongGanNhanSu(req, res, next) {
        try {
            const { id } = req.params;
            const { ngay, ca_lam_id } = req.body;
            const data = await DayChuyenService.tuDongGanNhanSu({ day_chuyen_id: id, ngay, ca_lam_id });
            return res.json({
                success: true,
                message: data.message,
                data: data.danhSachGan
            });
        } catch (err) {
            next(err);
        }
    }
}

export default DayChuyenController;

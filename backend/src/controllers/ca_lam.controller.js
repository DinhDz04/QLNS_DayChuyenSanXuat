import CaLamService from "../services/ca_lam.service.js";

class CaLamController {
    static async layDanhSachCaLam(req, res, next) {
        try {
            const data = await CaLamService.layDanhSachCaLam();
            return res.json({ success: true, message: "Lấy danh sách ca làm việc thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async layCaLamTheoId(req, res, next) {
        try {
            const { id } = req.params;
            const data = await CaLamService.layCaLamTheoId(id);
            if (!data) {
                return res.status(404).json({ success: false, message: "Không tìm thấy ca làm việc này", data: null });
            }
            return res.json({ success: true, message: "Lấy chi tiết ca làm việc thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async taoCaLam(req, res, next) {
        try {
            const { ten_ca, gio_bat_dau, gio_ket_thuc, loai_ca, lich_lam_id } = req.body;
            const data = await CaLamService.taoCaLam({ ten_ca, gio_bat_dau, gio_ket_thuc, loai_ca, lich_lam_id });
            return res.json({ success: true, message: "Tạo ca làm việc mới thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async capNhatCaLam(req, res, next) {
        try {
            const { id } = req.params;
            const { ten_ca, gio_bat_dau, gio_ket_thuc, loai_ca, lich_lam_id } = req.body;
            const data = await CaLamService.capNhatCaLam(id, { ten_ca, gio_bat_dau, gio_ket_thuc, loai_ca, lich_lam_id });
            return res.json({ success: true, message: "Cập nhật ca làm việc thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async xoaCaLam(req, res, next) {
        try {
            const { id } = req.params;
            await CaLamService.xoaCaLam(id);
            return res.json({ success: true, message: "Xóa ca làm việc thành công", data: null });
        } catch (err) {
            next(err);
        }
    }

    // ================= LỊCH LÀM VIỆC CONTROLLERS =================
    static async layDanhSachLichLam(req, res, next) {
        try {
            const data = await CaLamService.layDanhSachLichLam();
            return res.json({ success: true, message: "Lấy danh sách lịch làm thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async taoLichLam(req, res, next) {
        try {
            const { ten_lich, chu_ky_tuan, mo_ta, ngay_bat_dau, ngay_ket_thuc, ca_lam_ids } = req.body;
            const data = await CaLamService.taoLichLam({ ten_lich, chu_ky_tuan, mo_ta, ngay_bat_dau, ngay_ket_thuc, ca_lam_ids });
            return res.json({ success: true, message: "Tạo lịch làm việc mới thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async capNhatLichLam(req, res, next) {
        try {
            const { id } = req.params;
            const { ten_lich, chu_ky_tuan, mo_ta, ngay_bat_dau, ngay_ket_thuc, ca_lam_ids } = req.body;
            const data = await CaLamService.capNhatLichLam(id, { ten_lich, chu_ky_tuan, mo_ta, ngay_bat_dau, ngay_ket_thuc, ca_lam_ids });
            return res.json({ success: true, message: "Cập nhật lịch làm việc thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async xoaLichLam(req, res, next) {
        try {
            const { id } = req.params;
            await CaLamService.xoaLichLam(id);
            return res.json({ success: true, message: "Xóa lịch làm việc thành công" });
        } catch (err) {
            next(err);
        }
    }

    static async xoayCaLichLam(req, res, next) {
        try {
            const { id } = req.params;
            const data = await CaLamService.xoayCaLichLam(id);
            return res.json(data);
        } catch (err) {
            next(err);
        }
    }
}

export default CaLamController;

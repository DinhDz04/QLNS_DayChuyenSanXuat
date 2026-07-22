import { Router } from "express";
import DayChuyenController from "../controllers/day_chuyen.controller.js";
import { xacThucToken, phanQuyen } from "../middleware/auth.middleware.js";

const router = Router();

router.use(xacThucToken);

// Các route xem thông tin (Tất cả vai trò sau khi đăng nhập đều được phép)
router.get("/", DayChuyenController.layDanhSachDayChuyen);
router.get("/leaders", DayChuyenController.layDanhSachLeaderLine);
router.get("/ung-vien", DayChuyenController.layUngVienChoBoPhan);
router.get("/:id", DayChuyenController.layDayChuyenTheoId);
router.get("/:id/chi-tiet", DayChuyenController.layChiTietDayChuyen);

// Các route thay đổi dữ liệu
router.post("/", phanQuyen("ADMIN", "LEADER_KHU_VUC"), DayChuyenController.taoDayChuyen);
router.put("/:id", phanQuyen("ADMIN", "LEADER_KHU_VUC"), DayChuyenController.capNhatDayChuyen);
router.delete("/:id", phanQuyen("ADMIN"), DayChuyenController.xoaDayChuyen);
router.post("/phan-cong", phanQuyen("ADMIN", "LEADER_KHU_VUC"), DayChuyenController.phanCongNhanSu);
router.post("/go-phan-cong", phanQuyen("ADMIN", "LEADER_KHU_VUC"), DayChuyenController.goPhanCongNhanSu);
router.post("/cap-nhat-trang-thai-phan-cong", phanQuyen("ADMIN", "LEADER_KHU_VUC"), DayChuyenController.capNhatTrangThaiPhanCong);
router.post("/:id/auto-assign", phanQuyen("ADMIN", "LEADER_KHU_VUC"), DayChuyenController.tuDongGanNhanSu);

export default router;

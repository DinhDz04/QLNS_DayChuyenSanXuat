import { Router } from "express";
import * as dayChuyenController from "../controllers/dayChuyen.controller.js";
import { xacThucToken, phanQuyen } from "../middleware/auth.middleware.js";

const router = Router();

router.use(xacThucToken);

// Các route xem thông tin (Tất cả vai trò sau khi đăng nhập đều được phép)
router.get("/", dayChuyenController.layDanhSachDayChuyen);
router.get("/leaders", dayChuyenController.layDanhSachLeaderLine);
router.get("/ung-vien", dayChuyenController.layUngVienChoBoPhan);
router.get("/:id", dayChuyenController.layDayChuyenTheoId);
router.get("/:id/chi-tiet", dayChuyenController.layChiTietDayChuyen);

// Các route thay đổi dữ liệu
router.post("/", phanQuyen("ADMIN", "LEADER_KHU_VUC"), dayChuyenController.taoDayChuyen);
router.put("/:id", phanQuyen("ADMIN", "LEADER_KHU_VUC"), dayChuyenController.capNhatDayChuyen);
router.delete("/:id", phanQuyen("ADMIN"), dayChuyenController.xoaDayChuyen);
router.post("/phan-cong", phanQuyen("ADMIN", "LEADER_KHU_VUC"), dayChuyenController.phanCongNhanSu);
router.post("/go-phan-cong", phanQuyen("ADMIN", "LEADER_KHU_VUC"), dayChuyenController.goPhanCongNhanSu);
router.post("/:id/auto-assign", phanQuyen("ADMIN", "LEADER_KHU_VUC"), dayChuyenController.tuDongGanNhanSu);

export default router;

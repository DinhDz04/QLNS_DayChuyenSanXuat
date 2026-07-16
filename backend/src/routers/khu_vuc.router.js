import { Router } from "express";
import KhuVucController from "../controllers/khu_vuc.controller.js";
import { xacThucToken, phanQuyen } from "../middleware/auth.middleware.js";

const router = Router();

router.use(xacThucToken);

// Các route xem thông tin (ADMIN, các LEADER, NHAN_VIEN có thể xem)
router.get("/", KhuVucController.layDanhSachKhuVuc);
router.get("/leaders", KhuVucController.layDanhSachLeaderKhuVuc);
router.get("/khach-hang", KhuVucController.layDanhSachKhachHang);
router.get("/:id", KhuVucController.layKhuVucTheoId);

// Các route thay đổi dữ liệu (chỉ ADMIN mới được thực hiện)
router.post("/", phanQuyen("ADMIN"), KhuVucController.taoKhuVuc);
router.put("/:id", phanQuyen("ADMIN"), KhuVucController.capNhatKhuVuc);
router.delete("/:id", phanQuyen("ADMIN"), KhuVucController.xoaKhuVuc);

// Bản đồ khu vực (canvas grid layout)
router.get("/:id/ban-do", KhuVucController.layBanDoKhuVuc);
router.post("/:id/ban-do", phanQuyen("ADMIN", "LEADER_KHU_VUC"), KhuVucController.luuBanDoKhuVuc);

export default router;

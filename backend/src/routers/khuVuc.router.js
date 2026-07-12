import { Router } from "express";
import * as khuVucController from "../controllers/khuVuc.controller.js";
import { xacThucToken, phanQuyen } from "../middleware/auth.middleware.js";

const router = Router();

router.use(xacThucToken);

// Các route xem thông tin (ADMIN, các LEADER, NHAN_VIEN có thể xem)
router.get("/", khuVucController.layDanhSachKhuVuc);
router.get("/leaders", khuVucController.layDanhSachLeaderKhuVuc);
router.get("/khach-hang", khuVucController.layDanhSachKhachHang);
router.get("/:id", khuVucController.layKhuVucTheoId);

// Các route thay đổi dữ liệu (chỉ ADMIN mới được thực hiện)
router.post("/", phanQuyen("ADMIN"), khuVucController.taoKhuVuc);
router.put("/:id", phanQuyen("ADMIN"), khuVucController.capNhatKhuVuc);
router.delete("/:id", phanQuyen("ADMIN"), khuVucController.xoaKhuVuc);

// Bản đồ khu vực (canvas grid layout)
router.get("/:id/ban-do", khuVucController.layBanDoKhuVuc);
router.post("/:id/ban-do", phanQuyen("ADMIN", "LEADER_KHU_VUC"), khuVucController.luuBanDoKhuVuc);

export default router;

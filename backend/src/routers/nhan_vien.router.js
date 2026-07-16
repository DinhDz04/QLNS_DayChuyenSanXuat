import { Router } from "express";
import NhanVienController from "../controllers/nhan_vien.controller.js";
import { xacThucToken, phanQuyen } from "../middleware/auth.middleware.js";

const router = Router();

router.use(xacThucToken);

// Tất cả tài khoản đã đăng nhập đều xem được danh sách và chứng chỉ nhân viên
router.get("/", NhanVienController.layDanhSachNhanVien);
router.get("/:id/chung-chi", NhanVienController.layChungChiNhanVien);

// Chỉ ADMIN mới được cập nhật hoặc xóa nhân viên
router.put("/:id", phanQuyen("ADMIN"), NhanVienController.capNhatNhanVien);
router.delete("/:id", phanQuyen("ADMIN"), NhanVienController.xoaNhanVien);

export default router;

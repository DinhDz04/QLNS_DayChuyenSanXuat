import { Router } from "express";
import * as nhanVienController from "../controllers/nhanVien.controller.js";
import { xacThucToken, phanQuyen } from "../middleware/auth.middleware.js";

const router = Router();

router.use(xacThucToken);

// Tất cả tài khoản đã đăng nhập đều xem được danh sách và chứng chỉ nhân viên
router.get("/", nhanVienController.layDanhSachNhanVien);
router.get("/:id/chung-chi", nhanVienController.layChungChiNhanVien);

// Chỉ ADMIN mới được cập nhật hoặc xóa nhân viên
router.put("/:id", phanQuyen("ADMIN"), nhanVienController.capNhatNhanVien);
router.delete("/:id", phanQuyen("ADMIN"), nhanVienController.xoaNhanVien);

export default router;

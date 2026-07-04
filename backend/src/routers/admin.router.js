import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { xacThucToken, phanQuyen } from "../middleware/auth.middleware.js";

const router = Router();

// Tất cả các route quản trị đều yêu cầu phải đăng nhập và là ADMIN
router.use(xacThucToken, phanQuyen("ADMIN"));

router.get("/tai-khoan", adminController.layDanhSachTaiKhoan);
router.post("/tai-khoan", adminController.taoTaiKhoan);
router.put("/tai-khoan/:id", adminController.capNhatTaiKhoan);
router.delete("/tai-khoan/:id", adminController.xoaTaiKhoan);

export default router;

import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { xacThucToken, phanQuyen } from "../middleware/auth.middleware.js";

const router = Router();

// Ai cũng gọi được - dùng để đăng nhập
router.post("/login", authController.login);

// Chỉ người đã đăng nhập VÀ có role ADMIN mới được tạo tài khoản mới
router.post("/register", xacThucToken, phanQuyen("ADMIN"), authController.register);

// Chỉ cần đăng nhập (bất kỳ role nào) là xem được thông tin của chính mình
router.get("/me", xacThucToken, authController.layThongTinCaNhan);


export default router;

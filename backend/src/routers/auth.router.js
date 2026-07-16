import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";
import { xacThucToken, phanQuyen } from "../middleware/auth.middleware.js";

const router = Router();

// Ai cũng gọi được - dùng để đăng nhập
router.post("/login", AuthController.login);

// Chỉ người đã đăng nhập VÀ có role ADMIN mới được tạo tài khoản mới
router.post("/register", xacThucToken, phanQuyen("ADMIN"), AuthController.register);

// Chỉ cần đăng nhập (bất kỳ role nào) là xem được thông tin của chính mình
router.get("/me", xacThucToken, AuthController.layThongTinCaNhan);
router.put("/profile", xacThucToken, AuthController.capNhatThongTinCaNhan);

export default router;

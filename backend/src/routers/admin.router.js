import { Router } from "express";
import AdminController from "../controllers/admin.controller.js";
import { xacThucToken, phanQuyen } from "../middleware/auth.middleware.js";
import { uploadExcel } from "../middleware/upload_excel.middleware.js";

const router = Router();

// Tất cả các route quản trị đều yêu cầu phải đăng nhập và là ADMIN
router.use(xacThucToken, phanQuyen("ADMIN"));

router.get("/tai-khoan", AdminController.layDanhSachTaiKhoan);
router.get("/lich-su", AdminController.layLichSuHeThong);
router.post("/tai-khoan", AdminController.taoTaiKhoan);
router.post("/tai-khoan/batch-ca-lam", AdminController.ganCaLamHangLoat);
router.post("/tai-khoan/:id/cap-bac", AdminController.thayDoiCapBacTaiKhoan);
router.put("/tai-khoan/:id", AdminController.capNhatTaiKhoan);
router.delete("/tai-khoan/:id", AdminController.xoaTaiKhoan);
router.get("/nhan-vien/mau-excel", AdminController.taiFileMauExcel);
router.post("/nhan-vien/nhap-excel", uploadExcel.single("file"), AdminController.nhapExcel);

export default router;

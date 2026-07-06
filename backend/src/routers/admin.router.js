import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { xacThucToken, phanQuyen } from "../middleware/auth.middleware.js";
import { uploadExcel } from "../middleware/uploadExcel.middleware.js";

const router = Router();

// Tất cả các route quản trị đều yêu cầu phải đăng nhập và là ADMIN
router.use(xacThucToken, phanQuyen("ADMIN"));

router.get("/tai-khoan", adminController.layDanhSachTaiKhoan);
router.post("/tai-khoan", adminController.taoTaiKhoan);
router.post("/tai-khoan/import-excel", uploadExcel.single("file"), adminController.nhapTaiKhoanTuExcel);
router.post("/tai-khoan/:id/cap-bac", adminController.thayDoiCapBacTaiKhoan);
router.put("/tai-khoan/:id", adminController.capNhatTaiKhoan);
router.delete("/tai-khoan/:id", adminController.xoaTaiKhoan);
router.get("/nhan-vien/mau-excel", adminController.taiFileMauExcel);
router.post("/nhan-vien/nhap-excel", uploadExcel.single("file"), adminController.nhapExcelNhanVien);

export default router;

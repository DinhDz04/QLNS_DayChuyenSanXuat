import { Router } from "express";
import CaLamController from "../controllers/ca_lam.controller.js";
import { xacThucToken, phanQuyen } from "../middleware/auth.middleware.js";

const router = Router();

router.use(xacThucToken);

// ================= LỊCH LÀM VIỆC ROUTES =================
router.get("/lich-lam", CaLamController.layDanhSachLichLam);
router.post("/lich-lam", phanQuyen("ADMIN", "LEADER_KHU_VUC"), CaLamController.taoLichLam);
router.put("/lich-lam/:id", phanQuyen("ADMIN", "LEADER_KHU_VUC"), CaLamController.capNhatLichLam);
router.delete("/lich-lam/:id", phanQuyen("ADMIN"), CaLamController.xoaLichLam);
router.post("/lich-lam/:id/xoay-ca", phanQuyen("ADMIN", "LEADER_KHU_VUC"), CaLamController.xoayCaLichLam);

// ================= CA LÀM VIỆC ROUTES =================
// Xem ca làm (tất cả vai trò sau khi đăng nhập đều được phép)
router.get("/", CaLamController.layDanhSachCaLam);
router.get("/:id", CaLamController.layCaLamTheoId);

// Quản lý ca làm (chỉ ADMIN và LEADER_KHU_VUC được phép)
router.post("/", phanQuyen("ADMIN", "LEADER_KHU_VUC"), CaLamController.taoCaLam);
router.put("/:id", phanQuyen("ADMIN", "LEADER_KHU_VUC"), CaLamController.capNhatCaLam);
router.delete("/:id", phanQuyen("ADMIN"), CaLamController.xoaCaLam);

export default router;

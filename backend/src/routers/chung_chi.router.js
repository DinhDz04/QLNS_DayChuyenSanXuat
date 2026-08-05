import { Router } from "express";
import ChungChiController from "../controllers/chung_chi.controller.js";
import { xacThucToken, phanQuyen } from "../middleware/auth.middleware.js";

const router = Router();

router.use(xacThucToken);

// ================= GÁN CHỨNG CHỈ NHÂN VIÊN ROUTES =================
router.get("/nhan-vien", ChungChiController.layDanhSachChungChiNhanVien);
router.post("/nhan-vien", phanQuyen("ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"), ChungChiController.ganChungChiNhanVien);
router.put("/nhan-vien/:id", phanQuyen("ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"), ChungChiController.capNhatChungChiNhanVien);
router.delete("/nhan-vien/:id", phanQuyen("ADMIN", "LEADER_KHU_VUC"), ChungChiController.xoaChungChiNhanVien);

// ================= DANH MỤC CHỨNG CHỈ ROUTES =================
router.get("/", ChungChiController.layDanhSachChungChi);
router.get("/:id", ChungChiController.layChungChiTheoId);

router.post("/", phanQuyen("ADMIN", "LEADER_KHU_VUC", "MANAGER"), ChungChiController.taoChungChi);
router.put("/:id", phanQuyen("ADMIN", "LEADER_KHU_VUC", "MANAGER"), ChungChiController.capNhatChungChi);
router.delete("/:id", phanQuyen("ADMIN"), ChungChiController.xoaChungChi);

export default router;

import express from "express";
import cors from "cors";

import authRouter from "./routers/auth.router.js";
import adminRouter from "./routers/admin.router.js";
import khuVucRouter from "./routers/khu_vuc.router.js";
import dayChuyenRouter from "./routers/day_chuyen.router.js";
import nhanVienRouter from "./routers/nhan_vien.router.js";
import caLamRouter from "./routers/ca_lam.router.js";

import { notFoundHandler } from "./middleware/not_found.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Backend QLNS đang hoạt động"
    });
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/khu-vuc", khuVucRouter);
app.use("/api/day-chuyen", dayChuyenRouter);
app.use("/api/nhan-vien", nhanVienRouter);
app.use("/api/ca-lam", caLamRouter);

// Khi thêm module mới (day_chuyen, chung_chi, ca_lam_viec, ...)
// chỉ cần tạo router tương ứng rồi app.use ở đây theo cùng pattern

// 2 middleware này LUÔN đặt cuối cùng, sau tất cả các route ở trên
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

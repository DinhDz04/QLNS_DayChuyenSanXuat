import express from "express";
import cors from "cors";

import authRouter from "./routers/auth.router.js";
import adminRouter from "./routers/admin.router.js";
// import nhanVienRouter from "./routers/nhanVien.router.js"; // TODO: làm ở bước sau

import { notFoundHandler } from "./middleware/notFound.middleware.js";
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
// app.use("/api/nhan-vien", nhanVienRouter);

// Khi thêm module mới (day_chuyen, chung_chi, ca_lam_viec, ...)
// chỉ cần tạo router tương ứng rồi app.use ở đây theo cùng pattern

// 2 middleware này LUÔN đặt cuối cùng, sau tất cả các route ở trên
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

import { xacMinhToken } from "../utils/jwt.util.js";

/**
 * MIDDLEWARE 1: xacThucToken
 * Việc của middleware này: kiểm tra xem request có kèm token hợp lệ không.
 * - Nếu có và đúng -> gắn thông tin người dùng vào req.nguoiDung, rồi next()
 * - Nếu không có / sai / hết hạn -> chặn lại, trả lỗi 401
 *
 * Client cần gửi token theo dạng header:
 *   Authorization: Bearer <token>
 */
export function xacThucToken(req, res, next) {
    const authHeader = req.headers["authorization"]; // ví dụ: "Bearer eyJhbGciOi..."

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Chưa đăng nhập hoặc thiếu token"
        });
    }

    const token = authHeader.split(" ")[1]; // lấy phần sau chữ "Bearer "

    try {
        const payload = xacMinhToken(token); // { id, ten_dang_nhap, role, iat, exp }
        req.nguoiDung = payload; // các middleware/controller phía sau dùng req.nguoiDung
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Token không hợp lệ hoặc đã hết hạn"
        });
    }
}

/**
 * MIDDLEWARE 2: phanQuyen (authorization theo role)
 * Đây là 1 "hàm tạo ra middleware" - dùng như sau:
 *
 *   router.delete("/nhan-vien/:id", xacThucToken, phanQuyen("ADMIN"), controller.xoa)
 *   router.get("/bao-cao", xacThucToken, phanQuyen("ADMIN", "LEADER_KHU_VUC"), controller.xemBaoCao)
 *
 * Bắt buộc phải chạy xacThucToken TRƯỚC middleware này, vì nó cần req.nguoiDung.role
 */
export function phanQuyen(...cacRoleDuocPhep) {
    return (req, res, next) => {
        if (!req.nguoiDung) {
            return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
        }

        if (!cacRoleDuocPhep.includes(req.nguoiDung.role)) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền thực hiện thao tác này"
            });
        }

        next();
    };
}

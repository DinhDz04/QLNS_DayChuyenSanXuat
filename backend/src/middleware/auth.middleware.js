import { xacMinhToken } from "../utils/jwt.util.js";
import ApiError from "../utils/api_error.js";

/**
 * MIDDLEWARE 1: xacThucToken
 * Kiểm tra xem request có kèm token hợp lệ không.
 */
export function xacThucToken(req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new ApiError(401, "Chưa đăng nhập hoặc thiếu token"));
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = xacMinhToken(token);
        req.nguoiDung = payload;
        next();
    } catch (err) {
        next(new ApiError(401, "Token không hợp lệ hoặc đã hết hạn"));
    }
}

/**
 * MIDDLEWARE 2: phanQuyen (authorization theo role)
 */
export function phanQuyen(...cacRoleDuocPhep) {
    return (req, res, next) => {
        if (!req.nguoiDung) {
            return next(new ApiError(401, "Chưa đăng nhập"));
        }

        if (!cacRoleDuocPhep.includes(req.nguoiDung.role)) {
            return next(new ApiError(403, "Bạn không có quyền thực hiện thao tác này"));
        }

        next();
    };
}

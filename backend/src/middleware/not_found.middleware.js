import ApiError from "../utils/api_error.js";

export function notFoundHandler(req, res, next) {
    next(new ApiError(404, `Không tìm thấy đường dẫn: ${req.method} ${req.originalUrl}`));
}

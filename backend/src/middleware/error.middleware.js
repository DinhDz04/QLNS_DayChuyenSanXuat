export function errorHandler(err, req, res, next) {
    console.error("💥 Error Logged:", err);

    const statusCode = err.statusCode || 500;
    const message = err.message || "Đã có lỗi xảy ra ở server";

    res.status(statusCode).json({
        success: false,
        message,
        data: null
    });
}

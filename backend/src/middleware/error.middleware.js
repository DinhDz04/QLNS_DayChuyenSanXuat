// Middleware này phải có đủ 4 tham số (err, req, res, next) thì Express
// mới nhận diện đây là "error handling middleware".
export function errorHandler(err, req, res, next) {
    console.error(err); // ghi log lỗi ra console để dev debug

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Đã có lỗi xảy ra ở server"
    });
}

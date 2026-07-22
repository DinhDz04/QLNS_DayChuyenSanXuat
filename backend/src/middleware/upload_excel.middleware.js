import multer from "multer";
import ApiError from "../utils/api_error.js";

// Lưu file tạm trong bộ nhớ (RAM) để đọc luôn, không cần ghi ra ổ đĩa
const luuTru = multer.memoryStorage();

function locFile(req, file, cb) {
    // Trình duyệt/hệ điều hành đôi khi báo sai mimetype cho file Excel
    // nên ta kiểm tra chủ yếu theo ĐUÔI FILE cho chắc chắn.
    const tenFile = file.originalname.toLowerCase();
    const duoiHopLe = tenFile.endsWith(".xlsx") || tenFile.endsWith(".xls");

    if (duoiHopLe) {
        cb(null, true);
    } else {
        cb(new ApiError(400, "Chỉ chấp nhận file Excel (.xlsx hoặc .xls)"));
    }
}

export const uploadExcel = multer({
    storage: luuTru,
    fileFilter: locFile,
    limits: { fileSize: 5 * 1024 * 1024 } // tối đa 5MB
});

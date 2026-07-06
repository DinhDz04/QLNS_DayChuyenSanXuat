import multer from "multer";

// Lưu file tạm trong bộ nhớ (RAM) để đọc luôn, không cần ghi ra ổ đĩa
// vì ta chỉ cần đọc dữ liệu Excel rồi lưu vào database, không cần giữ lại file.
const luuTru = multer.memoryStorage();

function locFile(req, file, cb) {
    // Trình duyệt/hệ điều hành đôi khi báo sai mimetype cho file Excel
    // (vd: báo là "application/octet-stream" thay vì đúng loại chuẩn),
    // nên ta kiểm tra chủ yếu theo ĐUÔI FILE cho chắc chắn, không chỉ dựa vào mimetype.
    const tenFile = file.originalname.toLowerCase();
    const duoiHopLe = tenFile.endsWith(".xlsx") || tenFile.endsWith(".xls");

    if (duoiHopLe) {
        cb(null, true);
    } else {
        cb(new Error("Chỉ chấp nhận file Excel (.xlsx hoặc .xls)"));
    }
}

export const uploadExcel = multer({
    storage: luuTru,
    fileFilter: locFile,
    limits: { fileSize: 5 * 1024 * 1024 } // tối đa 5MB
});
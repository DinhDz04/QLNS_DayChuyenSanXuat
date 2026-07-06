import { goiApi } from "../../api.js";

// Gửi file Excel lên server để tạo hàng loạt tài khoản + nhân viên
// file: đối tượng File lấy từ thẻ <input type="file">
export async function nhapExcelNhanVien(file) {
    const formData = new FormData();
    formData.append("file", file);

    return goiApi("/admin/nhan-vien/nhap-excel", {
        method: "POST",
        body: formData
    });
}

import { createContext, useContext, useEffect, useState } from "react";
import { layThongTinCaNhan } from "../servives/admin/auth.service.js";

/**
 * AuthContext giúp mọi component trong app đều biết được:
 * - nguoiDung: thông tin người đang đăng nhập (hoặc null nếu chưa đăng nhập)
 * - dangTai: đang kiểm tra token hay chưa (tránh nháy màn hình lúc mới load trang)
 * - dangNhapThanhCong(token, nguoiDung): gọi sau khi API login trả về thành công
 * - dangXuat(): xoá phiên đăng nhập
 *
 * Dùng Context để không phải "truyền tay" (props drilling) thông tin người dùng
 * qua nhiều tầng component.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [nguoiDung, setNguoiDung] = useState(null);
    const [dangTai, setDangTai] = useState(true);

    // Mỗi khi app khởi động (F5 lại trang), kiểm tra xem còn token hợp lệ không
    useEffect(() => {
        async function kiemTraPhienDangNhap() {
            const token = localStorage.getItem("token");

            if (!token) {
                setDangTai(false);
                return;
            }

            try {
                const ketQua = await layThongTinCaNhan();
                setNguoiDung(ketQua.data);
            } catch (err) {
                // Token hết hạn / không hợp lệ -> xoá luôn cho sạch
                localStorage.removeItem("token");
                setNguoiDung(null);
            } finally {
                setDangTai(false);
            }
        }

        kiemTraPhienDangNhap();
    }, []);

    function dangNhapThanhCong(token, thongTinNguoiDung) {
        localStorage.setItem("token", token);
        setNguoiDung(thongTinNguoiDung);
    }

    function dangXuat() {
        localStorage.removeItem("token");
        setNguoiDung(null);
    }

    const giaTri = { nguoiDung, dangTai, dangNhapThanhCong, dangXuat };

    return <AuthContext.Provider value={giaTri}>{children}</AuthContext.Provider>;
}

// Hook tiện dùng: thay vì import useContext + AuthContext ở mọi nơi,
// chỉ cần gọi useAuth() là lấy được nguoiDung, dangXuat,...
export function useAuth() {
    return useContext(AuthContext);
}

import { createContext, useContext, useEffect, useState } from "react";
import { layThongTinCaNhan } from "../features/auth/services/auth.service.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [nguoiDung, setNguoiDung] = useState(null);
    const [dangTai, setDangTai] = useState(true);

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
            localStorage.removeItem("token");
            setNguoiDung(null);
        } finally {
            setDangTai(false);
        }
    }

    useEffect(() => {
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

    const giaTri = { nguoiDung, dangTai, dangNhapThanhCong, dangXuat, taiLaiThongTin: kiemTraPhienDangNhap };

    return <AuthContext.Provider value={giaTri}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}

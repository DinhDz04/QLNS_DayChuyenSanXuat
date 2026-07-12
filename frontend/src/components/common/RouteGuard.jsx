import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function RouteGuard({ children, roles }) {
    const { nguoiDung, dangTai } = useAuth();

    if (dangTai) {
        return <div className="man-hinh-dang-tai">Đang kiểm tra đăng nhập...</div>;
    }

    if (!nguoiDung) {
        return <Navigate to="/dang-nhap" replace />;
    }

    if (roles && !roles.includes(nguoiDung.role)) {
        return (
            <div className="man-hinh-dang-tai">
                Bạn không có quyền truy cập trang này.
            </div>
        );
    }

    return children;
}

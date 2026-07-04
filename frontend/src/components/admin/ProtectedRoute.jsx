import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

/**
 * Bọc quanh 1 trang cần đăng nhập mới xem được.
 * Nếu chưa đăng nhập -> chuyển về trang đăng nhập.
 * Nếu không đủ quyền -> thông báo từ chối.
 */
export default function BaoVeRoute({ children, cacRoleChoPhep }) {
    const { nguoiDung, dangTai } = useAuth();

    // Đang kiểm tra token lần đầu load trang
    if (dangTai) {
        return <div className="man-hinh-dang-tai">Đang kiểm tra đăng nhập...</div>;
    }

    // Chưa đăng nhập -> về trang đăng nhập
    if (!nguoiDung) {
        return <Navigate to="/dang-nhap" replace />;
    }

    // Có yêu cầu vai trò cụ thể mà vai trò hiện tại không được phép -> chặn
    if (cacRoleChoPhep && !cacRoleChoPhep.includes(nguoiDung.role)) {
        return (
            <div className="man-hinh-dang-tai">
                Bạn không có quyền truy cập trang này.
            </div>
        );
    }

    return children;
}

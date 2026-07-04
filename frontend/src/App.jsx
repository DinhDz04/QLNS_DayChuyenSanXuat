import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import BaoVeRoute from "./components/admin/ProtectedRoute.jsx";
import DangNhap from "./pages/admin/DangNhap.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import QuanLyTaiKhoan from "./pages/admin/QuanLyTaiKhoan.jsx";

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Vào "/" tự động chuyển sang trang đăng nhập */}
                    <Route path="/" element={<Navigate to="/dang-nhap" replace />} />

                    <Route path="/dang-nhap" element={<DangNhap />} />

                    <Route
                        path="/dashboard"
                        element={
                            <BaoVeRoute>
                                <Dashboard />
                            </BaoVeRoute>
                        }
                    />

                    {/* Route quản lý tài khoản dành riêng cho ADMIN */}
                    <Route
                        path="/admin/tai-khoan"
                        element={
                            <BaoVeRoute cacRoleChoPhep={["ADMIN"]}>
                                <QuanLyTaiKhoan />
                            </BaoVeRoute>
                        }
                    />

                    {/* Đường dẫn không tồn tại -> quay về trang đăng nhập */}
                    <Route path="*" element={<Navigate to="/dang-nhap" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

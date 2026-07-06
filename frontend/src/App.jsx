import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import BaoVeRoute from "./components/admin/ProtectedRoute.jsx";
import DangNhap from "./pages/admin/DangNhap.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import QuanLyTaiKhoan from "./pages/admin/QuanLyTaiKhoan.jsx";
import QuanLyKhuVuc from "./pages/admin/QuanLyKhuVuc.jsx";
import QuanLyDayChuyen from "./pages/admin/QuanLyDayChuyen.jsx";
import ChiTietDayChuyen from "./pages/admin/ChiTietDayChuyen.jsx";
import Layout from "./pages/layout/Layout.jsx";

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
                                <Layout>
                                    <Dashboard />
                                </Layout>
                            </BaoVeRoute>
                        }
                    />

                    {/* Route quản lý tài khoản dành riêng cho ADMIN */}
                    <Route
                        path="/admin/tai-khoan"
                        element={
                            <BaoVeRoute cacRoleChoPhep={["ADMIN"]}>
                                <Layout>
                                    <QuanLyTaiKhoan />
                                </Layout>
                            </BaoVeRoute>
                        }
                    />

                    {/* Route quản lý khu vực */}
                    <Route
                        path="/admin/khu-vuc"
                        element={
                            <BaoVeRoute cacRoleChoPhep={["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE"]}>
                                <Layout>
                                    <QuanLyKhuVuc />
                                </Layout>
                            </BaoVeRoute>
                        }
                    />

                    {/* Route quản lý dây chuyền */}
                    <Route
                        path="/admin/day-chuyen"
                        element={
                            <BaoVeRoute cacRoleChoPhep={["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE"]}>
                                <Layout>
                                    <QuanLyDayChuyen />
                                </Layout>
                            </BaoVeRoute>
                        }
                    />

                    {/* Route chi tiết dây chuyền */}
                    <Route
                        path="/admin/day-chuyen/:id"
                        element={
                            <BaoVeRoute cacRoleChoPhep={["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE"]}>
                                <Layout>
                                    <ChiTietDayChuyen />
                                </Layout>
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

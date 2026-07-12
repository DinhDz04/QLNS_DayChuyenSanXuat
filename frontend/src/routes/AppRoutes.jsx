import { Routes, Route, Navigate } from "react-router-dom";
import RouteGuard from "../components/common/RouteGuard.jsx";
import Layout from "../components/common/Layout.jsx";

// Import pages
import DangNhap from "../features/auth/pages/DangNhap.jsx";
import Dashboard from "../features/dashboard/pages/Dashboard.jsx";
import Profile from "../features/nhan-su/pages/Profile.jsx";
import QuanLyTaiKhoan from "../features/nhan-su/pages/QuanLyTaiKhoan.jsx";
import QuanLyKhuVuc from "../features/khu-vuc/pages/QuanLyKhuVuc.jsx";
import BanDoKhuVuc from "../features/khu-vuc/pages/BanDoKhuVuc.jsx";
import BanDoTongHop from "../features/khu-vuc/pages/BanDoTongHop.jsx";
import QuanLyDayChuyen from "../features/day-chuyen/pages/QuanLyDayChuyen.jsx";
import ChiTietDayChuyen from "../features/day-chuyen/pages/ChiTietDayChuyen.jsx";

export default function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/dang-nhap" element={<DangNhap />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Private Routes (Chung cho tất cả tài khoản đã đăng nhập) */}
            <Route element={<RouteGuard><Layout /></RouteGuard>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Routes dành riêng cho ADMIN */}
            <Route element={<RouteGuard roles={["ADMIN"]}><Layout /></RouteGuard>}>
                <Route path="/admin/tai-khoan" element={<QuanLyTaiKhoan />} />
            </Route>

            {/* Routes dành cho ADMIN, LEADER_KHU_VUC, LEADER_LINE và MANAGER */}
            <Route element={<RouteGuard roles={["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"]}><Layout /></RouteGuard>}>
                <Route path="/admin/khu-vuc" element={<QuanLyKhuVuc />} />
                <Route path="/admin/khu-vuc/:id/ban-do" element={<BanDoKhuVuc />} />
                <Route path="/admin/ban-do" element={<BanDoTongHop />} />
                <Route path="/admin/day-chuyen" element={<QuanLyDayChuyen />} />
                <Route path="/admin/day-chuyen/:id" element={<ChiTietDayChuyen />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dang-nhap" replace />} />
        </Routes>
    );
}

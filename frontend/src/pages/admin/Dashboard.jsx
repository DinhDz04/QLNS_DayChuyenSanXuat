import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import RoleBadge, { TEN_ROLE } from "../../components/admin/RoleBadge.jsx";

const CAC_KHU_VUC_CHUC_NANG = [
    {
        tieuDe: "Quản trị hệ thống",
        moTa: "Tạo tài khoản, phân quyền, cấu hình toàn hệ thống.",
        choPhep: ["ADMIN"],
        duongDan: "/admin/tai-khoan"
    },
    {
        tieuDe: "Nhập nhân viên bằng Excel",
        moTa: "Tải file Excel để tạo hàng loạt tài khoản và hồ sơ nhân viên.",
        choPhep: ["ADMIN"],
        duongDan: "/admin/nhan-vien/nhap-excel"
    },
    {
        tieuDe: "Báo cáo khu vực",
        moTa: "Xem tình hình nhân sự của toàn bộ khu vực phụ trách.",
        choPhep: ["ADMIN", "LEADER_KHU_VUC"]
    },
    {
        tieuDe: "Phân công dây chuyền",
        moTa: "Sắp xếp nhân sự vào từng công đoạn, từng ca làm việc.",
        choPhep: ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE"]
    },
    {
        tieuDe: "Đăng ký tăng ca & thông báo",
        moTa: "đăng ký tăng ca cho nhân viên",
        choPhep: ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE"]
    }
];

export default function Dashboard() {
    const { nguoiDung, dangXuat } = useAuth();
    const navigate = useNavigate();

    function xuLyDangXuat() {
        dangXuat();
        navigate("/dang-nhap");
    }

    return (
        <div>
            <main className="noi-dung-chinh">
                <div className="the-thong-tin">
                    <h3>Thông tin tài khoản</h3>
                    <p style={{ margin: 0, fontSize: 14 }}>
                        Xin chào <strong>{nguoiDung.ten_dang_nhap}</strong>, bạn đang đăng
                        nhập với vai trò <strong>{TEN_ROLE[nguoiDung.role] || nguoiDung.role}</strong>.
                    </p>
                </div>

                <div className="the-thong-tin">
                    <h3>Các khu vực chức năng (minh hoạ phân quyền theo vai trò)</h3>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: -6 }}>
                        Ô nào sáng lên nghĩa là vai trò hiện tại được phép truy cập. Khi làm
                        chức năng thật, hãy áp dụng đúng logic này ở cả frontend (ẩn nút bấm)
                        lẫn backend (middleware <code>phanQuyen</code>) — vì phía frontend chỉ
                        có tác dụng cho trải nghiệm người dùng, không thay được bảo mật thật sự.
                    </p>

                    <div className="luoi-quyen">
                        {CAC_KHU_VUC_CHUC_NANG.map((khuVuc) => {
                            const duocPhep = khuVuc.choPhep.includes(nguoiDung.role);
                            const coDuongDan = duocPhep && khuVuc.duongDan;
                            return (
                                <div
                                    key={khuVuc.tieuDe}
                                    className={`o-quyen ${duocPhep ? "duoc-phep" : ""} ${coDuongDan ? "the-bam-duoc" : ""}`}
                                    onClick={() => coDuongDan && navigate(khuVuc.duongDan)}
                                    style={coDuongDan ? { cursor: "pointer" } : {}}
                                >
                                    <h4>{khuVuc.tieuDe}</h4>
                                    <p>{khuVuc.moTa}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}

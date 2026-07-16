import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import RoleBadge, { TEN_ROLE } from "../../../components/ui/Badge.jsx";
import { layDanhSachKhuVuc, layBanDoKhuVuc } from "../../khu-vuc/services/khuVuc.service.js";

const GRID_SIZE = 12;

const CAC_KHU_VUC_CHUC_NANG = [
    {
        tieuDe: "Bản đồ khu vực",
        moTa: "Xem tổng quan khu vực.",
        choPhep: ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"],
        duongDan: "/admin/ban-do"
    },
    {
        tieuDe: "Quản trị hệ thống",
        moTa: "Tạo tài khoản, phân quyền, cấu hình toàn hệ thống.",
        choPhep: ["ADMIN"],
        duongDan: "/admin/tai-khoan"
    },
    {
        tieuDe: "Quản lý khu vực",
        moTa: "Quản lý khu vực sản xuất, khách hàng và gán leader khu vực.",
        choPhep: ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"],
        duongDan: "/admin/khu-vuc"
    },
    {
        tieuDe: "Phân công dây chuyền",
        moTa: "Sắp xếp nhân sự vào từng công đoạn, từng ca làm việc.",
        choPhep: ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"],
        duongDan: "/admin/day-chuyen"
    },    
    {
        tieuDe: "Quản lý nhan viên",
        moTa: "Thêm skill , thăng cấp, điều chuyển nhân sự.",
        choPhep: ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"],
        duongDan: "/admin/day-chuyen"
    }
];

export default function Dashboard() {
    const { nguoiDung } = useAuth();
    const navigate = useNavigate();

    const [danhSachKhuVuc, setDanhSachKhuVuc] = useState([]);
    const [selectedKhuVucId, setSelectedKhuVucId] = useState("");
    const [congDoanList, setCongDoanList] = useState([]);
    
    const [dangTaiDs, setDangTaiDs] = useState(true);
    const [dangTaiMap, setDangTaiMap] = useState(false);

    useEffect(() => {
        if (nguoiDung && ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"].includes(nguoiDung.role)) {
            taiDanhSachKhuVuc();
        }
    }, [nguoiDung]);

    async function taiDanhSachKhuVuc() {
        setDangTaiDs(true);
        try {
            const res = await layDanhSachKhuVuc();
            if (res.success && res.data.length > 0) {
                setDanhSachKhuVuc(res.data);
                setSelectedKhuVucId(res.data[0].id);
                taiMap(res.data[0].id);
            }
        } catch (err) {
            console.error("Lỗi khi tải danh sách khu vực ở dashboard:", err);
        } finally {
            setDangTaiDs(false);
        }
    }

    async function taiMap(kvId) {
        if (!kvId) return;
        setDangTaiMap(true);
        try {
            const res = await layBanDoKhuVuc(kvId);
            if (res.success) {
                const list = res.data.cong_doan.map(cd => ({
                    ...cd,
                    vi_tri_x: cd.vi_tri_x !== null ? Number(cd.vi_tri_x) : null,
                    vi_tri_y: cd.vi_tri_y !== null ? Number(cd.vi_tri_y) : null,
                    xoay: cd.xoay !== null ? Number(cd.xoay) : 0
                }));
                setCongDoanList(list);
            }
        } catch (err) {
            console.error("Lỗi khi tải bản đồ ở dashboard:", err);
        } finally {
            setDangTaiMap(false);
        }
    }

    function handleKhuVucChange(e) {
        const val = e.target.value;
        setSelectedKhuVucId(val);
        setCongDoanList([]);
        taiMap(val);
    }

    const congDoanDaDat = congDoanList.filter(cd => cd.vi_tri_x !== null);
    const coQuyenXemSaBan = nguoiDung && ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"].includes(nguoiDung.role);

    return (
        <div>
            <main className="noi-dung-chinh">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <div className="the-thong-tin" style={{ margin: 0 }}>
                        <h3>Thông tin tài khoản</h3>
                        <p style={{ margin: 0, fontSize: 14 }}>
                            Xin chào <strong>{nguoiDung.ho_ten || nguoiDung.ten_dang_nhap}</strong>, bạn đang đăng
                            nhập với vai trò <strong>{TEN_ROLE[nguoiDung.role] || nguoiDung.role}</strong>.
                        </p>
                        <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                            Mã nhân sự: <strong>{nguoiDung.ma_nhan_vien || "-"}</strong>
                        </p>
                    </div>

                    <div className="the-thong-tin" style={{ margin: 0 }}>
                        <h3>Lối tắt chức năng</h3>
                        <div className="luoi-quyen" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px", marginTop: "8px" }}>
                            {CAC_KHU_VUC_CHUC_NANG.map((khuVuc) => {
                                const duocPhep = khuVuc.choPhep.includes(nguoiDung.role);
                                return (
                                    <div
                                        key={khuVuc.tieuDe}
                                        className={`o-quyen ${duocPhep ? "duoc-phep the-bam-duoc" : ""}`}
                                        onClick={() => duocPhep && navigate(khuVuc.duongDan)}
                                        style={{ padding: "8px", textAlign: "center", cursor: duocPhep ? "pointer" : "default" }}
                                    >
                                        <h5 style={{ margin: "0 0 4px 0", fontSize: "12px" }}>{khuVuc.tieuDe}</h5>
                                        <p style={{ margin: 0, fontSize: "10px", WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                            {khuVuc.moTa}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

            
            </main>
        </div>
    );
}

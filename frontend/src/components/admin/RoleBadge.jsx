const TEN_ROLE = {
    ADMIN: "Quản trị viên",
    LEADER_KHU_VUC: "Trưởng khu vực",
    LEADER_LINE: "Trưởng dây chuyền",
    NHAN_VIEN: "Nhân viên"
};

export default function RoleBadge({ role }) {
    return (
        <span className="badge-role" data-role={role}>
            {TEN_ROLE[role] || role}
        </span>
    );
}

export { TEN_ROLE };

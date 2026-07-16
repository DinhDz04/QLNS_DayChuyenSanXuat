import pool from "./config/db.js";
import bcrypt from "bcrypt";

async function main() {
    console.log("=== BẮT ĐẦU TẠO DỮ LIỆU MẪU KỸ NĂNG ===");
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Thêm các chứng chỉ kỹ năng mẫu
        const skills = [
            { ten: "Lắp ráp", mo_ta: "Chứng chỉ kỹ năng lắp ráp linh kiện cơ bản" },
            { ten: "Cắm tay", mo_ta: "Chứng chỉ kỹ năng cắm linh kiện DIP lên board" },
            { ten: "Vận hành máy", mo_ta: "Chứng chỉ vận hành máy SMT/Reflow" },
            { ten: "QC", mo_ta: "Chứng chỉ kiểm tra chất lượng linh kiện đầu ra" }
        ];

        const skillIdMap = {};
        for (const skill of skills) {
            const [rows] = await connection.query("SELECT id FROM chung_chi WHERE ten_chung_chi = ? LIMIT 1", [skill.ten]);
            if (rows.length > 0) {
                skillIdMap[skill.ten] = rows[0].id;
                console.log(`Đã tồn tại chứng chỉ: ${skill.ten}`);
            } else {
                const [result] = await connection.query(
                    "INSERT INTO chung_chi (ten_chung_chi, mo_ta) VALUES (?, ?)",
                    [skill.ten, skill.mo_ta]
                );
                skillIdMap[skill.ten] = result.insertId;
                console.log(`Đã tạo chứng chỉ mới: ${skill.ten}`);
            }
        }

        // 2. Tạo 10 nhân viên test có tay nghề khác nhau
        const userSample = [
            { user: "nv_laprap_a", name: "Nguyễn Lắp Ráp A", skill: "Lắp ráp", cap_do: 1, phone: "0901234561" },
            { user: "nv_laprap_b", name: "Trần Lắp Ráp B", skill: "Lắp ráp", cap_do: 2, phone: "0901234562" },
            { user: "nv_camtay_a", name: "Lê Cắm Tay A", skill: "Cắm tay", cap_do: 1, phone: "0901234563" },
            { user: "nv_camtay_b", name: "Phạm Cắm Tay B", skill: "Cắm tay", cap_do: 2, phone: "0901234564" },
            { user: "nv_may_a", name: "Hoàng Vận Hành Máy A", skill: "Vận hành máy", cap_do: 1, phone: "0901234565" },
            { user: "nv_may_b", name: "Vũ Vận Hành Máy B", skill: "Vận hành máy", cap_do: 2, phone: "0901234566" },
            { user: "nv_qc_a", name: "Đặng Kiểm Hàng A", skill: "QC", cap_do: 1, phone: "0901234567" },
            { user: "nv_qc_b", name: "Bùi Kiểm Hàng B", skill: "QC", cap_do: 2, phone: "0901234568" },
            { user: "nv_phothong_a", name: "Nguyễn Phổ Thông A", skill: null, cap_do: null, phone: "0901234569" },
            { user: "nv_phothong_b", name: "Trần Phổ Thông B", skill: null, cap_do: null, phone: "0901234570" }
        ];

        const matKhauHash = await bcrypt.hash("123456", 10);

        for (let i = 0; i < userSample.length; i++) {
            const u = userSample[i];
            
            const [existingTk] = await connection.query("SELECT id FROM tai_khoan WHERE ten_dang_nhap = ? LIMIT 1", [u.user]);
            let tkId;
            if (existingTk.length > 0) {
                tkId = existingTk[0].id;
                console.log(`Đã tồn tại tài khoản: ${u.user}`);
            } else {
                const [resTk] = await connection.query(
                    "INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, email, role, trang_thai) VALUES (?, ?, ?, 'NHAN_VIEN', 1)",
                    [u.user, matKhauHash, `${u.user}@qlns.local`]
                );
                tkId = resTk.insertId;
                console.log(`Đã tạo tài khoản mới: ${u.user}`);
            }

            const [existingNv] = await connection.query("SELECT id FROM nhan_vien WHERE tai_khoan_id = ? LIMIT 1", [tkId]);
            let nvId;
            if (existingNv.length > 0) {
                nvId = existingNv[0].id;
                await connection.query(
                    "UPDATE nhan_vien SET ho_ten = ?, so_dien_thoai = ?, chuc_vu = 'NHAN_VIEN' WHERE id = ?",
                    [u.name, u.phone, nvId]
                );
            } else {
                const maNV = `DP_TEST_${String(i + 1).padStart(2, "0")}`;
                const [resNv] = await connection.query(
                    `INSERT INTO nhan_vien (ma_nhan_vien, ho_ten, gioi_tinh, so_dien_thoai, ngay_vao_lam, tai_khoan_id, chuc_vu, trang_thai)
                     VALUES (?, ?, 'Nam', ?, ?, ?, 'NHAN_VIEN', 'DANG_LAM')`,
                    [maNV, u.name, u.phone, new Date(), tkId]
                );
                nvId = resNv.insertId;
                console.log(`Đã tạo nhân viên mới: ${u.name} (${maNV})`);
            }

            if (u.skill) {
                const ccId = skillIdMap[u.skill];
                const [existingCcNv] = await connection.query(
                    "SELECT id FROM chung_chi_nhan_vien WHERE nhan_vien_id = ? AND chung_chi_id = ? LIMIT 1",
                    [nvId, ccId]
                );

                if (existingCcNv.length > 0) {
                    await connection.query(
                        "UPDATE chung_chi_nhan_vien SET cap_do = ?, trang_thai = 'HIEU_LUC' WHERE id = ?",
                        [u.cap_do, existingCcNv[0].id]
                    );
                } else {
                    await connection.query(
                        `INSERT INTO chung_chi_nhan_vien (nhan_vien_id, chung_chi_id, cap_do, ngay_cap, trang_thai)
                         VALUES (?, ?, ?, ?, 'HIEU_LUC')`,
                        [nvId, ccId, u.cap_do, new Date()]
                    );
                    console.log(`Đã gán chứng chỉ: ${u.skill} (Cấp độ ${u.cap_do}) cho ${u.name}`);
                }
            }
        }

        await connection.commit();
        console.log("=== ĐÃ HOÀN THÀNH TẠO DỮ LIỆU MẪU KỸ NĂNG ===");
    } catch (err) {
        await connection.rollback();
        console.error("Lỗi khi tạo dữ liệu mẫu:", err);
    } finally {
        connection.release();
    }
}

main().then(() => process.exit(0));

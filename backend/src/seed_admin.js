/**
 * Script khởi tạo/cập nhật danh sách tài khoản Quản trị & Trưởng đơn vị (Admin & Leaders)
 * 
 * Cách chạy (đứng ở thư mục backend):
 *   node src/seed_admin.js
 */
import bcrypt from "bcrypt";
import pool from "./config/db.js";

const danhSachTaiKhoan = [
    {
        ten_dang_nhap: "admin",
        mat_khau: "Admin@123",
        email: "admin@qlns.local",
        role: "ADMIN",
        ho_ten: "Quản Trị Viên (Admin)",
        ma_nhan_vien: "NV_ADMIN_01",
        chuc_vu: "ADMIN"
    },
    {
        ten_dang_nhap: "leader",
        mat_khau: "Leader@123",
        email: "leader@qlns.local",
        role: "LEADER_LINE",
        ho_ten: "Trưởng Dây Chuyền (Leader)",
        ma_nhan_vien: "NV_LEADER_01",
        chuc_vu: "LEADER_LINE"
    },
    {
        ten_dang_nhap: "leader_kv",
        mat_khau: "Leader@123",
        email: "leaderkv@qlns.local",
        role: "LEADER_KHU_VUC",
        ho_ten: "Trưởng Khu Vực",
        ma_nhan_vien: "NV_LEADER_KV01",
        chuc_vu: "LEADER_KHU_VUC"
    }
];

async function seedAdminVaLeader() {
    console.log("=== BẮT ĐẦU TẠO DỮ LIỆU TÀI KHOẢN ADMIN VÀ LEADER ===");
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        for (const acc of danhSachTaiKhoan) {
            // 1. Kiểm tra tài khoản đã tồn tại chưa
            const [existingTk] = await connection.query(
                "SELECT id FROM tai_khoan WHERE ten_dang_nhap = ? LIMIT 1",
                [acc.ten_dang_nhap]
            );

            let tkId;
            const matKhauHash = await bcrypt.hash(acc.mat_khau, 10);

            if (existingTk.length > 0) {
                tkId = existingTk[0].id;
                await connection.query(
                    "UPDATE tai_khoan SET mat_khau = ?, email = ?, role = ?, trang_thai = 1 WHERE id = ?",
                    [matKhauHash, acc.email, acc.role, tkId]
                );
                console.log(`✅ Đã cập nhật tài khoản: ${acc.ten_dang_nhap} (Role: ${acc.role})`);
            } else {
                const [resTk] = await connection.query(
                    "INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, email, role, trang_thai) VALUES (?, ?, ?, ?, 1)",
                    [acc.ten_dang_nhap, matKhauHash, acc.email, acc.role]
                );
                tkId = resTk.insertId;
                console.log(`✅ Đã tạo tài khoản mới thành công: ${acc.ten_dang_nhap} (Role: ${acc.role})`);
            }

            // 2. Tạo hoặc cập nhật hồ sơ nhân viên tương ứng
            const [existingNv] = await connection.query(
                "SELECT id FROM nhan_vien WHERE tai_khoan_id = ? OR ma_nhan_vien = ? LIMIT 1",
                [tkId, acc.ma_nhan_vien]
            );

            if (existingNv.length > 0) {
                await connection.query(
                    "UPDATE nhan_vien SET ho_ten = ?, tai_khoan_id = ?, chuc_vu = ?, trang_thai = 'DANG_LAM' WHERE id = ?",
                    [acc.ho_ten, tkId, acc.chuc_vu, existingNv[0].id]
                );
                console.log(`   -> Cập nhật hồ sơ nhân viên: ${acc.ho_ten}`);
            } else {
                await connection.query(
                    `INSERT INTO nhan_vien (ma_nhan_vien, ho_ten, gioi_tinh, so_dien_thoai, ngay_vao_lam, tai_khoan_id, chuc_vu, trang_thai)
                     VALUES (?, ?, 'Nam', '0988888888', NOW(), ?, ?, 'DANG_LAM')`,
                    [acc.ma_nhan_vien, acc.ho_ten, tkId, acc.chuc_vu]
                );
                console.log(`   -> Tạo hồ sơ nhân viên mới: ${acc.ho_ten} (${acc.ma_nhan_vien})`);
            }
        }

        await connection.commit();
        console.log("\n==================================================");
        console.log("🎉 KHỞI TẠO TÀI KHOẢN THÀNH CÔNG! THÔNG TIN ĐĂNG NHẬP:");
        console.log("--------------------------------------------------");
        console.log("1. Tài khoản Admin System:");
        console.log("   - Username : admin");
        console.log("   - Password : Admin@123");
        console.log("2. Tài khoản Leader Line (Trưởng chuyền):");
        console.log("   - Username : leader");
        console.log("   - Password : Leader@123");
        console.log("3. Tài khoản Leader Khu Vực (Trưởng khu vực):");
        console.log("   - Username : leader_kv");
        console.log("   - Password : Leader@123");
        console.log("==================================================");
    } catch (err) {
        await connection.rollback();
        console.error("❌ Lỗi khi khởi tạo tài khoản admin/leader:", err);
    } finally {
        connection.release();
        process.exit(0);
    }
}

seedAdminVaLeader();

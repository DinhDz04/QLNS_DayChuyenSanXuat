import pool from "./config/db.js";

/**
 * Tự động kiểm tra và khởi tạo/cập nhật các bảng & cột còn thiếu trong MySQL database
 */
export async function initDatabaseTables() {
    try {
        // 1. Tạo bảng nhat_ky_he_thong & lich_lam nếu chưa tồn tại
        await pool.query(`
            CREATE TABLE IF NOT EXISTS nhat_ky_he_thong (
                id INT AUTO_INCREMENT PRIMARY KEY,
                loai_doi_tuong VARCHAR(50) NOT NULL,
                hanh_dong VARCHAR(50) NOT NULL,
                doi_tuong_id INT NULL,
                ten_doi_tuong VARCHAR(150) NULL,
                chi_tiet TEXT,
                nguoi_thuc_hien VARCHAR(100) DEFAULT 'Hệ thống',
                role_nguoi_thuc_hien VARCHAR(50) DEFAULT 'ADMIN',
                thoi_gian TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX(loai_doi_tuong),
                INDEX(thoi_gian)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS lich_lam (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ten_lich VARCHAR(100) NOT NULL,
                chu_ky_tuan INT DEFAULT 0,
                ngay_xoay_gan_nhat DATE,
                mo_ta TEXT,
                ngay_bat_dau DATE,
                ngay_ket_thuc DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE TABLE IF NOT EXISTS nhat_ky_leader_day_chuyen (
                id INT AUTO_INCREMENT PRIMARY KEY,
                day_chuyen_id INT NOT NULL,
                leader_id INT NULL,
                leader_cu_id INT NULL,
                ngay_bat_dau DATE NOT NULL,
                ngay_ket_thuc DATE NULL,
                hanh_dong ENUM('PHAN_CONG','THAY_DOI','GO_PHAN_CONG') DEFAULT 'PHAN_CONG',
                ghi_chu TEXT NULL,
                nguoi_thuc_hien VARCHAR(100) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX(day_chuyen_id),
                INDEX(leader_id),
                INDEX(ngay_bat_dau),
                INDEX(ngay_ket_thuc)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Lịch làm việc theo khoảng thời gian của từng nhân sự/phân công.
        // Dùng IF NOT EXISTS để các database hiện hữu được nâng cấp an toàn.
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lich_lam_viec_nhan_vien (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nhan_vien_id INT NOT NULL,
                day_chuyen_id INT NULL,
                cong_doan_id INT NULL,
                ca_lam_id INT NULL,
                thoi_gian_bat_dau DATETIME NOT NULL,
                thoi_gian_ket_thuc DATETIME NOT NULL,
                trang_thai ENUM('DANG_LAM','NGHI_PHEP','NGHI','VANG','TANG_CA','DIEU_CHUYEN','CHO_PHAN_CONG') DEFAULT 'DANG_LAM',
                ghi_chu TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX(nhan_vien_id),
                INDEX(day_chuyen_id),
                INDEX(thoi_gian_bat_dau),
                INDEX(thoi_gian_ket_thuc)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Khoảng ngày của một bản ghi phân công (không cần tạo một bản ghi cho từng ngày).
        const checkAssignmentDateColumn = async (column) => {
            const [rows] = await pool.query(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'phan_cong_nhan_su' AND COLUMN_NAME = ?`,
                [column]
            );
            return rows.length > 0;
        };
        if (!(await checkAssignmentDateColumn('ngay_bat_dau'))) {
            await pool.query("ALTER TABLE phan_cong_nhan_su ADD COLUMN ngay_bat_dau DATE NULL");
        }
        if (!(await checkAssignmentDateColumn('ngay_ket_thuc'))) {
            await pool.query("ALTER TABLE phan_cong_nhan_su ADD COLUMN ngay_ket_thuc DATE NULL");
        }
        const assignmentDateTimeColumns = [
            ["thoi_gian_bat_dau", "DATETIME NULL"],
            ["thoi_gian_ket_thuc", "DATETIME NULL"]
        ];
        for (const [column, definition] of assignmentDateTimeColumns) {
            if (!(await checkAssignmentDateColumn(column))) {
                await pool.query(`ALTER TABLE phan_cong_nhan_su ADD COLUMN ${column} ${definition}`);
            }
        }
        await pool.query("UPDATE phan_cong_nhan_su SET ngay_bat_dau = ngay, ngay_ket_thuc = ngay WHERE ngay_bat_dau IS NULL OR ngay_ket_thuc IS NULL");
        await pool.query("UPDATE phan_cong_nhan_su SET thoi_gian_bat_dau = CONCAT(ngay_bat_dau, ' 00:00:00'), thoi_gian_ket_thuc = CONCAT(ngay_ket_thuc, ' 23:59:59') WHERE thoi_gian_bat_dau IS NULL OR thoi_gian_ket_thuc IS NULL");
        await pool.query("UPDATE phan_cong_nhan_su SET trang_thai = 'DANG_LAM' WHERE trang_thai = 'NGHI'");

        // Helper kiểm tra cột đã có hay chưa
        const checkColumn = async (table, column) => {
            const [rows] = await pool.query(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
                [table, column]
            );
            return rows.length > 0;
        };

        // 2. Kiểm tra & thêm cột lich_lam_id vào ca_lam_viec
        if (!(await checkColumn('ca_lam_viec', 'lich_lam_id'))) {
            await pool.query(`ALTER TABLE ca_lam_viec ADD COLUMN lich_lam_id INT NULL`);
            try {
                await pool.query(`ALTER TABLE ca_lam_viec ADD CONSTRAINT fk_calam_lichlam FOREIGN KEY (lich_lam_id) REFERENCES lich_lam(id) ON DELETE SET NULL`);
            } catch (fkErr) {
                console.warn("Lưu ý FK fk_calam_lichlam:", fkErr.message);
            }
        }

        // 3. Kiểm tra & thêm cột vào nhan_vien
        if (!(await checkColumn('nhan_vien', 'ca_lam_id'))) {
            await pool.query(`ALTER TABLE nhan_vien ADD COLUMN ca_lam_id INT NULL`);
            try {
                await pool.query(`ALTER TABLE nhan_vien ADD CONSTRAINT fk_nhanvien_calam FOREIGN KEY (ca_lam_id) REFERENCES ca_lam_viec(id) ON DELETE SET NULL`);
            } catch (fkErr) {
                console.warn("Lưu ý FK fk_nhanvien_calam:", fkErr.message);
            }
        }

        if (!(await checkColumn('nhan_vien', 'co_xoay_ca'))) {
            await pool.query(`ALTER TABLE nhan_vien ADD COLUMN co_xoay_ca TINYINT DEFAULT 1`);
        }

        if (!(await checkColumn('nhan_vien', 'dia_chi'))) {
            await pool.query(`ALTER TABLE nhan_vien ADD COLUMN dia_chi TEXT NULL`);
        }

        if (!(await checkColumn('nhan_vien', 'ngay_sinh'))) {
            await pool.query(`ALTER TABLE nhan_vien ADD COLUMN ngay_sinh DATE NULL`);
        }

        // 4. Kiểm tra & bổ sung các trường nhật ký phục vụ lịch sử theo thời gian.
        // Database cũ có thể đã tồn tại nhat_ky_phan_cong nhưng thiếu các cột nâng cấp.
        const historyColumns = [
            ["thoi_gian_bat_dau", "DATETIME NULL"],
            ["thoi_gian_ket_thuc", "DATETIME NULL"],
            ["ly_do", "TEXT NULL"],
            ["nguoi_thay_the_id", "INT NULL"]
        ];
        for (const [column, definition] of historyColumns) {
            if (!(await checkColumn('nhat_ky_phan_cong', column))) {
                await pool.query(`ALTER TABLE nhat_ky_phan_cong ADD COLUMN ${column} ${definition}`);
            }
        }
        if (!(await checkColumn('lich_su_dieu_dong', 'loai_thay_doi'))) {
            await pool.query(`ALTER TABLE lich_su_dieu_dong ADD COLUMN loai_thay_doi VARCHAR(50) DEFAULT 'DAY_CHUYEN'`);
        }

        console.log("✅ Cấu trúc cơ sở dữ liệu đã được khởi tạo/cập nhật đầy đủ thành công.");
    } catch (err) {
        console.error("❌ Lỗi khi khởi tạo/cập nhật cơ sở dữ liệu:", err.message);
    }
}

export default initDatabaseTables;

CREATE DATABASE IF NOT EXISTS ql_nhan_su_day_chuyen CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ql_nhan_su_day_chuyen;

CREATE TABLE tai_khoan(
 id INT AUTO_INCREMENT PRIMARY KEY,
 ten_dang_nhap VARCHAR(50) UNIQUE NOT NULL,
 mat_khau VARCHAR(255) NOT NULL,
 email VARCHAR(100) UNIQUE,
 role ENUM('ADMIN','LEADER_KHU_VUC','LEADER_LINE','NHAN_VIEN') NOT NULL,
 trang_thai TINYINT DEFAULT 1,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE khach_hang(
 id INT AUTO_INCREMENT PRIMARY KEY,
 ten_khach_hang VARCHAR(100) NOT NULL,
 mo_ta TEXT
);

CREATE TABLE khu_vuc(
 id INT AUTO_INCREMENT PRIMARY KEY,
 ten_khu_vuc VARCHAR(100) NOT NULL,
 khach_hang_id INT NOT NULL,
 INDEX(khach_hang_id),
 FOREIGN KEY(khach_hang_id) REFERENCES khach_hang(id)
);

CREATE TABLE day_chuyen(
 id INT AUTO_INCREMENT PRIMARY KEY,
 ten_day_chuyen VARCHAR(50) NOT NULL,
 khu_vuc_id INT NOT NULL,
 leader_id INT NULL,
 trang_thai ENUM('HOAT_DONG','TAM_DUNG') DEFAULT 'HOAT_DONG',
 INDEX(khu_vuc_id),
 FOREIGN KEY(khu_vuc_id) REFERENCES khu_vuc(id)
);

CREATE TABLE cong_doan(
 id INT AUTO_INCREMENT PRIMARY KEY,
 ten_cong_doan VARCHAR(100) NOT NULL,
 mo_ta TEXT
);

CREATE TABLE nhan_vien(
 id INT AUTO_INCREMENT PRIMARY KEY,
 ma_nhan_vien VARCHAR(20) UNIQUE,
 ho_ten VARCHAR(100) NOT NULL,
 gioi_tinh ENUM('Nam','Nu','Khac'),
 so_dien_thoai VARCHAR(15),
 ngay_vao_lam DATE,
 day_chuyen_id INT,
 tai_khoan_id INT UNIQUE,
 chuc_vu ENUM('ADMIN','NHAN_VIEN','LEADER_LINE','LEADER_KHU_VUC') DEFAULT 'NHAN_VIEN',
 trang_thai ENUM('DANG_LAM','NGHI_VIEC') DEFAULT 'DANG_LAM',
 INDEX(day_chuyen_id),
 FOREIGN KEY(day_chuyen_id) REFERENCES day_chuyen(id),
 FOREIGN KEY(tai_khoan_id) REFERENCES tai_khoan(id)
);

ALTER TABLE day_chuyen
ADD CONSTRAINT fk_daychuyen_leader FOREIGN KEY(leader_id) REFERENCES nhan_vien(id);

CREATE TABLE chung_chi(
 id INT AUTO_INCREMENT PRIMARY KEY,
 ten_chung_chi VARCHAR(100) NOT NULL,
 mo_ta TEXT
);

CREATE TABLE chung_chi_nhan_vien(
 id INT AUTO_INCREMENT PRIMARY KEY,
 nhan_vien_id INT NOT NULL,
 chung_chi_id INT NOT NULL,
 cap_do TINYINT NOT NULL,
 ngay_cap DATE,
 ngay_het_han DATE,
 trang_thai ENUM('HIEU_LUC','HET_HAN','DAO_TAO') DEFAULT 'HIEU_LUC',
 UNIQUE(nhan_vien_id,chung_chi_id),
 INDEX(nhan_vien_id),
 INDEX(chung_chi_id),
 FOREIGN KEY(nhan_vien_id) REFERENCES nhan_vien(id),
 FOREIGN KEY(chung_chi_id) REFERENCES chung_chi(id)
);

CREATE TABLE ca_lam_viec(
 id INT AUTO_INCREMENT PRIMARY KEY,
 ten_ca VARCHAR(50),
 gio_bat_dau TIME,
 gio_ket_thuc TIME
);

CREATE TABLE dang_ky_tang_ca(
 id INT AUTO_INCREMENT PRIMARY KEY,
 nhan_vien_id INT NOT NULL,
 ca_lam_id INT NOT NULL,
 ngay DATE NOT NULL,
 trang_thai ENUM('CHO_DUYET','DA_DUYET','TU_CHOI') DEFAULT 'CHO_DUYET',
 INDEX(nhan_vien_id),
 FOREIGN KEY(nhan_vien_id) REFERENCES nhan_vien(id),
 FOREIGN KEY(ca_lam_id) REFERENCES ca_lam_viec(id)
);

CREATE TABLE yeu_cau_nhan_su(
 id INT AUTO_INCREMENT PRIMARY KEY,
 day_chuyen_id INT NOT NULL,
 cong_doan_id INT NOT NULL,
 so_luong_can INT NOT NULL,
 UNIQUE(day_chuyen_id,cong_doan_id),
 FOREIGN KEY(day_chuyen_id) REFERENCES day_chuyen(id),
 FOREIGN KEY(cong_doan_id) REFERENCES cong_doan(id)
);

CREATE TABLE phan_cong_nhan_su(
 id INT AUTO_INCREMENT PRIMARY KEY,
 nhan_vien_id INT NOT NULL,
 day_chuyen_id INT NOT NULL,
 cong_doan_id INT NOT NULL,
 ca_lam_id INT NOT NULL,
 ngay DATE NOT NULL,
 trang_thai ENUM('DANG_LAM','DIEU_DONG','NGHI') DEFAULT 'DANG_LAM',
 INDEX(nhan_vien_id),
 FOREIGN KEY(nhan_vien_id) REFERENCES nhan_vien(id),
 FOREIGN KEY(day_chuyen_id) REFERENCES day_chuyen(id),
 FOREIGN KEY(cong_doan_id) REFERENCES cong_doan(id),
 FOREIGN KEY(ca_lam_id) REFERENCES ca_lam_viec(id)
);

CREATE TABLE lich_su_dieu_dong(
 id INT AUTO_INCREMENT PRIMARY KEY,
 nhan_vien_id INT NOT NULL,
 tu_day_chuyen_id INT,
 den_day_chuyen_id INT,
 cong_doan_cu_id INT,
 cong_doan_moi_id INT,
 ly_do TEXT,
 thoi_gian DATETIME DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(nhan_vien_id) REFERENCES nhan_vien(id),
 FOREIGN KEY(tu_day_chuyen_id) REFERENCES day_chuyen(id),
 FOREIGN KEY(den_day_chuyen_id) REFERENCES day_chuyen(id),
 FOREIGN KEY(cong_doan_cu_id) REFERENCES cong_doan(id),
 FOREIGN KEY(cong_doan_moi_id) REFERENCES cong_doan(id)
);

CREATE TABLE thong_bao(
 id INT AUTO_INCREMENT PRIMARY KEY,
 nguoi_nhan_id INT NOT NULL,
 tieu_de VARCHAR(200),
 noi_dung TEXT,
 da_doc BOOLEAN DEFAULT FALSE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(nguoi_nhan_id) REFERENCES nhan_vien(id)
);

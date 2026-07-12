import { useState, useEffect, useCallback } from "react";

export function useCrud(layDanhSachApi, taoApi, capNhatApi, xoaApi, messageSuccessPrefix = "bản ghi") {
    const [danhSach, setDanhSach] = useState([]);
    const [dangTai, setDangTai] = useState(false);
    const [loi, setLoi] = useState("");
    const [thongBao, setThongBao] = useState("");

    // Modal State
    const [modalHienThi, setModalHienThi] = useState(false);
    const [modalCheDo, setModalCheDo] = useState("THEM"); // THEM | SUA
    const [dangChon, setDangChon] = useState(null);

    const taiDanhSach = useCallback(async () => {
        setDangTai(true);
        setLoi("");
        try {
            const res = await layDanhSachApi();
            if (res.success) {
                setDanhSach(res.data);
            }
        } catch (err) {
            setLoi(err.message || "Không thể tải danh sách dữ liệu");
        } finally {
            setDangTai(false);
        }
    }, [layDanhSachApi]);

    useEffect(() => {
        taiDanhSach();
    }, [taiDanhSach]);

    const hienThongBao = (msg) => {
        setThongBao(msg);
        setTimeout(() => setThongBao(""), 4000);
    };

    const hienModalThem = () => {
        setModalCheDo("THEM");
        setDangChon(null);
        setLoi("");
        setModalHienThi(true);
    };

    const hienModalSua = (item) => {
        setModalCheDo("SUA");
        setDangChon(item);
        setLoi("");
        setModalHienThi(true);
    };

    const dongModal = () => {
        setModalHienThi(false);
        setDangChon(null);
    };

    const xuLyLuu = async (data) => {
        try {
            if (modalCheDo === "THEM") {
                const res = await taoApi(data);
                if (res.success) {
                    hienThongBao(`Đã tạo ${messageSuccessPrefix} thành công!`);
                    await taiDanhSach();
                    dongModal();
                }
            } else if (modalCheDo === "SUA") {
                const res = await capNhatApi(dangChon.id, data);
                if (res.success) {
                    hienThongBao(`Đã cập nhật ${messageSuccessPrefix} thành công!`);
                    await taiDanhSach();
                    dongModal();
                }
            }
        } catch (err) {
            alert(err.message || "Lỗi khi lưu dữ liệu");
        }
    };

    const xuLyXoa = async (id, ten) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa "${ten}" không?`)) {
            try {
                const res = await xoaApi(id);
                if (res.success) {
                    hienThongBao(`Đã xóa ${messageSuccessPrefix} thành công!`);
                    await taiDanhSach();
                }
            } catch (err) {
                alert(err.message || "Lỗi khi thực hiện xóa");
            }
        }
    };

    return {
        danhSach,
        dangTai,
        loi,
        thongBao,
        modalHienThi,
        modalCheDo,
        dangChon,
        taiDanhSach,
        hienModalThem,
        hienModalSua,
        dongModal,
        xuLyLuu,
        xuLyXoa,
        hienThongBao,
        setModalCheDo,
        setModalHienThi,
        setDangChon
    };
}

export default useCrud;

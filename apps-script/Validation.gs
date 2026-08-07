/**
 * VALIDATION.GS - Kiểm tra & Làm sạch dữ liệu đầu vào chống XSS và dữ liệu lỗi
 * Hệ thống liên lạc Ban công tác Mặt trận 18 Khu phố
 */

/**
 * Làm sạch chuỗi chống XSS
 */
function sanitizeInput(input) {
  if (typeof input !== "string") return input;
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Kiểm tra dữ liệu cán bộ nhân sự trước khi lưu
 */
function validatePersonnel(data) {
  if (!data || typeof data !== "object") {
    return { valid: false, message: "Dữ liệu nhân sự không hợp lệ hoặc rỗng." };
  }

  if (!data.hoTen || String(data.hoTen).trim() === "") {
    return { valid: false, message: "Họ và tên cán bộ không được để rỗng." };
  }

  if (!data.khuPho || String(data.khuPho).trim() === "") {
    return { valid: false, message: "Vui lòng chọn Khu phố quản lý." };
  }

  if (!data.chucDanhMatTran || String(data.chucDanhMatTran).trim() === "") {
    return { valid: false, message: "Chức danh Mặt trận không được để rỗng." };
  }

  // Sanitize strings
  data.hoTen = String(data.hoTen).trim();
  data.khuPho = String(data.khuPho).trim();
  data.chucDanhMatTran = String(data.chucDanhMatTran).trim();
  if (data.chucDanhKhac) data.chucDanhKhac = String(data.chucDanhKhac).trim();
  if (data.diaChi) data.diaChi = String(data.diaChi).trim();
  if (data.soDienThoai) data.soDienThoai = String(data.soDienThoai).trim();
  if (data.ghiChu) data.ghiChu = String(data.ghiChu).trim();

  return { valid: true, data: data };
}

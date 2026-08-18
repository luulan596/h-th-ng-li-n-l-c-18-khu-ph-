/**
 * Config.gs - Cấu hình hệ thống và hằng số dữ liệu
 * Ban Công tác Mặt trận 18 Khu phố Phường Bình Tiên
 */

var CONFIG = {
  SHEETS: {
    PERSONNEL: "DL_DANH_BA",
    USERS: "USERS",
    LOGS: "LOGS",
    HEADQUARTERS: "ToaDoTruSo"
  },
  DEFAULT_ROLES: {
    ADMIN: "ADMIN",
    EDITOR: "EDITOR",
    VIEWER: "VIEWER"
  },
  HEADERS: [
    "STT",
    "Họ và tên",
    "Năm sinh Nam",
    "Năm sinh Nữ",
    "Chức danh dự kiến trong Ban CT Mặt trận",
    "Các chức danh dự kiến khác",
    "Địa chỉ thực tế cư trú",
    "Số điện thoại",
    "Khu phố"
  ],
  PUBLIC_CONTACT_FIELDS: [
    "id",
    "stt",
    "hoTen",
    "chucDanhMatTran",
    "chucDanhKhac",
    "soDienThoai",
    "khuPho",
    "isCapUy"
  ],
  PRIVATE_FIELDS: [
    "namSinhNam",
    "namSinhNu",
    "birthYear",
    "gender",
    "diaChi"
  ],
  KEYS: {
    DATA_VERSION: "DATA_VERSION"
  }
};

/**
 * Lấy Script Property an toàn
 */
function getScriptProperty(key, defaultValue) {
  try {
    var props = PropertiesService.getScriptProperties();
    var val = props.getProperty(key);
    return val ? val : (defaultValue || "");
  } catch (e) {
    return defaultValue || "";
  }
}

/**
 * Lấy Spreadsheet ID chính
 */
function getTargetSpreadsheetId() {
  return getScriptProperty("SPREADSHEET_ID", "");
}



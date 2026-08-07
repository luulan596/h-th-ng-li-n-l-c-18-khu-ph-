/**
 * CONFIG.GS - Quản lý cấu hình & Hằng số cho Google Apps Script Backend
 * Hệ thống liên lạc Ban công tác Mặt trận 18 Khu phố
 */

var CONFIG = {
  APP_NAME: "Hệ thống liên lạc Ban công tác Mặt trận 18 Khu phố",
  VERSION: "1.0.0",
  TIMEZONE: "Asia/Ho_Chi_Minh",
  SHEET_NAMES: {
    PERSONNEL: "PERSONNEL",
    HEADQUARTERS: "HEADQUARTERS",
    RED_SITES: "RED_SITES",
    USERS: "USERS",
    SETTINGS: "SETTINGS",
    ACTIVITY_LOG: "ACTIVITY_LOG",
    ATTACHMENTS: "ATTACHMENTS"
  },
  MAX_LOCK_WAIT_MS: 10000, // 10 giây chờ LockService
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024 // 10 MB limit cho file upload
};

/**
 * Lấy Spreadsheet ID từ ScriptProperties hoặc Spreadsheet hiện tại
 */
function getSpreadsheetId() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("SPREADSHEET_ID");
  if (id && id.trim() !== "") {
    return id.trim();
  }
  try {
    return SpreadsheetApp.getActiveSpreadsheet().getId();
  } catch (e) {
    throw new Error("Chưa cấu hình SPREADSHEET_ID trong Script Properties.");
  }
}

/**
 * Lấy hoặc mở Active Spreadsheet
 */
function getSpreadsheet() {
  var id = getSpreadsheetId();
  return SpreadsheetApp.openById(id);
}

/**
 * Lấy Drive Folder ID lưu trữ tệp đính kèm
 */
function getDriveFolderId() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty("DRIVE_FOLDER_ID") || "";
}

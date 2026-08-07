/**
 * LOGSERVICE.GS - Ghi nhật ký thao tác người dùng vào Google Sheets
 * Hệ thống liên lạc Ban công tác Mặt trận 18 Khu phố
 */

function logActivity(userEmail, action, entity, entityId, details, status) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ACTIVITY_LOG);
    if (!sheet) return;

    sheet.appendRow([
      generateUUID(),
      Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss"),
      userEmail || "AnonymousUser",
      action || "UNKNOWN",
      entity || "GENERAL",
      entityId || "",
      typeof details === "object" ? JSON.stringify(details) : String(details || ""),
      status || "SUCCESS"
    ]);
  } catch (e) {
    Logger.log("Lỗi logActivity: " + e.message);
  }
}

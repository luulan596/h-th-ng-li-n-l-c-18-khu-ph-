/**
 * LogService.gs - Ghi nhật ký thao tác hệ thống (Audit Trail)
 * Ban Công tác Mặt trận 18 Khu phố Phường Bình Tiên
 */

function logAuditAction(userEmail, action, entity, entityId, details) {
  try {
    var ss = getSpreadsheet();
    var logSheet = ss.getSheetByName(CONFIG.SHEETS.LOGS);
    
    if (!logSheet) {
      logSheet = ss.insertSheet(CONFIG.SHEETS.LOGS);
      logSheet.appendRow(["ID Log", "Thời Gian", "Email Người Thực Hiện", "Hành Động (Action)", "Đối Tượng (Entity)", "ID Đối Tượng", "Chi Tiết"]);
    }

    var logId = "LOG-" + new Date().getTime();
    var timestamp = new Date().toLocaleString("vi-VN");

    logSheet.appendRow([
      logId,
      timestamp,
      userEmail || "HỆ THỐNG",
      action || "",
      entity || "",
      entityId || "",
      details || ""
    ]);
  } catch (e) {
    console.error("Lỗi ghi Log Audit Trail:", e);
  }
}

function logError(context, errorMessage) {
  console.error("LOG_ERROR [" + context + "]: " + errorMessage);
}

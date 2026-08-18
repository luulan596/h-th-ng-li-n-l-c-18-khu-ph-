/**
 * Setup.gs - Khởi tạo tự động các tab Sheet và cấu trúc cột
 * Ban Công tác Mặt trận 18 Khu phố Phường Bình Tiên
 * 
 * HƯỚNG DẪN: Chạy hàm setupApplication() 1 lần đầu tiên trên Google Apps Script để tạo sẵn các tab cần thiết.
 */

function setupApplication() {
  var ss = getSpreadsheet();
  
  // 1. Tạo tab DL_DANH_BA
  var personnelSheet = ss.getSheetByName(CONFIG.SHEETS.PERSONNEL) || ss.insertSheet(CONFIG.SHEETS.PERSONNEL);
  if (personnelSheet.getLastRow() === 0) {
    personnelSheet.appendRow(CONFIG.HEADERS);
    personnelSheet.getRange(1, 1, 1, CONFIG.HEADERS.length).setFontWeight("bold").setBackground("#991b1b").setFontColor("#ffffff");
  }

  // 2. Tạo tab USERS
  var usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS) || ss.insertSheet(CONFIG.SHEETS.USERS);
  if (usersSheet.getLastRow() === 0) {
    usersSheet.appendRow(["Email", "Vai Trò (Role)", "Trạng Thái", "Ngày Tạo"]);
    usersSheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#1e1b4b").setFontColor("#ffffff");
    
    var adminEmail = getScriptProperty("ADMIN_EMAIL", Session.getActiveUser().getEmail());
    if (adminEmail) {
      usersSheet.appendRow([adminEmail, "ADMIN", true, new Date().toLocaleString("vi-VN")]);
    }
  }

  // 3. Tạo tab LOGS
  var logSheet = ss.getSheetByName(CONFIG.SHEETS.LOGS) || ss.insertSheet(CONFIG.SHEETS.LOGS);
  if (logSheet.getLastRow() === 0) {
    logSheet.appendRow(["ID Log", "Thời Gian", "Email Người Thực Hiện", "Hành Động", "Đối Tượng", "ID Đối Tượng", "Chi Tiết"]);
    logSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#334155").setFontColor("#ffffff");
  }

  // 4. Tạo tab ToaDoTruSo
  var hqSheet = ss.getSheetByName(CONFIG.SHEETS.HEADQUARTERS) || ss.insertSheet(CONFIG.SHEETS.HEADQUARTERS);
  if (hqSheet.getLastRow() === 0) {
    hqSheet.appendRow(["Mã Trụ Sở", "Tên Trụ Sở", "Vĩ Độ (Latitude)", "Kinh Độ (Longitude)", "Thời Gian Cập Nhật"]);
    hqSheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#854d0e").setFontColor("#ffffff");
  }

  console.log("SUCCESS: Đã khởi tạo hoàn tất cấu trúc các Tab trên Google Sheet!");
}

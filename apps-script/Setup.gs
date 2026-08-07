/**
 * SETUP.GS - Hàm thiết lập tự động Google Sheets làm cơ sở dữ liệu
 * Hệ thống liên lạc Ban công tác Mặt trận 18 Khu phố
 */

function setupApplication() {
  var ss = getSpreadsheet();
  var sheetsConfig = [
    {
      name: CONFIG.SHEET_NAMES.PERSONNEL,
      headers: [
        "ID", "STT", "Khu Phố", "Họ và Tên", "Năm Sinh (Nam)", "Năm Sinh (Nữ)",
        "Chức Danh Mặt Trận", "Chức Danh Kiêm Nhiệm", "Địa Chỉ Cư Trú", "Số Điện Thoại",
        "Cấp Uỷ Chi Bộ", "Ghi Chú", "Ngày Tạo", "Người Tạo", "Ngày Cập Nhật", "Người Cập Nhật", "Trạng Thái"
      ],
      widths: [150, 60, 100, 180, 100, 100, 160, 180, 220, 130, 100, 180, 150, 120, 150, 120, 100]
    },
    {
      name: CONFIG.SHEET_NAMES.HEADQUARTERS,
      headers: [
        "ID", "Tên Trụ Sở", "Loại Trụ Sở", "Khu Phố Thường Trực", "Địa Chỉ", "Số Điện Thoại",
        "Giờ Làm Việc", "Cán Bộ Phụ Trách", "Chức Vụ Cán Bộ", "Vĩ Độ (Lat)", "Kinh Độ (Lng)",
        "Mô Tả Chức Năng", "Ngày Cập Nhật"
      ],
      widths: [150, 200, 120, 120, 220, 120, 140, 160, 140, 100, 100, 250, 150]
    },
    {
      name: CONFIG.SHEET_NAMES.RED_SITES,
      headers: [
        "ID", "Tên Địa Chỉ Đỏ", "Phân Loại", "Địa Chỉ", "Khu Phố", "Tóm Tắt", "Lịch Sử Chi Tiết",
        "Ảnh Đại Diện (URL)", "Thư Viện Ảnh (JSON)", "Video (URL)", "Google Drive (URL)",
        "Vĩ Độ (Lat)", "Kinh Độ (Lng)", "Giờ Mở Cửa", "Giá Vé", "Nổi Bật", "Ngày Cập Nhật"
      ],
      widths: [150, 200, 140, 220, 100, 250, 300, 200, 200, 180, 180, 100, 100, 120, 100, 80, 150]
    },
    {
      name: CONFIG.SHEET_NAMES.USERS,
      headers: ["ID", "Email", "Họ và Tên", "Vai Trò", "Trạng Thái", "Ngày Tạo"],
      widths: [150, 200, 180, 120, 100, 150]
    },
    {
      name: CONFIG.SHEET_NAMES.SETTINGS,
      headers: ["Mã Cấu Hình (Key)", "Giá Trị (Value)", "Mô Tả", "Ngày Cập Nhật"],
      widths: [180, 250, 300, 150]
    },
    {
      name: CONFIG.SHEET_NAMES.ACTIVITY_LOG,
      headers: ["ID", "Thời Gian", "Email Người Dùng", "Hành Động", "Thực Thể", "ID Thực Thể", "Chi Tiết", "Trạng Thái"],
      widths: [150, 160, 180, 120, 120, 150, 300, 100]
    },
    {
      name: CONFIG.SHEET_NAMES.ATTACHMENTS,
      headers: ["ID", "Tên Tệp", "Loại Tệp", "Google Drive File ID", "Google Drive URL", "URL Xem", "Người Tải", "Ngày Tải"],
      widths: [150, 200, 120, 180, 250, 250, 150, 160]
    }
  ];

  sheetsConfig.forEach(function (cfg) {
    var sheet = ss.getSheetByName(cfg.name);
    if (!sheet) {
      sheet = ss.insertSheet(cfg.name);
    }

    // Nếu sheet rỗng, chèn tiêu đề
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(cfg.headers);
      
      // Định dạng dòng tiêu đề (Header Row)
      var headerRange = sheet.getRange(1, 1, 1, cfg.headers.length);
      headerRange.setBackground("#1e1b4b"); // Indigo đậm chính quy
      headerRange.setFontColor("#fef3c7"); // Amber sáng
      headerRange.setFontWeight("bold");
      headerRange.setFontFamily("Roboto");
      headerRange.setFontSize(11);
      headerRange.setVerticalAlignment("middle");
      headerRange.setHorizontalAlignment("center");
      sheet.setRowHeight(1, 35);

      // Cố định dòng 1
      sheet.setFrozenRows(1);

      // Đặt độ rộng từng cột
      for (var i = 0; i < cfg.widths.length; i++) {
        sheet.setColumnWidth(i + 1, cfg.widths[i]);
      }
    }
  });

  // Khởi tạo các giá trị SETTINGS mặc định nếu chưa có
  var settingsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);
  if (settingsSheet && settingsSheet.getLastRow() === 1) {
    var defaultSettings = [
      ["APP_TITLE", "Hệ thống liên lạc Ban công tác Mặt trận 18 Khu phố", "Tên chính thức của ứng dụng", new Date()],
      ["DEFAULT_KHU_PHO_COUNT", "18", "Số lượng Khu phố quản lý", new Date()],
      ["DRIVE_FOLDER_NAME", "MatTran18KhuPho_Uploads", "Tên thư mục lưu file Google Drive", new Date()]
    ];
    defaultSettings.forEach(function(row) {
      settingsSheet.appendRow(row);
    });
  }

  Logger.log("Đã thiết lập cơ sở dữ liệu Google Sheets thành công!");
  return {
    success: true,
    message: "Khởi tạo Google Sheets làm cơ sở dữ liệu thành công!",
    timestamp: new Date().toISOString()
  };
}

/**
 * API.GS - Đóng gói phản hồi API JSON và Điều hướng xử lý nghiệp vụ
 * Hệ thống liên lạc Ban công tác Mặt trận 18 Khu phố
 */

function buildSuccessResponse(data, message) {
  var output = {
    status: "success",
    success: true,
    message: message || "Thao tác thành công",
    data: data,
    total: Array.isArray(data) ? data.length : (data ? 1 : 0),
    timestamp: Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX")
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function buildErrorResponse(message, errorCode, statusNum) {
  var output = {
    status: "error",
    success: false,
    message: message || "Đã xảy ra lỗi khi xử lý yêu cầu",
    errorCode: errorCode || "INTERNAL_ERROR",
    data: null,
    timestamp: Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX")
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleApiRequest(action, payload, userEmail) {
  var act = (action || "").toUpperCase();

  switch (act) {
    case "GET_ALL":
    case "LIST":
      var rawRows = getAllRecords(CONFIG.SHEET_NAMES.PERSONNEL);
      var personnelList = rawRows.map(mapRowToPersonnel);
      logActivity(userEmail, "LIST", "PERSONNEL", "", "Lấy danh sách cán bộ", "SUCCESS");
      return buildSuccessResponse(personnelList, "Lấy danh sách nhân sự thành công");

    case "READ":
    case "GET_BY_ID":
      if (!payload || !payload.id) {
        return buildErrorResponse("Thiếu ID bản ghi cần đọc", "MISSING_ID");
      }
      var allRows = getAllRecords(CONFIG.SHEET_NAMES.PERSONNEL);
      var found = null;
      for (var i = 0; i < allRows.length; i++) {
        if (String(allRows[i]["ID"]) === String(payload.id)) {
          found = mapRowToPersonnel(allRows[i]);
          break;
        }
      }
      if (found) {
        return buildSuccessResponse(found, "Tìm thấy bản ghi nhân sự");
      } else {
        return buildErrorResponse("Không tìm thấy bản ghi với ID cung cấp", "NOT_FOUND");
      }

    case "ADD":
    case "CREATE":
      var validation = validatePersonnel(payload);
      if (!validation.valid) {
        return buildErrorResponse(validation.message, "VALIDATION_ERROR");
      }
      var created = addPersonnelRecord(validation.data, userEmail);
      logActivity(userEmail, "CREATE", "PERSONNEL", created.id, "Thêm mới cán bộ " + created.hoTen, "SUCCESS");
      return buildSuccessResponse(created, "Đã thêm mới cán bộ thành công vào Google Sheets!");

    case "UPDATE":
    case "EDIT":
      var validationEdit = validatePersonnel(payload);
      if (!validationEdit.valid) {
        return buildErrorResponse(validationEdit.message, "VALIDATION_ERROR");
      }
      var updated = updatePersonnelRecord(validationEdit.data, userEmail);
      logActivity(userEmail, "UPDATE", "PERSONNEL", updated.id, "Cập nhật cán bộ " + updated.hoTen, "SUCCESS");
      return buildSuccessResponse(updated, "Đã cập nhật dữ liệu cán bộ thành công!");

    case "DELETE":
    case "REMOVE":
      var targetId = payload ? (payload.id || payload) : null;
      if (!targetId) {
        return buildErrorResponse("Thiếu ID cán bộ cần xóa", "MISSING_ID");
      }
      var deleted = deletePersonnelRecord(targetId, userEmail);
      if (deleted) {
        logActivity(userEmail, "DELETE", "PERSONNEL", targetId, "Xóa cán bộ ID " + targetId, "SUCCESS");
        return buildSuccessResponse({ id: targetId }, "Đã xóa dữ liệu cán bộ thành công khỏi Google Sheets!");
      } else {
        return buildErrorResponse("Không tìm thấy cán bộ để xóa", "NOT_FOUND");
      }

    case "SYNC_ALL":
      var listToSync = (payload && Array.isArray(payload.list)) ? payload.list : (Array.isArray(payload) ? payload : []);
      var count = syncAllPersonnel(listToSync, userEmail);
      logActivity(userEmail, "SYNC_ALL", "PERSONNEL", "", "Đồng bộ toàn bộ " + count + " cán bộ", "SUCCESS");
      return buildSuccessResponse({ count: count }, "Đã đồng bộ toàn bộ " + count + " cán bộ lên Google Sheets thành công!");

    case "SETUP":
      var setupResult = setupApplication();
      return buildSuccessResponse(setupResult, "Đã khởi tạo Google Sheets thành công!");

    case "UPLOAD":
      if (!payload || !payload.base64Data || !payload.fileName) {
        return buildErrorResponse("Thiếu dữ liệu tệp base64 hoặc tên tệp", "INVALID_FILE_PAYLOAD");
      }
      var fileResult = uploadFileToDrive(payload.base64Data, payload.fileName, payload.mimeType || "application/octet-stream", userEmail);
      logActivity(userEmail, "UPLOAD", "DRIVE", fileResult.fileId, "Tải tệp " + payload.fileName, "SUCCESS");
      return buildSuccessResponse(fileResult, "Đã tải tệp lên Google Drive thành công!");

    default:
      return buildErrorResponse("Hành động (action) không được hỗ trợ: " + action, "UNKNOWN_ACTION");
  }
}

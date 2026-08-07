/**
 * CODE.GS - Main Entry Points (doGet & doPost) cho Apps Script Web App
 * Hệ thống liên lạc Ban công tác Mặt trận 18 Khu phố
 */

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || "GET_ALL";
    var userEmail = getCurrentUserEmail();

    // Nếu gọi action=setup trực tiếp từ trình duyệt
    if (action.toUpperCase() === "SETUP") {
      var res = setupApplication();
      return buildSuccessResponse(res, "Đã khởi tạo các bảng Google Sheets thành công!");
    }

    return handleApiRequest(action, params, userEmail);
  } catch (err) {
    Logger.log("Lỗi trong doGet: " + err.message + "\n" + err.stack);
    return buildErrorResponse("Lỗi máy chủ: " + err.message, "SERVER_ERROR");
  }
}

function doPost(e) {
  try {
    var payload = {};
    var action = "ADD";
    var userEmail = getCurrentUserEmail();

    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
        if (payload.action) {
          action = payload.action;
        }
        if (payload.data) {
          payload = payload.data;
        }
      } catch (jsonErr) {
        // Fallback parameter parsing nếu là URL encoded hoặc text/plain
        payload = e.parameter || {};
        if (e.parameter && e.parameter.action) {
          action = e.parameter.action;
        }
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
      action = e.parameter.action || "ADD";
    }

    return handleApiRequest(action, payload, userEmail);
  } catch (err) {
    Logger.log("Lỗi trong doPost: " + err.message + "\n" + err.stack);
    return buildErrorResponse("Lỗi xử lý dữ liệu: " + err.message, "SERVER_ERROR");
  }
}

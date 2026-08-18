/**
 * Code.gs - Web App Entry Point (Pure HTTPS JSON API)
 * Ban Công tác Mặt trận 18 Khu phố Phường Bình Tiên
 */

function doGet(e) {
  // Chỉ trả về JSON API Status / Health Check. Tuyệt đối không phục vụ HTML UI hay trả dữ liệu nhân sự qua GET.
  return createJsonResponse({
    success: true,
    status: "ok",
    message: "Hệ thống máy chủ hoạt động bình thường",
    version: getDataVersion(),
    timestamp: new Date().toISOString()
  });
}


function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        success: false,
        message: "Dữ liệu yêu cầu rỗng (Empty payload)",
        timestamp: new Date().toISOString()
      });
    }

    var contents;
    try {
      contents = JSON.parse(e.postData.contents);
    } catch (jsonErr) {
      return createJsonResponse({
        success: false,
        message: "Định dạng payload JSON không hợp lệ",
        timestamp: new Date().toISOString()
      });
    }

    return handleApiRequest(contents);
  } catch (err) {
    logError("doPost", err.toString());
    return createJsonResponse({
      success: false,
      message: "Lỗi xử lý hệ thống: " + err.toString(),
      timestamp: new Date().toISOString()
    });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

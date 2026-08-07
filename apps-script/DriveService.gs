/**
 * DRIVESERVICE.GS - Quản lý lưu trữ tệp đính kèm lên Google Drive
 * Hệ thống liên lạc Ban công tác Mặt trận 18 Khu phố
 */

function uploadFileToDrive(base64Data, fileName, mimeType, userEmail) {
  var folderId = getDriveFolderId();
  var folder;

  if (folderId) {
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (e) {
      folder = DriveApp.getRootFolder();
    }
  } else {
    // Tự tạo hoặc lấy thư mục MatTran18KhuPho_Uploads
    var folders = DriveApp.getFoldersByName("MatTran18KhuPho_Uploads");
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder("MatTran18KhuPho_Uploads");
    }
  }

  // Giải mã Base64
  var decoded = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decoded, mimeType, fileName);
  var file = folder.createFile(blob);

  // Đặt quyền xem công khai bằng link
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var fileId = file.getId();
  var fileUrl = file.getUrl();
  var downloadUrl = "https://drive.google.com/uc?export=view&id=" + fileId;

  // Ghi nhận vào Sheet ATTACHMENTS
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ATTACHMENTS);
  if (sheet) {
    sheet.appendRow([
      generateUUID(),
      fileName,
      mimeType,
      fileId,
      fileUrl,
      downloadUrl,
      userEmail || "System",
      Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss")
    ]);
  }

  return {
    fileId: fileId,
    fileName: fileName,
    driveUrl: fileUrl,
    viewUrl: downloadUrl
  };
}

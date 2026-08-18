/**
 * DriveService.gs - Quản lý file đính kèm và lưu trữ trên Google Drive
 * Ban Công tác Mặt trận 18 Khu phố Phường Bình Tiên
 */

function uploadFileToDrive(base64Data, filename, mimeType) {
  var folderId = getScriptProperty("DRIVE_FOLDER_ID", "");
  var folder;

  if (folderId) {
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (e) {
      folder = DriveApp.getRootFolder();
    }
  } else {
    folder = DriveApp.getRootFolder();
  }

  try {
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, filename);
    var file = folder.createFile(blob);

    return {
      success: true,
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      directUrl: "https://lh3.googleusercontent.com/d/" + file.getId(),
      filename: filename
    };
  } catch (err) {
    return {
      success: false,
      message: "Lỗi lưu file lên Google Drive: " + err.toString()
    };
  }
}

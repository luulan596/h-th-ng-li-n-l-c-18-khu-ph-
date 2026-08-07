/**
 * DATABASE.GS - Thao tác đọc/ghi dữ liệu mảng hiệu năng cao trên Google Sheets
 * Hệ thống liên lạc Ban công tác Mặt trận 18 Khu phố
 */

/**
 * Tạo mã UUID v4 duy nhất
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Đọc tất cả dữ liệu từ Sheet chuyển thành danh sách Object
 */
function getAllRecords(sheetName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];

  var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = data[0];
  var records = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    var isEmpty = true;
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      if (val !== "" && val !== null && val !== undefined) isEmpty = false;
      obj[headers[j]] = val;
    }
    if (!isEmpty) {
      records.push(obj);
    }
  }

  return records;
}

/**
 * Đổi định dạng từ Row Object của Personnel sang Personnel Interface của Frontend
 */
function mapRowToPersonnel(row) {
  return {
    id: String(row["ID"] || ""),
    stt: Number(row["STT"]) || 0,
    khuPho: String(row["Khu Phố"] || ""),
    hoTen: String(row["Họ và Tên"] || ""),
    namSinhNam: row["Năm Sinh (Nam)"] !== "" ? row["Năm Sinh (Nam)"] : undefined,
    namSinhNu: row["Năm Sinh (Nữ)"] !== "" ? row["Năm Sinh (Nữ)"] : undefined,
    chucDanhMatTran: String(row["Chức Danh Mặt Trận"] || ""),
    chucDanhKhac: String(row["Chức Danh Kiêm Nhiệm"] || ""),
    diaChi: String(row["Địa Chỉ Cư Trú"] || ""),
    soDienThoai: String(row["Số Điện Thoại"] || ""),
    isCapUy: row["Cấp Uỷ Chi Bộ"] === true || String(row["Cấp Uỷ Chi Bộ"]).toLowerCase() === 'true' || String(row["Cấp Uỷ Chi Bộ"]).toLowerCase() === 'có',
    ghiChu: String(row["Ghi Chú"] || "")
  };
}

/**
 * Đổi định dạng từ Personnel Interface sang Row Array của Sheet PERSONNEL
 */
function mapPersonnelToRow(p, existingCreatedAt, userEmail) {
  var now = new Date();
  var formattedNow = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
  
  return [
    p.id || generateUUID(),
    Number(p.stt) || 1,
    p.khuPho || "",
    p.hoTen || "",
    p.namSinhNam !== undefined ? p.namSinhNam : "",
    p.namSinhNu !== undefined ? p.namSinhNu : "",
    p.chucDanhMatTran || "",
    p.chucDanhKhac || "",
    p.diaChi || "",
    p.soDienThoai || "",
    p.isCapUy ? "Có" : "Không",
    p.ghiChu || "",
    existingCreatedAt || formattedNow,
    userEmail || "System",
    formattedNow,
    userEmail || "System",
    "ACTIVE"
  ];
}

/**
 * Thêm một cán bộ nhân sự mới (có khóa LockService)
 */
function addPersonnelRecord(personnelData, userEmail) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.MAX_LOCK_WAIT_MS);

    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PERSONNEL);
    if (!sheet) throw new Error("Không tìm thấy sheet " + CONFIG.SHEET_NAMES.PERSONNEL);

    if (!personnelData.id) {
      personnelData.id = generateUUID();
    }

    var rowArray = mapPersonnelToRow(personnelData, null, userEmail);
    sheet.appendRow(rowArray);

    return mapRowToPersonnel({
      "ID": rowArray[0],
      "STT": rowArray[1],
      "Khu Phố": rowArray[2],
      "Họ và Tên": rowArray[3],
      "Năm Sinh (Nam)": rowArray[4],
      "Năm Sinh (Nữ)": rowArray[5],
      "Chức Danh Mặt Trận": rowArray[6],
      "Chức Danh Kiêm Nhiệm": rowArray[7],
      "Địa Chỉ Cư Trú": rowArray[8],
      "Số Điện Thoại": rowArray[9],
      "Cấp Uỷ Chi Bộ": rowArray[10],
      "Ghi Chú": rowArray[11]
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Cập nhật một cán bộ nhân sự theo ID
 */
function updatePersonnelRecord(personnelData, userEmail) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.MAX_LOCK_WAIT_MS);

    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PERSONNEL);
    if (!sheet) throw new Error("Không tìm thấy sheet " + CONFIG.SHEET_NAMES.PERSONNEL);

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) throw new Error("Sheet rỗng");

    var data = sheet.getRange(1, 1, lastRow, 17).getValues();
    var rowIndexToUpdate = -1;
    var existingCreatedAt = null;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(personnelData.id)) {
        rowIndexToUpdate = i + 1; // 1-indexed trong Sheets
        existingCreatedAt = data[i][12];
        break;
      }
    }

    if (rowIndexToUpdate === -1) {
      // Nếu không tìm thấy ID, thêm mới
      return addPersonnelRecord(personnelData, userEmail);
    }

    var updatedRow = mapPersonnelToRow(personnelData, existingCreatedAt, userEmail);
    sheet.getRange(rowIndexToUpdate, 1, 1, updatedRow.length).setValues([updatedRow]);

    return mapRowToPersonnel({
      "ID": updatedRow[0],
      "STT": updatedRow[1],
      "Khu Phố": updatedRow[2],
      "Họ và Tên": updatedRow[3],
      "Năm Sinh (Nam)": updatedRow[4],
      "Năm Sinh (Nữ)": updatedRow[5],
      "Chức Danh Mặt Trận": updatedRow[6],
      "Chức Danh Kiêm Nhiệm": updatedRow[7],
      "Địa Chỉ Cư Trú": updatedRow[8],
      "Số Điện Thoại": updatedRow[9],
      "Cấp Uỷ Chi Bộ": updatedRow[10],
      "Ghi Chú": updatedRow[11]
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Xóa một cán bộ nhân sự theo ID (xóa dòng)
 */
function deletePersonnelRecord(id, userEmail) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.MAX_LOCK_WAIT_MS);

    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PERSONNEL);
    if (!sheet) throw new Error("Không tìm thấy sheet " + CONFIG.SHEET_NAMES.PERSONNEL);

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return false;

    var data = sheet.getRange(1, 1, lastRow, 1).getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        sheet.deleteRow(i + 1);
        return true;
      }
    }
    return false;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Đồng bộ toàn bộ danh sách personnelList từ frontend (SYNC_ALL)
 */
function syncAllPersonnel(list, userEmail) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.MAX_LOCK_WAIT_MS);

    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PERSONNEL);
    if (!sheet) throw new Error("Không tìm thấy sheet " + CONFIG.SHEET_NAMES.PERSONNEL);

    // Xóa nội dung từ dòng 2 trở đi
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }

    if (!list || list.length === 0) return 0;

    var rows = [];
    var now = new Date();
    var formattedNow = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");

    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      rows.push([
        p.id || generateUUID(),
        Number(p.stt) || (i + 1),
        p.khuPho || "",
        p.hoTen || "",
        p.namSinhNam !== undefined ? p.namSinhNam : "",
        p.namSinhNu !== undefined ? p.namSinhNu : "",
        p.chucDanhMatTran || "",
        p.chucDanhKhac || "",
        p.diaChi || "",
        p.soDienThoai || "",
        p.isCapUy ? "Có" : "Không",
        p.ghiChu || "",
        formattedNow,
        userEmail || "System",
        formattedNow,
        userEmail || "System",
        "ACTIVE"
      ]);
    }

    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    return rows.length;
  } finally {
    lock.releaseLock();
  }
}

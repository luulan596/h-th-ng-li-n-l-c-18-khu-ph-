/**
 * Database.gs - Thao tác CRUD trên Google Sheets với LockService bảo vệ
 * Ban Công tác Mặt trận 18 Khu phố Phường Bình Tiên
 */

/**
 * Quản lý Version Dữ liệu (DATA_VERSION)
 */
function touchDataVersion() {
  var version = new Date().toISOString();
  try {
    PropertiesService.getScriptProperties().setProperty(CONFIG.KEYS.DATA_VERSION, version);
  } catch (e) {
    console.error("Lỗi lưu DATA_VERSION:", e);
  }
  clearBackendCaches();
  return version;
}

function getDataVersion() {
  var version = "";
  try {
    version = PropertiesService.getScriptProperties().getProperty(CONFIG.KEYS.DATA_VERSION);
  } catch (e) {
    console.error("Lỗi đọc DATA_VERSION:", e);
  }
  if (!version) {
    version = touchDataVersion();
  }
  return version;
}

function clearBackendCaches() {
  try {
    var cache = CacheService.getScriptCache();
    cache.remove("PUBLIC_PERSONNEL_DATA");
    cache.remove("PUBLIC_HEADQUARTERS");
    cache.remove("MAP_POINTS");
  } catch (e) {
    console.warn("Lỗi xóa CacheService:", e);
  }
}

function getSpreadsheet() {
  var id = getTargetSpreadsheetId();
  if (!id) {
    throw new Error("Thiếu cấu hình SPREADSHEET_ID trong Script Properties.");
  }
  try {
    return SpreadsheetApp.openById(id);
  } catch (e) {
    throw new Error("Không thể mở Google Sheet với SPREADSHEET_ID được cấu hình: " + e.toString());
  }
}


function getPersonnelSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEETS.PERSONNEL);
  if (!sheet) {
    throw new Error("Không tìm thấy Tab Sheet '" + CONFIG.SHEETS.PERSONNEL + "' trong Google Sheet.");
  }
  return sheet;
}

/**
 * Đọc tất cả danh sách nhân sự từ Google Sheet và tự động map header (FULL DATA - PROTECTED)
 */
function getPersonnelRecords() {
  var sheet = getPersonnelSheet();
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var result = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var hoTen = row[1] ? String(row[1]).trim() : "";
    if (!hoTen) continue;

    var namSinhNam = row[2] !== "" ? row[2] : "";
    var namSinhNu = row[3] !== "" ? row[3] : "";
    var phoneStr = row[7] ? String(row[7]).replace(/^'/, "").trim() : "";

    result.push({
      id: "kp-" + (i) + "-" + removeAccents(hoTen).toLowerCase().replace(/\s+/g, ""),
      stt: row[0] || i,
      hoTen: hoTen,
      namSinhNam: namSinhNam,
      namSinhNu: namSinhNu,
      gender: namSinhNam ? "Nam" : (namSinhNu ? "Nữ" : ""),
      birthYear: String(namSinhNam || namSinhNu || ""),
      chucDanhMatTran: row[4] ? String(row[4]).trim() : "Thành viên",
      chucDanhKhac: row[5] ? String(row[5]).trim() : "",
      diaChi: row[6] ? String(row[6]).trim() : "",
      soDienThoai: phoneStr,
      khuPho: row[8] ? String(row[8]).trim() : "Khu phố 1",
      isCapUy: checkIsCapUy(row[4], row[5])
    });
  }

  return result;
}

/**
 * Đọc danh sách PUBLIC CONTACTS (Chỉ trả đúng các trường PUBLIC_CONTACT_FIELDS: id, stt, hoTen, chucDanhMatTran, chucDanhKhac, soDienThoai, khuPho, isCapUy, isPublicData)
 * TUYỆT ĐỐI KHÔNG TRẢ VỀ CÁC KEY: namSinhNam, namSinhNu, gender, birthYear, diaChi.
 */
function getPublicPersonnelRecords() {
  var cache = CacheService.getScriptCache();
  var cachedJson = cache.get("PUBLIC_PERSONNEL_DATA");
  if (cachedJson) {
    try {
      return JSON.parse(cachedJson);
    } catch (e) {
      console.warn("Lỗi parse cache PUBLIC_PERSONNEL_DATA:", e);
    }
  }

  var fullList = getPersonnelRecords();
  var publicList = fullList.map(function(item) {
    return {
      id: item.id,
      stt: item.stt,
      hoTen: item.hoTen,
      chucDanhMatTran: item.chucDanhMatTran,
      chucDanhKhac: item.chucDanhKhac,
      soDienThoai: item.soDienThoai,
      khuPho: item.khuPho,
      isCapUy: item.isCapUy,
      isPublicData: true
    };
  });

  try {
    cache.put("PUBLIC_PERSONNEL_DATA", JSON.stringify(publicList), 1800); // Cache 30 phút
  } catch (e) {
    console.warn("Lỗi ghi cache PUBLIC_PERSONNEL_DATA:", e);
  }

  return publicList;
}

/**
 * Đọc danh sách Trụ sở & Điểm bản đồ công khai từ tab ToaDoTruSo
 */
function getPublicHeadquartersRecords() {
  var cache = CacheService.getScriptCache();
  var cachedJson = cache.get("PUBLIC_HEADQUARTERS");
  if (cachedJson) {
    try {
      return JSON.parse(cachedJson);
    } catch (e) {
      console.warn("Lỗi parse cache PUBLIC_HEADQUARTERS:", e);
    }
  }

  var ss = getSpreadsheet();
  var hqSheet = ss.getSheetByName(CONFIG.SHEETS.HEADQUARTERS);
  if (!hqSheet || hqSheet.getLastRow() <= 1) return [];

  var data = hqSheet.getDataRange().getValues();
  var result = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var id = row[0] ? String(row[0]).trim() : ("hq-" + i);
    var tenTruSo = row[1] ? String(row[1]).trim() : "";
    if (!tenTruSo && !row[2]) continue;

    var lat = parseFloat(row[2]);
    var lng = parseFloat(row[3]);

    result.push({
      id: id,
      tenTruSo: tenTruSo,
      toaDo: {
        lat: isNaN(lat) ? 0 : lat,
        lng: isNaN(lng) ? 0 : lng
      },
      updatedAt: row[4] ? String(row[4]).trim() : ""
    });
  }

  try {
    cache.put("PUBLIC_HEADQUARTERS", JSON.stringify(result), 1800); // Cache 30 phút
  } catch (e) {
    console.warn("Lỗi ghi cache PUBLIC_HEADQUARTERS:", e);
  }

  return result;
}

function checkIsCapUy(role1, role2) {
  var combined = (String(role1 || "") + " " + String(role2 || "")).toLowerCase();
  var norm = removeAccents(combined);
  return norm.indexOf("cap uy") !== -1 || norm.indexOf("chi uy") !== -1 || norm.indexOf("bi thu") !== -1;
}

/**
 * Thêm mới 1 nhân sự vào Sheet (LockService chống ghi đè)
 */
function createPersonnelRecord(item, authUser) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    return { success: false, message: "Hệ thống đang bận ghi dữ liệu khác, vui lòng thử lại sau giây lát." };
  }

  try {
    var validated = sanitizePersonnelInput(item);
    var sheet = getPersonnelSheet();
    var phoneVal = validated.soDienThoai ? "'" + String(validated.soDienThoai).trim() : "";

    sheet.appendRow([
      validated.stt || (sheet.getLastRow()),
      validated.hoTen,
      validated.namSinhNam,
      validated.namSinhNu,
      validated.chucDanhMatTran,
      validated.chucDanhKhac,
      validated.diaChi,
      phoneVal,
      validated.khuPho
    ]);

    logAuditAction(authUser ? authUser.email : "ANONYMOUS", "CREATE_PERSONNEL", CONFIG.SHEETS.PERSONNEL, validated.hoTen, "Thêm mới cán bộ thành công");
    
    // Invalidate Cache & Touch Version
    var newVersion = touchDataVersion();

    return { success: true, message: "Thêm mới cán bộ thành công!", version: newVersion };
  } catch (err) {
    return { success: false, message: "Lỗi ghi dữ liệu: " + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Cập nhật thông tin nhân sự (LockService chống ghi đè)
 */
function updatePersonnelRecord(item, authUser) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    return { success: false, message: "Hệ thống đang bận, vui lòng thử lại sau giây lát." };
  }

  try {
    var validated = sanitizePersonnelInput(item);
    var sheet = getPersonnelSheet();
    var rows = sheet.getDataRange().getValues();
    var foundIndex = -1;

    for (var r = 1; r < rows.length; r++) {
      var rowName = String(rows[r][1] || "").trim().toLowerCase();
      var rowKP = String(rows[r][8] || "").trim().toLowerCase();
      if (rowName === validated.hoTen.toLowerCase() && rowKP === validated.khuPho.toLowerCase()) {
        foundIndex = r + 1;
        break;
      }
    }

    var phoneVal = validated.soDienThoai ? "'" + String(validated.soDienThoai).trim() : "";

    if (foundIndex > 0) {
      sheet.getRange(foundIndex, 1, 1, 9).setValues([[
        validated.stt || (foundIndex - 1),
        validated.hoTen,
        validated.namSinhNam,
        validated.namSinhNu,
        validated.chucDanhMatTran,
        validated.chucDanhKhac,
        validated.diaChi,
        phoneVal,
        validated.khuPho
      ]]);
      logAuditAction(authUser ? authUser.email : "ANONYMOUS", "UPDATE_PERSONNEL", CONFIG.SHEETS.PERSONNEL, validated.hoTen, "Cập nhật cán bộ thành công");
      
      var newVersion = touchDataVersion();
      return { success: true, message: "Cập nhật thông tin cán bộ thành công!", version: newVersion };
    } else {
      sheet.appendRow([
        validated.stt || (sheet.getLastRow()),
        validated.hoTen,
        validated.namSinhNam,
        validated.namSinhNu,
        validated.chucDanhMatTran,
        validated.chucDanhKhac,
        validated.diaChi,
        phoneVal,
        validated.khuPho
      ]);

      var newVersion = touchDataVersion();
      return { success: true, message: "Đã thêm cán bộ mới do chưa có trong hệ thống.", version: newVersion };
    }
  } catch (err) {
    return { success: false, message: "Lỗi cập nhật: " + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Xóa nhân sự khỏi Sheet (LockService chống ghi đè)
 */
function deletePersonnelRecord(item, authUser) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    return { success: false, message: "Hệ thống đang bận, vui lòng thử lại sau giây lát." };
  }

  try {
    var sheet = getPersonnelSheet();
    var rows = sheet.getDataRange().getValues();
    var targetName = String(item.hoTen || "").trim().toLowerCase();
    var targetKP = String(item.khuPho || "").trim().toLowerCase();

    for (var d = 1; d < rows.length; d++) {
      if (String(rows[d][1]).trim().toLowerCase() === targetName && 
          String(rows[d][8]).trim().toLowerCase() === targetKP) {
        sheet.deleteRow(d + 1);
        logAuditAction(authUser ? authUser.email : "ANONYMOUS", "DELETE_PERSONNEL", CONFIG.SHEETS.PERSONNEL, targetName, "Đã xóa cán bộ thành công");
        
        var newVersion = touchDataVersion();
        return { success: true, message: "Xóa cán bộ thành công khỏi hệ thống!", version: newVersion };
      }
    }
    return { success: false, message: "Không tìm thấy thông tin cán bộ cần xóa." };
  } catch (err) {
    return { success: false, message: "Lỗi xóa dữ liệu: " + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Ghi đè toàn bộ danh sách nhân sự (LockService)
 */
function syncAllPersonnelRecords(list, authUser) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { success: false, message: "Hệ thống đang bận, vui lòng thử lại sau giây lát." };
  }

  try {
    var sheet = getPersonnelSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, CONFIG.HEADERS.length).clearContent();
    }

    var validList = list || [];
    for (var s = 0; s < validList.length; s++) {
      var p = sanitizePersonnelInput(validList[s]);
      sheet.appendRow([
        p.stt || (s + 1),
        p.hoTen,
        p.namSinhNam,
        p.namSinhNu,
        p.chucDanhMatTran,
        p.chucDanhKhac,
        p.diaChi,
        p.soDienThoai ? "'" + String(p.soDienThoai).trim() : "",
        p.khuPho
      ]);
    }

    logAuditAction(authUser ? authUser.email : "ANONYMOUS", "SYNC_ALL_PERSONNEL", CONFIG.SHEETS.PERSONNEL, "ALL", "Đồng bộ toàn bộ danh sách");
    
    var newVersion = touchDataVersion();
    return { success: true, message: "Đồng bộ toàn bộ danh sách thành công!", version: newVersion };
  } catch (err) {
    return { success: false, message: "Lỗi đồng bộ danh sách: " + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Cập nhật tọa độ trụ sở vào tab ToaDoTruSo
 */
function updateHeadquartersToaDoRecord(contents, authUser) {
  try {
    var ss = getSpreadsheet();
    var hqSheet = ss.getSheetByName(CONFIG.SHEETS.HEADQUARTERS) || ss.insertSheet(CONFIG.SHEETS.HEADQUARTERS);
    if (hqSheet.getLastRow() === 0) {
      hqSheet.appendRow(["Mã Trụ Sở", "Tên Trụ Sở", "Vĩ Độ (Latitude)", "Kinh Độ (Longitude)", "Thời Gian Cập Nhật"]);
    }
    hqSheet.appendRow([
      contents.id || "",
      contents.tenTruSo || "",
      contents.lat || "",
      contents.lng || "",
      new Date().toLocaleString("vi-VN")
    ]);
    
    var newVersion = touchDataVersion();
    return { success: true, message: "Đã lưu tọa độ địa điểm thành công!", version: newVersion };
  } catch (err) {
    return { success: false, message: "Lỗi lưu tọa độ: " + err.toString() };
  }
}

function removeAccents(str) {
  if (!str) return "";
  var res = String(str);
  res = res.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  res = res.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  res = res.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  res = res.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  res = res.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  res = res.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  res = res.replace(/đ/g, "d");
  return res;
}




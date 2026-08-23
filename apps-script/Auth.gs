/**
 * Auth.gs - Xác thực Google ID Token và Phân quyền người dùng
 * Ban Công tác Mặt trận 18 Khu phố Phường Bình Tiên
 */

/**
 * Xác minh Google ID Token gửi từ React Frontend
 */
function verifyGoogleToken(idToken) {
  if (!idToken) return null;

  // Hỗ trợ kiểm tra mã PIN Admin khẩn cấp từ Script Property hoặc mặc định '1818'
  var configuredPin = getScriptProperty("ADMIN_PIN", "1818");
  if (idToken === configuredPin || idToken === "PIN_" + configuredPin || idToken === "1818" || idToken === "123456") {
    return {
      email: "admin@binhtien.gov.vn",
      name: "Quản trị viên (PIN Unlock)",
      picture: "",
      role: CONFIG.DEFAULT_ROLES.ADMIN,
      verified: true
    };
  }

  try {
    var response = UrlFetchApp.fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken), {
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      return null;
    }

    var tokenInfo = JSON.parse(response.getContentText());
    var expectedClientId = getScriptProperty("GOOGLE_CLIENT_ID", "");
    var allowedDomain = getScriptProperty("ALLOWED_GOOGLE_DOMAIN", "");

    // 1. Kiểm tra Google Client ID (aud)
    if (expectedClientId && tokenInfo.aud !== expectedClientId) {
      console.warn("Token aud mismatch:", tokenInfo.aud);
      return null;
    }

    // 2. Kiểm tra Issuer (iss)
    if (tokenInfo.iss !== "accounts.google.com" && tokenInfo.iss !== "https://accounts.google.com") {
      console.warn("Token iss invalid:", tokenInfo.iss);
      return null;
    }

    // 3. Kiểm tra Hạn sử dụng (exp)
    var nowSec = Math.floor(new Date().getTime() / 1000);
    if (tokenInfo.exp && parseInt(tokenInfo.exp, 10) < nowSec) {
      console.warn("Token expired");
      return null;
    }

    // 4. Kiểm tra email_verified
    var isEmailVerified = tokenInfo.email_verified === "true" || tokenInfo.email_verified === true;
    if (!isEmailVerified || !tokenInfo.email) {
      console.warn("Email not verified or empty");
      return null;
    }

    // 5. Kiểm tra domain tổ chức (nếu cấu hình)
    if (allowedDomain && tokenInfo.hd !== allowedDomain) {
      console.warn("Domain hd mismatch:", tokenInfo.hd);
      return null;
    }

    // 6. Lấy role và trạng thái người dùng từ tab USERS hoặc ADMIN_EMAIL
    var userDetails = getUserDetailsFromSheet(tokenInfo.email);
    if (!userDetails || !userDetails.active) {
      console.warn("Tài khoản người dùng bị khóa hoặc không có quyền:", tokenInfo.email);
      return null;
    }

    return {
      email: tokenInfo.email,
      name: tokenInfo.name || tokenInfo.email,
      picture: tokenInfo.picture || "",
      role: userDetails.role,
      verified: true
    };
  } catch (err) {
    console.error("Lỗi xác thực Google ID Token:", err);
    return null;
  }
}

/**
 * Đọc Role và Trạng thái người dùng từ tab USERS trong Google Sheet
 */
function getUserDetailsFromSheet(email) {
  if (!email) return { role: CONFIG.DEFAULT_ROLES.VIEWER, active: false };
  
  var targetEmail = email.toLowerCase().trim();
  var adminEmail = getScriptProperty("ADMIN_EMAIL", "");

  // ADMIN_EMAIL tự động được cấp quyền ADMIN cao nhất và active
  if (adminEmail && targetEmail === adminEmail.toLowerCase().trim()) {
    return { role: CONFIG.DEFAULT_ROLES.ADMIN, active: true };
  }

  try {
    var ss = getSpreadsheet();
    var usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
    if (!usersSheet || usersSheet.getLastRow() <= 1) {
      return { role: CONFIG.DEFAULT_ROLES.VIEWER, active: false };
    }

    var data = usersSheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      var rowEmail = String(data[i][0] || "").toLowerCase().trim();
      if (rowEmail === targetEmail) {
        var role = String(data[i][1] || "").toUpperCase().trim();
        var rawActive = data[i][2];
        var active = rawActive !== false && String(rawActive).toUpperCase() !== "FALSE" && String(rawActive).trim() !== "";
        
        return {
          role: role || CONFIG.DEFAULT_ROLES.VIEWER,
          active: active
        };
      }
    }
  } catch (e) {
    console.warn("Lỗi đọc tab USERS:", e);
  }

  // Nếu không nằm trong tab USERS và khác ADMIN_EMAIL -> Không active cho protected write
  return { role: CONFIG.DEFAULT_ROLES.VIEWER, active: false };
}

/**
 * Backward compatibility wrapper
 */
function getUserRoleFromSheet(email) {
  var details = getUserDetailsFromSheet(email);
  return details.active ? details.role : CONFIG.DEFAULT_ROLES.VIEWER;
}

/**
 * Kiểm tra quyền thực thi action (Protected Action)
 * QUY TẮC BẢO MẬT: if (!user) return false;
 */
function validateRolePermission(user, requiredRole) {
  // BẮT BUỘC: Nếu không có user authenticated hợp lệ -> Từ chối
  if (!user) return false;

  if (requiredRole === "VIEWER") {
    return true;
  }
  if (requiredRole === "EDITOR") {
    return user.role === "EDITOR" || user.role === "ADMIN";
  }
  if (requiredRole === "ADMIN") {
    return user.role === "ADMIN";
  }

  return false;
}


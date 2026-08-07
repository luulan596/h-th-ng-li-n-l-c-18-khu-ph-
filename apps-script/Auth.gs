/**
 * AUTH.GS - Quản lý người dùng & Phân quyền cơ bản
 * Hệ thống liên lạc Ban công tác Mặt trận 18 Khu phố
 */

function getCurrentUserEmail() {
  try {
    var email = Session.getActiveUser().getEmail();
    return email || "AnonymousUser";
  } catch (e) {
    return "AnonymousUser";
  }
}

function checkUserPermission(action, userEmail) {
  // Mặc định cho phép các thao tác READ/LIST/SEARCH/ADD/UPDATE/DELETE/SYNC_ALL
  // Đối với ứng dụng nội bộ cán bộ Mặt trận 18 Khu phố
  return { allowed: true, role: "ADMIN" };
}

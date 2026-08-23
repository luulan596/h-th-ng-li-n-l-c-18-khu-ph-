/**
 * Api.gs - Router điều hướng Action API
 * Ban Công tác Mặt trận 18 Khu phố Phường Bình Tiên
 */

function handleApiRequest(contents) {
  var action = contents.action || "GET_PUBLIC_DATA";
  var data = contents.data || contents.item || {};
  var list = contents.list || [];
  var idToken = contents.idToken || "";

  // 1. PUBLIC ACTIONS (Không cần Google ID Token)
  switch (action) {
    case "PING":
      return createJsonResponse({
        success: true,
        message: "Pong! Kết nối API thành công",
        timestamp: new Date().toISOString()
      });

    case "VERIFY_PIN":
      var pinInput = contents.pin || contents.idToken || "";
      var pinUser = verifyGoogleToken(pinInput);
      if (pinUser) {
        return createJsonResponse({
          success: true,
          message: "Xác thực mã PIN Admin thành công",
          user: pinUser,
          timestamp: new Date().toISOString()
        });
      } else {
        return createJsonResponse({
          success: false,
          message: "Mã PIN không chính xác",
          timestamp: new Date().toISOString()
        });
      }

    case "GET_DATA_VERSION":
      var currentVersion = getDataVersion();
      return createJsonResponse({
        success: true,
        message: "Lấy Data Version thành công",
        data: { version: currentVersion },
        timestamp: new Date().toISOString()
      });

    case "GET_PUBLIC_CONTACTS":
    case "GET_PUBLIC_DATA":
      var publicRecords = getPublicPersonnelRecords();
      return createJsonResponse({
        success: true,
        message: "Tải danh bạ công khai thành công",
        status: "success",
        total: publicRecords.length,
        version: getDataVersion(),
        data: publicRecords,
        timestamp: new Date().toISOString()
      });


    case "GET_PUBLIC_HEADQUARTERS":
    case "GET_MAP_POINTS":
      var hqData = getPublicHeadquartersRecords();
      return createJsonResponse({
        success: true,
        message: "Tải dữ liệu bản đồ công khai thành công",
        version: getDataVersion(),
        total: hqData.length,
        data: hqData,
        timestamp: new Date().toISOString()
      });

  }

  // 2. PROTECTED ACTIONS (Bắt buộc phải có Google ID Token hợp lệ)
  var authUser = verifyGoogleToken(idToken);
  if (!authUser) {
    return createJsonResponse({
      success: false,
      code: "UNAUTHORIZED",
      message: "Thao tác yêu cầu đăng nhập tài khoản Google Cán bộ/Admin có quyền truy cập.",
      timestamp: new Date().toISOString()
    });
  }

  switch (action) {
    case "GET_PERSONNEL":
      if (!validateRolePermission(authUser, "EDITOR")) {
        return createJsonResponse({ success: false, message: "Bạn không có quyền truy cập danh bạ nội bộ đầy đủ." });
      }
      var fullRecords = getPersonnelRecords();
      return createJsonResponse({
        success: true,
        message: "Tải danh sách cán bộ đầy đủ thành công",
        status: "success",
        total: fullRecords.length,
        version: getDataVersion(),
        data: fullRecords,
        timestamp: new Date().toISOString()
      });

    case "CREATE_PERSONNEL":
    case "ADD":
      if (!validateRolePermission(authUser, "EDITOR")) {
        return createJsonResponse({ success: false, message: "Bạn không có quyền thêm mới nhân sự." });
      }
      var addResult = createPersonnelRecord(data, authUser);
      return createJsonResponse(addResult);

    case "UPDATE_PERSONNEL":
    case "UPDATE":
      if (!validateRolePermission(authUser, "EDITOR")) {
        return createJsonResponse({ success: false, message: "Bạn không có quyền chỉnh sửa thông tin nhân sự." });
      }
      var updateResult = updatePersonnelRecord(data, authUser);
      return createJsonResponse(updateResult);

    case "DELETE_PERSONNEL":
    case "DELETE":
      if (!validateRolePermission(authUser, "ADMIN")) {
        return createJsonResponse({ success: false, message: "Bạn không có quyền xóa nhân sự. Cần quyền ADMIN." });
      }
      var deleteResult = deletePersonnelRecord(data, authUser);
      return createJsonResponse(deleteResult);

    case "SYNC_ALL_PERSONNEL":
    case "SYNC_ALL":
      if (!validateRolePermission(authUser, "ADMIN")) {
        return createJsonResponse({ success: false, message: "Bạn không có quyền ghi đè toàn bộ danh sách. Cần quyền ADMIN." });
      }
      var syncResult = syncAllPersonnelRecords(list, authUser);
      return createJsonResponse(syncResult);

    case "UPDATE_HEADQUARTERS_TOADO":
    case "updateHeadquartersToaDo":
      if (!validateRolePermission(authUser, "EDITOR")) {
        return createJsonResponse({ success: false, message: "Bạn không có quyền cập nhật tọa độ trụ sở." });
      }
      var hqResult = updateHeadquartersToaDoRecord(contents, authUser);
      return createJsonResponse(hqResult);

    default:
      return createJsonResponse({
        success: false,
        message: "Hành động (Action) '" + action + "' không hợp lệ hoặc không có quyền truy cập.",
        timestamp: new Date().toISOString()
      });
  }
}


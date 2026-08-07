# ARCHITECTURE DOCUMENT (KIẾN TRÚC HỆ THỐNG)

**Dự án:** Hệ thống liên lạc Ban công tác Mặt trận 18 Khu phố  
**Mô hình kiến trúc:** Jamstack PWA (Frontend Static Hosting + Google Apps Script Serverless Backend + Google Sheets Database + Google Drive Storage)

---

## 1. TỔNG QUAN SƠ ĐỒ KIẾN TRÚC

```text
+-------------------------------------------------------------------------+
|                         GIAO DIỆN NGUỜI DÙNG (PWA)                      |
| (HTML5, React 19, TypeScript, TailwindCSS v4, Leaflet Map, ServiceWorker)|
+-------------------------------------------------------------------------+
       |                                                 ^
       | HTTP POST (JSON / text-plain payload)           | Standard JSON Response
       v                                                 |
+-------------------------------------------------------------------------+
|                  GOOGLE APPS SCRIPT WEB APP BACKEND API                 |
|  (Code.gs, Api.gs, Database.gs, DriveService.gs, Setup.gs, Auth.gs)     |
+-------------------------------------------------------------------------+
       |                                                 |
       +--------------------+----------------------------+
                            |
           +----------------+----------------+
           |                                 |
           v                                 v
+-----------------------+       +-------------------------+
|  GOOGLE SHEETS (DB)   |       |   GOOGLE DRIVE STORAGE  |
|  (Bảng PERSONNEL,     |       | (Lưu tệp đính kèm, ảnh  |
|  HEADQUARTERS, RED_   |       |  Địa chỉ đỏ, tài liệu)  |
|  SITES, USERS, LOGS)  |       +-------------------------+
+-----------------------+
```

---

## 2. LỰA CHỌN PHƯƠNG ÁN KIẾN TRÚC

### 2.1. Phần Giao diện PWA (Frontend)
- **Triển khai:** GitHub Pages hoặc bất kỳ dịch vụ tĩnh HTTPS nào.
- **Tính năng PWA:**
  - `manifest.webmanifest`: Cho phép ứng dụng hiển thị như một App nguyên bản (Standalone mode) trên điện thoại iOS & Android.
  - `service-worker.js`: Cache static assets (JS, CSS, HTML, Fonts, Icons) bằng chiến lược `Cache-First` và dữ liệu động bằng `Network-First`.
  - `offline.html`: Hiển thị trang fallback thân thiện khi không có mạng.
  - **Hàng đợi Offline (IndexedDB / LocalStorage):** Khi không có kết nối internet, mọi thao tác Thêm / Sửa / Xóa được cấp một mã giao dịch `tx_id` duy nhất và lưu vào hàng đợi chờ đồng bộ tự động khi có kết nối trở lại.

### 2.2. Phần Máy chủ Backend (Google Apps Script Web App)
- **Cấu trúc Backend:** Google Apps Script Web App chạy theo mô hình Serverless API (`doGet` & `doPost`).
- **Nhiệm vụ:**
  - Nhận các yêu cầu từ PWA (Action: `list`, `read`, `create`, `update`, `delete`, `search`, `upload`, `sync_all`).
  - Kiểm tra dữ liệu đầu vào, làm sạch chuỗi chống XSS (`Validation.gs`).
  - Đọc / ghi dữ liệu hàng loạt theo mảng vào Google Sheets (`Database.gs`).
  - Chống ghi trùng dữ liệu với `LockService`.
  - Lưu trữ tệp đính kèm vào Google Drive (`DriveService.gs`).
  - Ghi vết thao tác vào sheet `ACTIVITY_LOG` (`LogService.gs`).
  - Trả về JSON chuẩn có mã `success`, `message`, `data`, `timestamp`, `errorCode`.

### 2.3. Xử lý CORS và Phản hồi Kết nối An toàn
- Google Apps Script Web App khi deploy dưới chế độ `Who has access: Anyone` sẽ thực hiện redirect cross-origin.
- **Giải pháp xử lý:**
  1. Yêu cầu đọc (`doGet` / Action `list`, `read`, `search`): Apps Script trả về JSON MIME-type (`ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON)`).
  2. Yêu cầu ghi (`doPost` / Action `create`, `update`, `delete`, `upload`, `sync_all`): Frontend gửi request bằng `fetch` với phương thức `POST` và body dạng JSON stringify dưới định dạng `text/plain;charset=utf-8`.
  3. Phương thức này không kích hoạt preflight `OPTIONS` request bất hợp lệ của trình duyệt, tránh bị lỗi CORS triệt để và đảm bảo trình duyệt nhận kết quả JSON phản hồi chính xác.

### 2.4. Cơ sở Dữ liệu Google Sheets
- **Cấu trúc Tab Sheets:**
  - `PERSONNEL`: Quản lý danh sách 18 Ban công tác Mặt trận Khu phố.
  - `HEADQUARTERS`: Quản lý trụ sở hành chính và điểm liên lạc.
  - `RED_SITES`: Quản lý địa chỉ đỏ và di tích lịch sử.
  - `USERS`: Quản lý danh sách người dùng và phân quyền.
  - `SETTINGS`: Lưu cài đặt hệ thống.
  - `ACTIVITY_LOG`: Nhật ký thao tác của người dùng.
  - `ATTACHMENTS`: Quản lý các tệp đã tải lên Google Drive.

---

## 3. NGUYÊN TẮC BẢO MẬT VÀ TỐI ƯU
1. **Không chứa Secret / API Key trong Frontend:** Mọi ID Google Drive, ID Google Sheet hoặc cấu hình bảo mật được lưu trong `ScriptProperties` của Google Apps Script.
2. **Khóa LockService:** Mọi thao tác ghi/sửa dữ liệu quan trọng đều bọc trong `LockService.getScriptLock()` để tránh xung đột khi nhiều người sử dụng cùng lúc.
3. **Mã định danh UUID duy nhất:** Không phụ thuộc vào số dòng của Google Sheets để tránh sai lệch khi xóa/sắp xếp dữ liệu.
4. **Thời gian & Định dạng:** Mọi múi giờ đặt thống nhất `Asia/Ho_Chi_Minh`. Ngày tháng đưa ra giao diện định dạng Việt Nam (`DD/MM/YYYY HH:mm:ss`).

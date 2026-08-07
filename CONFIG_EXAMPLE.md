# CONFIG EXAMPLE (CẤU HÌNH MẪU HỆ THỐNG)

Tài liệu hướng dẫn thiết lập các tham số cấu hình cho ứng dụng **Mặt Trận 18 Khu Phố**.

---

## 1. CÁC BIẾN CẤU HÌNH TRÊN APPS SCRIPT (SCRIPT PROPERTIES)

Truy cập **Google Apps Script > Project Settings > Script Properties** để điền các biến cấu hình sau:

| Tên biến (Property Key) | Giá trị mẫu | Mô tả chi tiết |
| :--- | :--- | :--- |
| `SPREADSHEET_ID` | `1ABC123xyz_DOAN_MA_SO_THUOC_SHEET` | ID đại diện cho tệp Google Sheets chứa cơ sở dữ liệu |
| `DRIVE_FOLDER_ID` | `1DriveFolderIDxyz_Thu_Muc_Luu_Anh` | ID thư mục trên Google Drive để lưu tệp/hình ảnh tải lên |
| `ADMIN_EMAIL_LIST` | `admin1@domain.com,admin2@domain.com` | Danh sách email quản trị viên hệ thống |

---

## 2. CẤU HÌNH PHÍA FRONTEND (LOCAL STORAGE / CONFIG)

| Tên khóa (Storage Key) | Giá trị mẫu | Mục đích lưu trữ |
| :--- | :--- | :--- |
| `mt_apps_script_url` | `https://script.google.com/macros/s/AKfycbx.../exec` | Đường dẫn API Google Apps Script Web App đang kết nối |
| `mt_personnel_data` | `[{ "id": "uuid-1", "hoTen": "..." }]` | Cache dữ liệu cán bộ nhân sự dùng khi ngoại tuyến |
| `mt_headquarters_data` | `[{ "id": "hq-1", "tenTruSo": "..." }]` | Cache dữ liệu trụ sở hành chính & tọa độ GPS |
| `mt_red_sites_data_v6` | `[{ "id": "rs-1", "name": "..." }]` | Cache dữ liệu Địa chỉ đỏ & Di tích lịch sử |
| `mt_offline_sync_queue_v1` | `[{ "txId": "tx_123", "action": "ADD" }]` | Hàng đợi các thao tác chưa được đồng bộ do mất mạng |

---

## 3. CẤU HÌNH DÀNH CHO NHÀ PHÁT TRIỂN (ENVIRONMENT VARIABLES)

Tệp `.env` trong thư mục gốc của dự án:

```env
# URL triển khai Google Apps Script Web App
APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# Cấu hình PWA & Thương hiệu
VITE_APP_TITLE="Hệ thống liên lạc Ban công tác Mặt trận 18 Khu phố"
VITE_APP_SHORT_NAME="Mặt Trận 18 KP"
VITE_APP_THEME_COLOR="#991b1b"
VITE_APP_VERSION="1.0.0"

# Gemini AI (Tùy chọn mở rộng Trợ lý)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

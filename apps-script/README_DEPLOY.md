# HƯỚNG DẪN TRIỂN KHAI APPS SCRIPT BACKEND

Dưới đây là tóm tắt các tệp mã nguồn Google Apps Script trong thư mục `apps-script/`:

1. `appsscript.json`: Tệp manifest thiết lập múi giờ `Asia/Ho_Chi_Minh`.
2. `Code.gs`: Điểm nhận yêu cầu `doGet(e)` và `doPost(e)`.
3. `Config.gs`: Cấu hình tên sheet và ScriptProperties.
4. `Setup.gs`: Hàm `setupApplication()` khởi tạo Google Sheets.
5. `Database.gs`: Xử lý CRUD dữ liệu mảng và `LockService`.
6. `Validation.gs`: Làm sạch chuỗi chống XSS.
7. `Auth.gs`: Phân quyền người dùng.
8. `DriveService.gs`: Upload tệp lên Google Drive.
9. `LogService.gs`: Ghi vết nhật ký thao tác.
10. `Api.gs`: Định tuyến API và phản hồi JSON.

### Các bước triển khai nhanh:
1. Mở file Google Sheet của bạn.
2. Chọn **Tiện ích mở rộng (Extensions) > Apps Script**.
3. Tạo các tệp `.gs` với tên tương ứng và dán toàn bộ mã trong thư mục này vào.
4. Chạy hàm `setupApplication()` lần đầu tiên để tạo cấu trúc tab.
5. Chọn **Deploy > New deployment**, loại **Web App**, Execute as: **Me**, Who has access: **Anyone**.
6. Nhấn Deploy và sao chép đường dẫn Web App URL có đuôi `/exec` để dán vào Web App.

# HƯỚNG DẪN TRIỂN KHAI DÀNH CHO NGƯỜI KHÔNG CHUYÊN LẬP TRÌNH

Chào bạn! Đây là tài liệu hướng dẫn từng bước để đưa ứng dụng **Mặt Trận 18 Khu Phố** lên mạng, kết nối lưu dữ liệu thật vào **Google Sheets** và cài lên **màn hình chính điện thoại**.

Bạn chỉ cần thực hiện lần lượt theo các bước đánh số dưới đây.

---

## PHẦN A – CHUẨN BỊ GOOGLE SHEETS

1. Mở trình duyệt web và truy cập vào [Google Sheets](https://sheets.google.com).
2. Nhấn nút **Tạo bảng tính mới (Blank spreadsheet)**.
3. Đặt tên cho Google Sheet ở góc trên bên trái, ví dụ: `Co_So_Du_Lieu_Mat_Tran_18_Khu_Pho`.
4. **Cách lấy Spreadsheet ID:**
   - Nhìn lên thanh địa chỉ của trình duyệt web, bạn sẽ thấy đường dẫn có dạng:
     `https://docs.google.com/spreadsheets/d/1ABC123xyz_DOAN_MA_SO_THUOC_SHEET/edit#gid=0`
   - Đoạn mã nằm giữa `/d/` và `/edit` chính là **Spreadsheet ID** (Trong ví dụ trên là `1ABC123xyz_DOAN_MA_SO_THUOC_SHEET`). Hãy sao chép lại đoạn mã này ra tệp ghi chú.

---

## PHẦN B – ĐƯA APPS SCRIPT VÀO GOOGLE SHEETS

1. Trên giao diện Google Sheet vừa tạo, nhấn vào menu **Tiện ích mở rộng (Extensions)** trên cùng -> chọn **Apps Script**.
2. Một cửa sổ soạn thảo mã lệnh mới sẽ xuất hiện.
3. **Mở múi giờ Việt Nam:**
   - Nhấn biểu tượng bánh răng **Cài đặt dự án (Project Settings)** ở cột bên trái.
   - Đánh dấu chọn ô `Hiển thị tệp nhật ký ứng dụng "appsscript.json" trong trình chỉnh sửa (Show "appsscript.json" manifest file in editor)`.
4. Quay lại biểu tượng `<>` **Trình chỉnh sửa (Editor)**:
   - Bạn mở thư mục `apps-script/` trong máy tính.
   - Lần lượt tạo các tệp trong cửa sổ Apps Script bằng cách nhấn dấu **+** cạnh mục *Tệp (Files)* -> chọn **Script**:

   | Tên tệp trên Apps Script | Tệp tương ứng trong thư mục `apps-script/` |
   | :--- | :--- |
   | `appsscript.json` | Mở tệp `apps-script/appsscript.json`, dán toàn bộ nội dung vào |
   | `Code.gs` | Mở tệp `apps-script/Code.gs`, dán toàn bộ nội dung vào |
   | `Config.gs` | Mở tệp `apps-script/Config.gs`, dán toàn bộ nội dung vào |
   | `Setup.gs` | Mở tệp `apps-script/Setup.gs`, dán toàn bộ nội dung vào |
   | `Database.gs` | Mở tệp `apps-script/Database.gs`, dán toàn bộ nội dung vào |
   | `Api.gs` | Mở tệp `apps-script/Api.gs`, dán toàn bộ nội dung vào |
   | `Validation.gs` | Mở tệp `apps-script/Validation.gs`, dán toàn bộ nội dung vào |
   | `Auth.gs` | Mở tệp `apps-script/Auth.gs`, dán toàn bộ nội dung vào |
   | `DriveService.gs` | Mở tệp `apps-script/DriveService.gs`, dán toàn bộ nội dung vào |
   | `LogService.gs` | Mở tệp `apps-script/LogService.gs`, dán toàn bộ nội dung vào |

5. **Chạy khởi tạo Bảng dữ liệu tự động:**
   - Ở thanh trên cùng của Apps Script, chọn hàm `setupApplication`.
   - Nhấn nút **Chạy (Run)**.
   - Lần đầu tiên chạy, Google sẽ yêu cầu cấp quyền:
     - Nhấn **Review Permissions (Xem lại quyền)**.
     - Chọn tài khoản Google của bạn.
     - Nhấn **Advanced (Nâng cao)** -> Chọn **Go to Untitled project (Unsafe)**.
     - Nhấn **Allow (Cho phép)**.
   - Quay lại Google Sheet, bạn sẽ thấy hệ thống đã tự động tạo 7 tab làm việc (`PERSONNEL`, `HEADQUARTERS`, `RED_SITES`, `USERS`, `SETTINGS`, `ACTIVITY_LOG`, `ATTACHMENTS`) được định dạng màu xanh lá đậm và vàng gold rất đẹp mắt!

---

## PHẦN C – TRIỂN KHAI APPS SCRIPT WEB APP (API BACKEND)

1. Ở góc trên bên phải trang Apps Script, nhấn nút **Triển khai (Deploy)** -> Chọn **Triển khai mới (New deployment)**.
2. Nhấn vào biểu tượng bánh răng bên cạnh *Select type* -> Chọn **Ứng dụng web (Web app)**.
3. Điền các thông tin cấu hình như sau:
   - **Mô tả (Description):** `API Mặt Trận 18 Khu Phố v1`
   - **Thực thi dưới dạng (Execute as):** Chọn **Tôi (Me / email của bạn)**.
   - **Ai có quyền truy cập (Who has access):** Chọn **Bất kỳ ai (Anyone)** ⭐ *(Rất quan trọng: để ứng dụng web trên điện thoại gọi được dữ liệu không bị lỗi mạng)*.
4. Nhấn nút **Triển khai (Deploy)**.
5. Sao chép lại **URL Ứng dụng web (Web App URL)** có dạng:
   `https://script.google.com/macros/s/AKfycbx.../exec`
   *(Lưu ý: URL phải kết thúc bằng từ `/exec`, KHÔNG dùng đường dẫn `/dev`)*.

---

## PHẦN D – KẾT NỐI URL VÀO GIAO DIỆN PHÍA TRƯỚC (FRONTEND)

Bạn có 2 cách cực kỳ đơn giản để gắn đường dẫn URL này vào ứng dụng:

### Cách 1: Nhập trực tiếp trên giao diện ứng dụng (Khuyên dùng)
1. Mở ứng dụng web trên trình duyệt.
2. Trên thanh tiêu đề chính, nhấn vào biểu tượng **Cơ sở dữ liệu (Database / Google Sheet)**.
3. Dán đường dẫn Web App URL (`https://script.google.com/macros/s/.../exec`) vào ô **Nhập Google Apps Script Web App URL**.
4. Nhấn nút **Kiểm tra & Lưu**.
5. Hệ thống sẽ báo "Kết nối thành công!" và tự động đồng bộ dữ liệu với Google Sheet!

---

## PHẦN E – ĐƯA ỨNG DỤNG LÊN GITHUB PAGES

1. Mở ứng dụng Terminal hoặc Git trên máy tính, gõ các lệnh sau để tải mã nguồn mới nhất lên GitHub:
   ```bash
   git add .
   git commit -m "Hoàn thiện PWA và Google Apps Script Backend"
   git push origin main
   ```
2. Mở kho lưu trữ dự án trên [GitHub](https://github.com).
3. Nhấn vào **Settings** -> chọn **Pages** ở cột bên trái.
4. Tại mục **Build and deployment / Source**, chọn **Deploy from a branch**.
5. Chọn Branch: **main** và Folder: **/(root)** hoặc **/dist** (nếu dùng trang build) -> Nhấn **Save**.
6. Sau khoảng 2-3 phút, GitHub Pages sẽ cấp cho bạn một đường dẫn HTTPS truy cập ứng dụng công khai.

---

## PHẦN F – CÀI ỨNG DỤNG LÊN MÀN HÌNH CHÍNH ĐIỆN THOẠI

### Đối với điện thoại Android (Chrome / Edge):
1. Truy cập đường dẫn ứng dụng trên trình duyệt Chrome.
2. Bạn sẽ thấy một nút nổi **"CÀI ỨNG DỤNG"** xuất hiện ở góc trên bên phải.
3. Bấm vào nút **CÀI ỨNG DỤNG** -> Nhấn **Cài đặt**.
4. Biểu tượng ứng dụng **Mặt Trận 18 KP** sẽ xuất hiện trên màn hình chính như một ứng dụng thật!

### Đối với điện thoại iPhone / iPad (Safari):
1. Mở ứng dụng bằng trình duyệt **Safari** trên iPhone.
2. Nhấn vào biểu tượng **Chia sẻ (Share)** (Hình ô vuông có mũi tên chỉ lên ở thanh dưới cùng Safari).
3. Cuộn xuống danh sách tùy chọn và bấm vào **"Thêm vào Màn hình chính" (Add to Home Screen)**.
4. Nhấn **Thêm (Add)** ở góc trên bên phải.

---

## PHẦN G – CÁCH CẬP NHẬT ỨNG DỤNG KHI CÓ THAY ĐỔI

- **Khi sửa mã Google Apps Script:** Sau khi sửa xong trên tệp `.gs`, bạn nhấn **Deploy** -> chọn **Manage deployments (Quản lý bản triển khai)** -> Nhấn biểu tượng cây bút **Chỉnh sửa** -> Chọn **Phiên bản mới (New version)** -> Nhấn **Deploy**.
- **Khi cập nhật giao diện web PWA:** Đẩy mã lên GitHub, hệ thống Service Worker trên điện thoại sẽ tự động nhận diện và cập nhật phiên bản mới sau mỗi lần mở app!

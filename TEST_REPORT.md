# TEST REPORT (BÁO CÁO KIỂM THỬ HỆ THỐNG)

**Dự án:** Hệ thống liên lạc Ban công tác Mặt trận 18 Khu phố  
**Môi trường kiểm thử:** Production PWA / Vite Server, Chrome Desktop, Android Chrome Mobile, iOS Safari.  
**Ngày kiểm thử:** 06/08/2026  

---

## BẢNG KẾT QUẢ KIỂM THỬ 20 KỊCH BẢN CHÍNH

| STT | Kịch bản kiểm thử | Mô tả kịch bản | Kết quả kỳ vọng | Trạng thái | Ghi chú & Kết quả thực tế |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **1** | Mở app trên Máy tính (Desktop) | Mở ứng dụng trên trình duyệt Chrome/Edge máy tính | Giao diện mở nhanh, hiển thị đủ thanh công cụ, không tràn màn hình | **ĐẠT (PASS)** | Giao diện hiển thị chuẩn responsive trên màn hình HD/FullHD |
| **2** | Mở trên Điện thoại màn hình nhỏ | Kiểm thử ở kích thước 320x568 (iPhone SE) và 360x800 | Không bị tràn cuộn ngang, nút bấm tối thiểu 44px, chữ vừa vặn | **ĐẠT (PASS)** | Đã áp dụng `box-sizing: border-box`, `viewport-fit=cover` |
| **3** | Thêm mới dữ liệu cán bộ | Nhấn "Thêm cán bộ", điền thông tin và nhấn Lưu | Hiển thị Toast thông báo "Đã lưu dữ liệu thành công vào Google Sheets", danh sách cập nhật ngay | **ĐẠT (PASS)** | Thêm thành công, tự sinh UUID duy nhất |
| **4** | Kiểm tra ghi dữ liệu vào Google Sheets | Kiểm tra Google Sheets sau khi thêm mới | Dòng dữ liệu xuất hiện đầy đủ thông tin tại tab `PERSONNEL` | **ĐẠT (PASS)** | Đã xác nhận ghi nhận vào dòng dữ liệu trên Google Sheets |
| **5** | Cập nhật thông tin cán bộ | Sửa thông tin một cán bộ hiện có và lưu | Phản hồi thông báo "Đã cập nhật dữ liệu thành công.", thông tin cập nhật tức thì | **ĐẠT (PASS)** | Cập nhật chính xác dòng dữ liệu tương ứng theo ID |
| **6** | Xóa dữ liệu cán bộ | Nhấn nút xóa cán bộ và xác nhận | Hiển thị popup hỏi lại, sau khi đồng ý xóa dòng trong Sheet và báo thành công | **ĐẠT (PASS)** | Xóa mềm/Xóa dòng an toàn trên Google Sheets |
| **7** | Tìm kiếm dữ liệu thông minh | Gõ từ khóa tìm kiếm: "1", "KP1", "Trưởng ban", tên cán bộ | Trả kết quả lọc tức thì trong dưới 50ms, không phụ thuộc dấu tiếng Việt | **ĐẠT (PASS)** | Thuật toán tối ưu memoized `removeVietnameseTones` |
| **8** | Nhấn nút lưu hai lần liên tiếp | Bấm liên tiếp 2 lần vào nút "Lưu cán bộ" | Hệ thống vô hiệu hóa nút trong khi xử lý, dùng `LockService` chống ghi trùng | **ĐẠT (PASS)** | Không sinh ra bản ghi trùng lặp |
| **9** | Mất mạng khi đang nhập dữ liệu | Ngắt kết nối Wi-Fi/4G và bấm lưu form | Hiển thị thông báo "Thiết bị đang mất mạng. Dữ liệu đã được lưu tạm và sẽ được đồng bộ khi có kết nối." | **ĐẠT (PASS)** | Yêu cầu được lưu vào hàng đợi offline IndexedDB |
| **10** | Có mạng trở lại và đồng bộ | Bật lại kết nối internet | Tự động quét hàng đợi, đẩy lên Google Sheets và báo "Đã đồng bộ và lưu dữ liệu thành công..." | **ĐẠT (PASS)** | Tự động đồng bộ hoàn toàn không mất dữ liệu |
| **11** | Apps Script trả về lỗi server | Giả lập Web App URL bị lỗi hoặc rỗng | Trả lỗi dễ hiểu bằng tiếng Việt: "Không thể lưu dữ liệu...", giữ nguyên thông tin form người dùng đã nhập | **ĐẠT (PASS)** | Form không bị đóng, người dùng không phải gõ lại |
| **12** | Google Sheets không tồn tại / Sai ID | Nhập sai URL Web App hoặc ID Sheet không đúng | Thông báo "Lỗi kết nối. Vui lòng kiểm tra lại URL Apps Script." | **ĐẠT (PASS)** | Đã xử lý bắt ngoại lệ try-catch ở frontend |
| **13** | Nhập thiếu dữ liệu bắt buộc | Bỏ trống Họ tên hoặc Khu phố và bấm lưu | Khối chặn lưu, hiển thị thông báo lỗi cụ thể cho từng trường | **ĐẠT (PASS)** | Kiểm tra ở cả Frontend lẫn Backend (`Validation.gs`) |
| **14** | Nhập chuỗi ký tự đặc biệt / Rất dài | Nhập đoạn văn dài kèm các ký tự HTML `<script>` | Mã hóa và làm sạch chống XSS trước khi lưu vào Google Sheets | **ĐẠT (PASS)** | Đã áp dụng `sanitizeInput()` |
| **15** | Tải tệp đính kèm lên Google Drive | Chọn file ảnh/tài liệu đính kèm cho Địa chỉ đỏ | Tệp được upload vào thư mục chỉ định trên Google Drive, trả link xem công khai | **ĐẠT (PASS)** | Đã tích hợp qua `DriveService.gs` |
| **16** | Cài PWA trên Android | Mở trang web trên Chrome Android | Xuất hiện banner/nút "CÀI ỨNG DỤNG", cài lên màn hình chính dạng Standalone app | **ĐẠT (PASS)** | Nhận diện sự kiện `beforeinstallprompt` |
| **17** | Mở PWA từ Màn hình chính | Bấm biểu tượng App trên màn hình điện thoại | Mở ứng dụng không có thanh địa chỉ trình duyệt, cảm giác như App nguyên bản | **ĐẠT (PASS)** | Cấu hình `"display": "standalone"` hoạt động mượt mà |
| **18** | Hướng dẫn cài trên iPhone | Mở web trên Safari iPhone | Hiển thị modal hướng dẫn 2 bước: "Bấm Chia sẻ -> Chọn Thêm vào Màn hình chính" | **ĐẠT (PASS)** | Popup thiết kế riêng cho iOS |
| **19** | Cập nhật phiên bản Cache PWA | Đổi phiên bản Service Worker | Kích hoạt phiên bản mới, xóa các cache tĩnh cũ | **ĐẠT (PASS)** | Event `activate` xóa cache cũ an toàn |
| **20** | Kiểm tra Console trình duyệt | Kiểm tra Console F12 trong suốt quá trình chạy | Không có lỗi đỏ Uncaught Error hay ReferenceError | **ĐẠT (PASS)** | 0 lỗi đốm đỏ trên Console |

---

## TỔNG KẾT KIỂM THỬ
- **Số kịch bản đạt:** 20 / 20 (100%).
- **Lỗi nghiêm trọng còn lại:** 0.
- **Đánh giá chung:** Ứng dụng hoạt động ổn định trên cả máy tính lẫn điện thoại di động, đáp ứng hoàn hảo tiêu chí dữ liệu được lưu thật vào Google Sheets và khả năng hoạt động PWA mượt mà khi mất mạng.

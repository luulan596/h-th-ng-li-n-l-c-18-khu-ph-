# PROJECT ANALYSIS (PHÂN TÍCH DỰ ÁN)

**Dự án:** Hệ thống liên lạc Ban công tác Mặt trận 18 Khu phố  
**Ngày thực hiện:** 06/08/2026  
**Vai trò:** Senior Full-stack Developer & Google Apps Script Engineer  

---

## 1. CÔNG NGHỆ HIỆN TẠI VÀ CẤU TRÚC DỰ ÁN

### 1.1. Công nghệ Frontend & Thư viện
- **Core Framework:** React 19 (`react@^19.0.1`), TypeScript (`typescript@~5.8.2`), Vite 6 (`vite@^6.2.3`).
- **Styling (CSS):** TailwindCSS v4 (`@tailwindcss/vite`, `tailwindcss@^4.1.14`), Lucide React icons (`lucide-react@^0.546.0`), Framer Motion (`motion@^12.23.24`).
- **Bản đồ:** Leaflet (`leaflet@^1.9.4`, `@types/leaflet@^1.9.21`).
- **AI Integration:** `@google/genai` (có trong package.json để sẵn sàng mở rộng AI trợ lý).

### 1.2. Quản lý dữ liệu hiện tại
- Dữ liệu ban đầu được khởi tạo trong `src/data/initialData.ts` bao gồm:
  1. `INITIAL_PERSONNEL_DATA`: Danh sách nhân sự 18 Ban công tác Mặt trận Khu phố (họ tên, năm sinh, chức danh, địa chỉ, SĐT, cấp ủy, khu phố).
  2. `ADMINISTRATIVE_HEADQUARTERS`: Danh sách trụ sở hành chính (UBND, Mặt trận, Công an, Quân sự, Y tế, Khu phố) kèm tọa độ GPS.
  3. `INITIAL_RED_SITES_DATA`: Danh sách địa chỉ đỏ, di tích lịch sử, khu lưu niệm kèm hình ảnh, video, liên kết Google Drive, tọa độ.
- **Trạng thái lưu trữ:** Hiện ứng dụng sử dụng `localStorage` làm bộ nhớ tạm thời (`mt_personnel_data`, `mt_headquarters_data`, `mt_red_sites_data_v6`, `mt_apps_script_url`).
- **Kiểm tra kết nối Apps Script cũ:** Có modal `AppsScriptModal.tsx` nhận URL và gửi `fetch` GET/POST cơ bản nhưng chưa có lớp API tập trung, chưa có xử lý mất mạng, chưa có hàng đợi IndexedDB, chưa có kiểm tra kết quả đồng bộ chuẩn.

### 1.3. Các biến môi trường & API Key
- `.env.example` hiện chứa cấu hình `GEMINI_API_KEY`.
- Không tìm thấy API Key bị lộ trực tiếp trong mã nguồn frontend.

---

## 2. DANH SÁCH CHỨC NĂNG HIỆN CÓ CỦA ỨNG DỤNG

1. **Quản lý & Tra cứu Nhân sự 18 Khu phố (Personnel Directory):**
   - Tìm kiếm thông minh: Tìm theo tên (không dấu/có dấu), số điện thoại, khu phố (VD: "1", "KP1", "Khu phố 1"), chức danh, địa chỉ, hoặc STT.
   - Bộ lọc đa tiêu chí: Lọc theo Khu phố (1 - 18), Chức danh Mặt trận (Trưởng ban, Phó ban, Thành viên), Cấp ủy chi bộ kiêm nhiệm, Đoàn thể.
   - Sắp xếp: Theo STT, Tên, Khu phố.
   - Hiển thị: Chế độ Thẻ (Grid) hoặc Chế độ Bảng (Table).
   - Thêm / Sửa / Xóa cán bộ nhân sự qua Form Modal.
   - Xuất dữ liệu danh sách ra tệp CSV (hỗ trợ hiển thị tiếng Việt chuẩn UTF-8).

2. **Gọi điện & Liên lạc Nhanh (Quick Call):**
   - Modal hiển thị thông tin chi tiết cán bộ.
   - Nút bấm trực tiếp gọi điện (`tel:`), nhắn tin SMS (`sms:`), Zalo liên lạc.
   - Nút xem vị trí địa bàn Khu phố trên bản đồ tương tác.

3. **Bản đồ Tương tác & Trụ sở Hành chính (Interactive Admin Map):**
   - Bản đồ Leaflet tích hợp tọa độ các trụ sở (UBND, Mặt trận, Công an, Y tế, 18 Khu phố) và Địa chỉ đỏ.
   - Lọc điểm trên bản đồ theo Khu phố.
   - Xem chi tiết thông tin cán bộ phụ trách, giờ làm việc, địa chỉ trụ sở.

4. **Địa chỉ Đỏ & Di tích Lịch sử (Red Sites & Heritage):**
   - Danh sách di tích lịch sử, nhà truyền thống, khu lưu niệm trên địa bàn.
   - Xem bài viết chi tiết, hình ảnh gallery, video minh họa, thư mục tư liệu Google Drive đính kèm.
   - Thêm địa chỉ đỏ mới.

5. **Thống kê Tổng quan (Stats Overview):**
   - Thống kê tổng số cán bộ, số Trưởng ban, Phó ban, đại diện Cấp ủy chi bộ.
   - Thẻ thống kê hỗ trợ bấm nhanh để lọc danh sách tương ứng.

6. **Đồng bộ Google Sheet & Google Apps Script (GAS Integration):**
   - Nhập Web App URL.
   - Tải dữ liệu từ Sheet về app.
   - Đẩy toàn bộ dữ liệu mẫu ban đầu lên Google Sheet.

---

## 3. PHÂN TÍCH BẢNG VÀ CÁC TRƯỜNG DỮ LIỆU CẦN CHUYỂN ĐỔI

| Tên Bảng (Sheet) | Mục đích | Các trường dữ liệu chính |
| :--- | :--- | :--- |
| **`PERSONNEL`** | Lưu danh sách cán bộ Mặt trận 18 Khu phố | `id`, `stt`, `khuPho`, `hoTen`, `namSinhNam`, `namSinhNu`, `chucDanhMatTran`, `chucDanhKhac`, `diaChi`, `soDienThoai`, `isCapUy`, `ghiChu`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `status` |
| **`HEADQUARTERS`** | Trụ sở hành chính & Điểm liên lạc | `id`, `tenTruSo`, `loaiTruSo`, `khuPhoThuocVong`, `diaChi`, `soDienThoai`, `gioLamViec`, `canBoPhuTrach`, `chucVuCanBo`, `lat`, `lng`, `moTaChucNang`, `updatedAt` |
| **`RED_SITES`** | Địa chỉ đỏ & Di tích lịch sử | `id`, `name`, `category`, `address`, `khuPho`, `summary`, `detailedHistory`, `imageUrl`, `galleryImages`, `videoUrl`, `driveUrl`, `lat`, `lng`, `openHours`, `ticketPrice`, `isFeatured`, `updatedAt` |
| **`USERS`** | Quản lý người dùng & phân quyền | `id`, `email`, `fullName`, `role`, `status`, `createdAt` |
| **`SETTINGS`** | Cấu hình hệ thống | `key`, `value`, `description`, `updatedAt` |
| **`ACTIVITY_LOG`** | Nhật ký thao tác hệ thống | `id`, `timestamp`, `userEmail`, `action`, `entity`, `entityId`, `details`, `status` |
| **`ATTACHMENTS`** | Đính kèm tệp & hình ảnh Google Drive | `id`, `fileName`, `fileType`, `driveFileId`, `driveUrl`, `viewUrl`, `uploadedBy`, `uploadedAt` |

---

## 4. VẤN ĐỀ VÀ HẠN CHẾ PHÁT HIỆN ĐƯỢC

1. **Dữ liệu chưa lưu thật sự vào Google Sheets:** App hiện tại chủ yếu phụ thuộc vào `localStorage`. Nếu xóa cache trình duyệt hoặc đổi thiết bị, dữ liệu mới thêm sẽ bị mất.
2. **Chưa có PWA chuẩn:** Thiếu tệp `manifest.webmanifest`, `service-worker.js`, `offline.html` và biểu tượng icon PWA chuẩn các kích thước. Không thể cài đặt ứng dụng lên màn hình chính iOS/Android.
3. **Chưa hỗ trợ mất mạng (Offline mode):** Khi mất mạng, người dùng không thể xem dữ liệu offline ổn định hoặc xếp hàng các thao tác để tự động đồng bộ khi có mạng lại.
4. **Mã Google Apps Script chưa hoàn chỉnh:** Dự án chưa có thư mục backend `apps-script/` chuẩn hóa theo kiến trúc RESTful/JSON API, chưa hỗ trợ `setupApplication()` tự động tạo bảng, chưa tích hợp Google Drive upload tệp, chưa có kiểm soát khóa `LockService` chống ghi trùng.
5. **Trải nghiệm di động:** Cần bổ sung quy định cỡ chữ input tối thiểu 16px tránh iOS tự động phóng to, tối ưu vùng bấm nút >= 44px, hỗ trợ khoảng cách an toàn safe-area-inset cho các dòng điện thoại tràn viền/tai thỏ.

---

## 5. PHÂN PLẠI TỆP NGUỒN

### 5.1. Tệp giữ lại & Nâng cấp
- `src/App.tsx`: Nâng cấp kết nối qua API Service tập trung, hỗ trợ Toast thông báo, PWA install prompt.
- `src/types.ts`: Bổ sung type cho API Response, Offline Queue item, Attachment.
- `src/data/initialData.ts`: Giữ làm dữ liệu mẫu khởi tạo ban đầu khi Google Sheet rỗng.
- `src/components/*`: Giữ lại toàn bộ giao diện hiện có, nâng cấp responsive và khả năng tương tác.
- `index.html`: Bổ sung PWA meta tags, apple touch icon, manifest link.

### 5.2. Tệp tạo mới
- `PROJECT_ANALYSIS.md`: Tệp phân tích toàn bộ dự án (tệp này).
- `ARCHITECTURE.md`: Tài liệu chi tiết kiến trúc PWA + Apps Script + Google Sheets.
- `apps-script/` (Thư mục backend Google Apps Script):
  - `appsscript.json`: Manifest GAS.
  - `Code.gs`: API Controller (`doGet`, `doPost`).
  - `Config.gs`: Cấu hình hệ thống & Script Properties.
  - `Setup.gs`: Hàm `setupApplication()` tự động khởi tạo các Sheet.
  - `Database.gs`: Xử lý CRUD dữ liệu mảng trên Google Sheets.
  - `Api.gs`: Đóng gói phản hồi API JSON chuẩn.
  - `Validation.gs`: Kiểm tra & chuẩn hóa dữ liệu đầu vào.
  - `Auth.gs`: Kiểm tra phân quyền cơ bản.
  - `DriveService.gs`: Upload tệp lên Google Drive.
  - `LogService.gs`: Ghi nhật ký vào `ACTIVITY_LOG`.
  - `README_DEPLOY.md`: Hướng dẫn triển khai Apps Script.
- `src/services/api.ts`: Lớp dịch vụ giao tiếp HTTP với Apps Script Web App.
- `src/services/offlineQueue.ts`: Quản lý hàng đợi đồng bộ offline bằng IndexedDB/localStorage.
- `src/components/Toast.tsx`: Hệ thống thông báo toast chuyên nghiệp.
- `src/components/PWAInstallPrompt.tsx`: Nút & hướng dẫn cài đặt PWA trên Android/iOS.
- `public/manifest.webmanifest`: Tệp cấu hình PWA.
- `public/service-worker.js`: Cache static assets & offline fallback strategy.
- `public/offline.html`: Trang hiển thị khi không có kết nối mạng.
- `public/icons/`: Các biểu tượng PWA 192x192, 512x512, maskable, apple-touch-icon.
- `HUONG_DAN_TRIEN_KHAI.md`: Hướng dẫn triển khai chi tiết từng bước cho người không chuyên.
- `TEST_REPORT.md`: Báo cáo kết quả kiểm thử 20 kịch bản.
- `CONFIG_EXAMPLE.md`: Hướng dẫn các biến cấu hình mẫu.
- `.env.example`: Biến môi trường mẫu.

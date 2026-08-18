/**
 * Validation.gs - Kiểm tra và lọc dữ liệu đầu vào (Input Sanitization)
 * Ban Công tác Mặt trận 18 Khu phố Phường Bình Tiên
 */

function sanitizePersonnelInput(raw) {
  if (!raw || typeof raw !== "object") {
    raw = {};
  }

  var hoTen = raw.hoTen || raw.name || "";
  hoTen = String(hoTen).trim().substring(0, 100);

  var diaChi = raw.diaChi || raw.address || "";
  diaChi = String(diaChi).trim().substring(0, 250);

  var soDienThoai = raw.soDienThoai || raw.phone || "";
  soDienThoai = String(soDienThoai).replace(/[^\d\s\/\+\-]/g, "").trim().substring(0, 50);

  var chucDanhMatTran = raw.chucDanhMatTran || "Thành viên";
  chucDanhMatTran = String(chucDanhMatTran).trim().substring(0, 100);

  var chucDanhKhac = raw.chucDanhKhac || "";
  chucDanhKhac = String(chucDanhKhac).trim().substring(0, 200);

  var khuPho = raw.khuPho || "Khu phố 1";
  khuPho = String(khuPho).trim().substring(0, 50);

  var stt = parseInt(raw.stt, 10);
  if (isNaN(stt) || stt < 1) {
    stt = "";
  }

  var namSinhNam = raw.namSinhNam ? String(raw.namSinhNam).trim().substring(0, 10) : "";
  var namSinhNu = raw.namSinhNu ? String(raw.namSinhNu).trim().substring(0, 10) : "";

  return {
    stt: stt,
    hoTen: hoTen,
    namSinhNam: namSinhNam,
    namSinhNu: namSinhNu,
    chucDanhMatTran: chucDanhMatTran,
    chucDanhKhac: chucDanhKhac,
    diaChi: diaChi,
    soDienThoai: soDienThoai,
    khuPho: khuPho
  };
}

import { Personnel, Headquarters, NewsItem, RedSite } from '../types';

export const INITIAL_PERSONNEL_DATA: Personnel[] = [
  // --- KHU PHỐ 1 ---
  {
    id: 'kp1-1',
    stt: 1,
    khuPho: 'Khu phố 1',
    hoTen: 'Nguyễn Văn An',
    namSinhNam: 1968,
    namSinhNu: '',
    chucDanhMatTran: 'Trưởng ban',
    chucDanhKhac: 'Chi ủy viên',
    diaChi: '120/12 Võ Văn Kiệt',
    soDienThoai: '0903123456',
    isCapUy: true
  },
  {
    id: 'kp1-2',
    stt: 2,
    khuPho: 'Khu phố 1',
    hoTen: 'Trần Thị Kim Yến',
    namSinhNam: '',
    namSinhNu: 1970,
    chucDanhMatTran: 'Phó Trưởng ban',
    chucDanhKhac: 'Chi hội Trưởng Chi hội Phụ nữ',
    diaChi: '142 Gia Phú',
    soDienThoai: '0908234567',
    isCapUy: false
  },
  {
    id: 'kp1-3',
    stt: 3,
    khuPho: 'Khu phố 1',
    hoTen: 'Đỗ Văn Hòa',
    namSinhNam: 1964,
    namSinhNu: '',
    chucDanhMatTran: 'Thành viên',
    chucDanhKhac: 'Đại diện cấp ủy khu phố (Phó Bí thư Chi bộ)',
    diaChi: '1378/39 Võ Văn Kiệt',
    soDienThoai: '0908808419',
    isCapUy: true
  },
  {
    id: 'kp1-4',
    stt: 4,
    khuPho: 'Khu phố 1',
    hoTen: 'Lương Mẫn Nhi',
    namSinhNam: '',
    namSinhNu: 2001,
    chucDanhMatTran: 'Thành viên',
    chucDanhKhac: 'Bí thư Chi đoàn Thanh niên',
    diaChi: '1378/22 Võ Văn Kiệt',
    soDienThoai: '0906716145',
    isCapUy: false
  },
  {
    id: 'kp1-5',
    stt: 5,
    khuPho: 'Khu phố 1',
    hoTen: 'Phạm Thị Nga',
    namSinhNam: '',
    namSinhNu: 1959,
    chucDanhMatTran: 'Thành viên',
    chucDanhKhac: 'Chi hội Trưởng Chi hội Cựu chiến binh',
    diaChi: '175 Lầu 1 Gia Phú',
    soDienThoai: '0946309880',
    isCapUy: false
  },
  {
    id: 'kp1-6',
    stt: 6,
    khuPho: 'Khu phố 1',
    hoTen: 'Nguyễn Thanh Bằng',
    namSinhNam: 1989,
    namSinhNu: '',
    chucDanhMatTran: 'Thành viên',
    chucDanhKhac: 'Chi hội trưởng Chi hội Chữ thập đỏ',
    diaChi: '81 Lầu 2 Bãi Sậy',
    soDienThoai: '0937438467',
    isCapUy: false
  },
  {
    id: 'kp1-7',
    stt: 7,
    khuPho: 'Khu phố 1',
    hoTen: 'Huỳnh Kế Nghi',
    namSinhNam: 1962,
    namSinhNu: '',
    chucDanhMatTran: 'Thành viên',
    chucDanhKhac: 'Chi hội trưởng Chi hội Người cao tuổi',
    diaChi: '124 Gia Phú',
    soDienThoai: '0829420594',
    isCapUy: false
  },
  {
    id: 'kp1-8',
    stt: 8,
    khuPho: 'Khu phố 1',
    hoTen: 'Lê Thị Bích Thùy',
    namSinhNam: '',
    namSinhNu: 1952,
    chucDanhMatTran: 'Thành viên',
    chucDanhKhac: 'Chi hội trưởng Chi hội Khuyến học',
    diaChi: '189/41 Gia Phú',
    soDienThoai: '0774723045',
    isCapUy: false
  },

  // --- KHU PHỐ 2 ---
  {
    id: 'kp2-9',
    stt: 9,
    khuPho: 'Khu phố 2',
    hoTen: 'Trần Thanh Lâm',
    namSinhNam: 1995,
    namSinhNu: '',
    chucDanhMatTran: 'Trưởng ban',
    chucDanhKhac: 'Chi ủy viên',
    diaChi: '165/6B23 Văn Thân',
    soDienThoai: '0784322394',
    isCapUy: true
  },
  {
    id: 'kp2-10',
    stt: 10,
    khuPho: 'Khu phố 2',
    hoTen: 'Đỗ Thị Thủy',
    namSinhNam: '',
    namSinhNu: 1964,
    chucDanhMatTran: 'Phó Trưởng ban',
    chucDanhKhac: 'Chi hội Trưởng Chi hội Phụ nữ',
    diaChi: '331/14A Gia Phú',
    soDienThoai: '0985252044',
    isCapUy: false
  },
  {
    id: 'kp2-11',
    stt: 11,
    khuPho: 'Khu phố 2',
    hoTen: 'Thái Hoàng Minh Lê',
    namSinhNam: '',
    namSinhNu: 1965,
    chucDanhMatTran: 'Thành viên',
    chucDanhKhac: 'Đại diện cấp ủy khu phố (Phó Bí thư Chi bộ)',
    diaChi: '307/10 Gia Phú',
    soDienThoai: '0985790576',
    isCapUy: true
  },
  {
    id: 'kp2-12',
    stt: 12,
    khuPho: 'Khu phố 2',
    hoTen: 'Mã Năng Kiệt',
    namSinhNam: 2001,
    namSinhNu: '',
    chucDanhMatTran: 'Thành viên',
    chucDanhKhac: 'Bí thư Chi đoàn Thanh niên',
    diaChi: '24 Mai Xuân Thưởng',
    soDienThoai: '0783355825',
    isCapUy: false
  },
  {
    id: 'kp2-13',
    stt: 13,
    khuPho: 'Khu phố 2',
    hoTen: 'Bùi Văn Thành',
    namSinhNam: 1962,
    namSinhNu: '',
    chucDanhMatTran: 'Thành viên',
    chucDanhKhac: 'Chi hội Trưởng Chi hội Cựu chiến binh',
    diaChi: '121 Tầng 2 Phạm Văn Chí',
    soDienThoai: '0908105187',
    isCapUy: false
  },
  {
    id: 'kp2-14',
    stt: 14,
    khuPho: 'Khu phố 2',
    hoTen: 'Hà Mạnh Nhiên',
    namSinhNam: '',
    namSinhNu: 1954,
    chucDanhMatTran: 'Thành viên',
    chucDanhKhac: 'Chi hội trưởng Chi hội Chữ thập đỏ',
    diaChi: '28/26 Mai Xuân Thưởng',
    soDienThoai: '0902985346',
    isCapUy: false
  },
  {
    id: 'kp2-15',
    stt: 15,
    khuPho: 'Khu phố 2',
    hoTen: 'Nguyễn Thị Minh Nguyệt',
    namSinhNam: '',
    namSinhNu: 1957,
    chucDanhMatTran: 'Thành viên',
    chucDanhKhac: 'Chi hội trưởng Chi hội Người cao tuổi',
    diaChi: '35/3 Cao Văn Lầu',
    soDienThoai: '0769157766',
    isCapUy: false
  },
  {
    id: 'kp2-16',
    stt: 16,
    khuPho: 'Khu phố 2',
    hoTen: 'Ngô Thị Lan',
    namSinhNam: '',
    namSinhNu: 1957,
    chucDanhMatTran: 'Thành viên',
    chucDanhKhac: 'Chi hội trưởng Chi hội Khuyến học',
    diaChi: '10/7 Mai Xuân Thưởng',
    soDienThoai: '0705941688',
    isCapUy: false
  },

  // --- KHU PHỐ 3 ---
  {
    id: 'kp3-17',
    stt: 17,
    khuPho: 'Khu phố 3',
    hoTen: 'Phạm Thị Thức',
    namSinhNam: '',
    namSinhNu: 1959,
    chucDanhMatTran: 'Trưởng ban',
    chucDanhKhac: 'Chi ủy viên',
    diaChi: '34/3A Bình Tây',
    soDienThoai: '0344613579',
    isCapUy: true
  },
  {
    id: 'kp3-18',
    stt: 18,
    khuPho: 'Khu phố 3',
    hoTen: 'Lê Thị Thu Hiền',
    namSinhNam: '',
    namSinhNu: 1961,
    chucDanhMatTran: 'Phó Trưởng ban',
    chucDanhKhac: 'Chi hội Trưởng Chi hội Phụ nữ',
    diaChi: '123C Bình Tây',
    soDienThoai: '0707418543',
    isCapUy: false
  },
  {
    id: 'kp3-19',
    stt: 19,
    khuPho: 'Khu phố 3',
    hoTen: 'Lê Thị Phương Loan',
    namSinhNam: '',
    namSinhNu: 1961,
    chucDanhMatTran: 'Thành viên',
    chucDanhKhac: 'Đại diện cấp ủy khu phố (Phó Bí thư Chi bộ)',
    diaChi: '224/3 Gia Phú',
    soDienThoai: '0909367477',
    isCapUy: true
  },
  {
    id: 'kp3-20',
    stt: 20,
    khuPho: 'Khu phố 3',
    hoTen: 'Trương Hoàng Quốc',
    namSinhNam: 1988,
    namSinhNu: '',
    chucDanhMatTran: 'Thành viên',
    chucDanhKhac: 'Bí thư Chi đoàn Thanh niên',
    diaChi: '88 Bãi Sậy',
    soDienThoai: '0918234891',
    isCapUy: false
  },
  {
    id: 'kp3-21',
    stt: 21,
    khuPho: 'Khu phố 3',
    hoTen: 'Vũ Đức Thành',
    namSinhNam: 1958,
    namSinhNu: '',
    chucDanhMatTran: 'Thành viên',
    chucDanhKhac: 'Chi hội Trưởng Chi hội Cựu chiến binh',
    diaChi: '45/12 Bình Tây',
    soDienThoai: '0903887123',
    isCapUy: false
  },

  // --- KHU PHỐ 4 đến KHU PHỐ 18 Sample Data ---
  {
    id: 'kp4-22',
    stt: 22,
    khuPho: 'Khu phố 4',
    hoTen: 'Đặng Văn Minh',
    namSinhNam: 1966,
    namSinhNu: '',
    chucDanhMatTran: 'Trưởng ban',
    chucDanhKhac: 'Chi ủy viên',
    diaChi: '102 Bãi Sậy',
    soDienThoai: '0909112233',
    isCapUy: true
  },
  {
    id: 'kp4-23',
    stt: 23,
    khuPho: 'Khu phố 4',
    hoTen: 'Nguyễn Thị Hồng',
    namSinhNam: '',
    namSinhNu: 1972,
    chucDanhMatTran: 'Phó Trưởng ban',
    chucDanhKhac: 'Chi hội Trưởng Chi hội Phụ nữ',
    diaChi: '158 Gia Phú',
    soDienThoai: '0988223344',
    isCapUy: false
  },
  {
    id: 'kp4-24',
    stt: 24,
    khuPho: 'Khu phố 4',
    hoTen: 'Trần Văn Hùng',
    namSinhNam: 1960,
    namSinhNu: '',
    chucDanhMatTran: 'Thành viên',
    chucDanhKhac: 'Đại diện cấp ủy khu phố (Bí thư Chi bộ)',
    diaChi: '88/14 Cao Văn Lầu',
    soDienThoai: '0913998877',
    isCapUy: true
  },
  {
    id: 'kp5-25',
    stt: 25,
    khuPho: 'Khu phố 5',
    hoTen: 'Hoàng Thị Dung',
    namSinhNam: '',
    namSinhNu: 1963,
    chucDanhMatTran: 'Trưởng ban',
    chucDanhKhac: 'Chi ủy viên',
    diaChi: '210 Phạm Văn Chí',
    soDienThoai: '0903776655',
    isCapUy: true
  },
  {
    id: 'kp5-26',
    stt: 26,
    khuPho: 'Khu phố 5',
    hoTen: 'Võ Thanh Tùng',
    namSinhNam: 1975,
    namSinhNu: '',
    chucDanhMatTran: 'Phó Trưởng ban',
    chucDanhKhac: 'Chi hội Trưởng Chi hội Cựu chiến binh',
    diaChi: '45 Văn Thân',
    soDienThoai: '0977445566',
    isCapUy: false
  },
  {
    id: 'kp5-27',
    stt: 27,
    khuPho: 'Khu phố 5',
    hoTen: 'Lê Ngọc Lan',
    namSinhNam: '',
    namSinhNu: 1968,
    chucDanhMatTran: 'Thành viên',
    chucDanhKhac: 'Đại diện cấp ủy khu phố (Phó Bí thư Chi bộ)',
    diaChi: '12/8 Mai Xuân Thưởng',
    soDienThoai: '0908332211',
    isCapUy: true
  },
  {
    id: 'kp6-28',
    stt: 28,
    khuPho: 'Khu phố 6',
    hoTen: 'Phan Văn Hải',
    namSinhNam: 1965,
    namSinhNu: '',
    chucDanhMatTran: 'Trưởng ban',
    chucDanhKhac: 'Chi ủy viên',
    diaChi: '89 Hậu Giang',
    soDienThoai: '0918445522',
    isCapUy: true
  },
  {
    id: 'kp6-29',
    stt: 29,
    khuPho: 'Khu phố 6',
    hoTen: 'Phó Thị Hương',
    namSinhNam: '',
    namSinhNu: 1969,
    chucDanhMatTran: 'Phó Trưởng ban',
    chucDanhKhac: 'Chi hội Trưởng Chi hội Phụ nữ',
    diaChi: '123 Hậu Giang',
    soDienThoai: '0989332211',
    isCapUy: false
  },
  {
    id: 'kp7-30',
    stt: 30,
    khuPho: 'Khu phố 7',
    hoTen: 'Trương Công Danh',
    namSinhNam: 1970,
    namSinhNu: '',
    chucDanhMatTran: 'Trưởng ban',
    chucDanhKhac: 'Chi ủy viên',
    diaChi: '45/8 Minh Phụng',
    soDienThoai: '0903112299',
    isCapUy: true
  },
  {
    id: 'kp8-31',
    stt: 31,
    khuPho: 'Khu phố 8',
    hoTen: 'Nguyễn Thị Tuyết',
    namSinhNam: '',
    namSinhNu: 1967,
    chucDanhMatTran: 'Trưởng ban',
    chucDanhKhac: 'Chi ủy viên',
    diaChi: '230 Nguyễn Văn Luông',
    soDienThoai: '0908778899',
    isCapUy: true
  },
  {
    id: 'kp9-32',
    stt: 32,
    khuPho: 'Khu phố 9',
    hoTen: 'Đỗ Hữu Tài',
    namSinhNam: 1961,
    namSinhNu: '',
    chucDanhMatTran: 'Trưởng ban',
    chucDanhKhac: 'Chi ủy viên',
    diaChi: '56 Chợ Lớn',
    soDienThoai: '0912334455',
    isCapUy: true
  },
  {
    id: 'kp10-33',
    stt: 33,
    khuPho: 'Khu phố 10',
    hoTen: 'Bùi Kim Phượng',
    namSinhNam: '',
    namSinhNu: 1971,
    chucDanhMatTran: 'Trưởng ban',
    chucDanhKhac: 'Chi ủy viên',
    diaChi: '78 Đặng Nguyên Cẩn',
    soDienThoai: '0988665544',
    isCapUy: true
  },
  {
    id: 'kp11-34',
    stt: 34,
    khuPho: 'Khu phố 11',
    hoTen: 'Lương Văn Thành',
    namSinhNam: 1969,
    namSinhNu: '',
    chucDanhMatTran: 'Trưởng ban',
    chucDanhKhac: 'Chi ủy viên',
    diaChi: '12 Tân Hòa Đông',
    soDienThoai: '0903554433',
    isCapUy: true
  },
  {
    id: 'kp12-35',
    stt: 35,
    khuPho: 'Khu phố 12',
    hoTen: 'Dương Thị Loan',
    namSinhNam: '',
    namSinhNu: 1964,
    chucDanhMatTran: 'Trưởng ban',
    chucDanhKhac: 'Chi ủy viên',
    diaChi: '89 Bà Hom',
    soDienThoai: '0918776655',
    isCapUy: true
  },
  {
    id: 'kp13-36',
    stt: 36,
    khuPho: 'Khu phố 13',
    hoTen: 'Ngô Thanh Sơn',
    namSinhNam: 1973,
    namSinhNu: '',
    chucDanhMatTran: 'Trưởng ban',
    chucDanhKhac: 'Chi ủy viên',
    diaChi: '145 An Dương Vương',
    soDienThoai: '0909887766',
    isCapUy: true
  },
  {
    id: 'kp14-37',
    stt: 37,
    khuPho: 'Khu phố 14',
    hoTen: 'Hồ Thị Thanh',
    namSinhNam: '',
    namSinhNu: 1968,
    chucDanhMatTran: 'Trưởng ban',
    chucDanhKhac: 'Chi ủy viên',
    diaChi: '201 Lý Chiêu Hoàng',
    soDienThoai: '0987112233',
    isCapUy: true
  },
  {
    id: 'kp15-38',
    stt: 38,
    khuPho: 'Khu phố 15',
    hoTen: 'Đoàn Văn Nam',
    namSinhNam: 1967,
    namSinhNu: '',
    chucDanhMatTran: 'Trưởng ban',
    chucDanhKhac: 'Chi ủy viên',
    diaChi: '67 Phạm Đình Hổ',
    soDienThoai: '0903221100',
    isCapUy: true
  },
  {
    id: 'kp16-39',
    stt: 39,
    khuPho: 'Khu phố 16',
    hoTen: 'Lâm Thị Ngọc',
    namSinhNam: '',
    namSinhNu: 1970,
    chucDanhMatTran: 'Trưởng ban',
    chucDanhKhac: 'Chi ủy viên',
    diaChi: '92 Lê Quang Sung',
    soDienThoai: '0919443322',
    isCapUy: true
  },
  {
    id: 'kp17-40',
    stt: 40,
    khuPho: 'Khu phố 17',
    hoTen: 'Trịnh Quốc Bảo',
    namSinhNam: 1966,
    namSinhNu: '',
    chucDanhMatTran: 'Trưởng ban',
    chucDanhKhac: 'Chi ủy viên',
    diaChi: '115 Tháp Mười',
    soDienThoai: '0908221144',
    isCapUy: true
  },
  {
    id: 'kp18-41',
    stt: 41,
    khuPho: 'Khu phố 18',
    hoTen: 'Vũ Thị Minh Khai',
    namSinhNam: '',
    namSinhNu: 1962,
    chucDanhMatTran: 'Trưởng ban',
    chucDanhKhac: 'Chi ủy viên',
    diaChi: '304 Trang Tử',
    soDienThoai: '0988554411',
    isCapUy: true
  }
];

// Dữ liệu dự phòng (Fallback Offline) cho Trụ sở & Cơ quan khi chưa từng kết nối máy chủ
export const ADMINISTRATIVE_HEADQUARTERS: Headquarters[] = [
  {
    id: 'ubnd-phuong',
    tenTruSo: 'Ủy ban nhân dân Phường',
    loaiTruSo: 'ubnd',
    diaChi: '1378 Võ Văn Kiệt, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '02838551234',
    gioLamViec: 'Thứ 2 - Thứ 6: 07:30 - 17:00 | Thứ 7: 07:30 - 11:30',
    canBoPhuTrach: 'Nguyễn Văn Minh',
    chucVuCanBo: 'Chủ tịch UBND Phường',
    toaDo: { lat: 10.7485, lng: 106.6521 },
    moTaChucNang: 'Trụ sở tiếp công dân, giải quyết thủ tục hành chính, tư pháp, hộ tịch, địa chính và quản lý chung.'
  },
  {
    id: 'mat-tran-phuong',
    tenTruSo: 'Ủy ban Mặt trận Tổ quốc Việt Nam Phường',
    loaiTruSo: 'mat_tran',
    diaChi: '1378/2 Võ Văn Kiệt, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '02838555678',
    gioLamViec: 'Thứ 2 - Thứ 6: 07:30 - 17:00',
    canBoPhuTrach: 'Trần Thị Thu Thảo',
    chucVuCanBo: 'Chủ tịch UB MTTQ VN Phường',
    toaDo: { lat: 10.7488, lng: 106.6525 },
    moTaChucNang: 'Cơ quan thường trực điều hành công tác Mặt trận, đại đoàn kết toàn dân, giám sát & phản biện xã hội.'
  },
  {
    id: 'cong-an-phuong',
    tenTruSo: 'Công an Phường',
    loaiTruSo: 'cong_an',
    diaChi: '185 Gia Phú, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '02838559999',
    gioLamViec: 'Trực 24/7 (Đăng ký cư trú: Giờ hành chính)',
    canBoPhuTrach: 'Trung tá Lê Hoàng Nam',
    chucVuCanBo: 'Trưởng Công an Phường',
    toaDo: { lat: 10.7492, lng: 106.6538 },
    moTaChucNang: 'Đảm bảo an ninh trật tự, phòng chống tội phạm, quản lý hành chính về trật tự xã hội & VNeID.'
  },
  {
    id: 'quan-su-phuong',
    tenTruSo: 'Ban Chỉ huy Quân sự Phường',
    loaiTruSo: 'quan_su',
    diaChi: '120/5 Bãi Sậy, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '02838552211',
    gioLamViec: 'Thứ 2 - Thứ 6: 07:30 - 17:00 (Trực SSCĐ 24/7)',
    canBoPhuTrach: 'Nguyễn Văn Đạt',
    chucVuCanBo: 'Chỉ huy trưởng Ban CHQS',
    toaDo: { lat: 10.7501, lng: 106.6515 },
    moTaChucNang: 'Quản lý lực lượng dân quân tự vệ, đăng ký nghĩa vụ quân sự và quốc phòng địa phương.'
  },
  {
    id: 'y-te-phuong',
    tenTruSo: 'Trạm Y tế Phường',
    loaiTruSo: 'y_te',
    diaChi: '45 Phạm Văn Chí, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '02838553344',
    gioLamViec: 'Thứ 2 - Thứ 6: 07:30 - 16:30 | Trực cấp cứu 24/7',
    canBoPhuTrach: 'BS. Phạm Thị Bích',
    chucVuCanBo: 'Trưởng Trạm Y tế',
    toaDo: { lat: 10.7478, lng: 106.6542 },
    moTaChucNang: 'Chăm sóc sức khỏe ban đầu, tiêm chủng mở rộng, phòng chống dịch bệnh và khám BHYT.'
  },

  // --- TRỤ SỞ CÁC KHU PHỐ ---
  {
    id: 'ts-kp1',
    tenTruSo: 'Nhà Văn hóa / Trụ sở Khu phố 1',
    loaiTruSo: 'khu_pho',
    khuPhoThuocVong: 'Khu phố 1',
    diaChi: '1378/30 Võ Văn Kiệt, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '0903123456',
    gioLamViec: '08:00 - 17:00 (Họp khu phố các buổi tối theo lịch)',
    canBoPhuTrach: 'Nguyễn Văn An',
    chucVuCanBo: 'Trưởng Ban CT Mặt trận KP1',
    toaDo: { lat: 10.7482, lng: 106.6518 },
    moTaChucNang: 'Nơi sinh hoạt cộng đồng, hội họp Nhân dân và hoạt động Ban công tác Mặt trận Khu phố 1.'
  },
  {
    id: 'ts-kp2',
    tenTruSo: 'Nhà Văn hóa / Trụ sở Khu phố 2',
    loaiTruSo: 'khu_pho',
    khuPhoThuocVong: 'Khu phố 2',
    diaChi: '165 Văn Thân, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '0784322394',
    gioLamViec: '08:00 - 17:00',
    canBoPhuTrach: 'Trần Thanh Lâm',
    chucVuCanBo: 'Trưởng Ban CT Mặt trận KP2',
    toaDo: { lat: 10.7495, lng: 106.6531 },
    moTaChucNang: 'Điểm sinh hoạt văn hóa, tiếp nhận kiến nghị cử trí và sinh hoạt Nhân dân Khu phố 2.'
  },
  {
    id: 'ts-kp3',
    tenTruSo: 'Nhà Văn hóa / Trụ sở Khu phố 3',
    loaiTruSo: 'khu_pho',
    khuPhoThuocVong: 'Khu phố 3',
    diaChi: '34 Bình Tây, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '0344613579',
    gioLamViec: '08:00 - 17:00',
    canBoPhuTrach: 'Phạm Thị Thức',
    chucVuCanBo: 'Trưởng Ban CT Mặt trận KP3',
    toaDo: { lat: 10.7510, lng: 106.6508 },
    moTaChucNang: 'Điểm sinh hoạt cộng đồng và làm việc của Ban công tác Mặt trận Khu phố 3.'
  },
  {
    id: 'ts-kp4',
    tenTruSo: 'Trụ sở Khu phố 4',
    loaiTruSo: 'khu_pho',
    khuPhoThuocVong: 'Khu phố 4',
    diaChi: '102 Bãi Sậy, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '0909112233',
    gioLamViec: '08:00 - 17:00',
    canBoPhuTrach: 'Đặng Văn Minh',
    chucVuCanBo: 'Trưởng Ban CT Mặt trận KP4',
    toaDo: { lat: 10.7518, lng: 106.6522 },
    moTaChucNang: 'Trụ sở làm việc & sinh hoạt cộng đồng Khu phố 4.'
  },
  {
    id: 'ts-kp5',
    tenTruSo: 'Trụ sở Khu phố 5',
    loaiTruSo: 'khu_pho',
    khuPhoThuocVong: 'Khu phố 5',
    diaChi: '210 Phạm Văn Chí, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '0903776655',
    gioLamViec: '08:00 - 17:00',
    canBoPhuTrach: 'Hoàng Thị Dung',
    chucVuCanBo: 'Trưởng Ban CT Mặt trận KP5',
    toaDo: { lat: 10.7470, lng: 106.6550 },
    moTaChucNang: 'Trụ sở làm việc & sinh hoạt cộng đồng Khu phố 5.'
  },
  {
    id: 'ts-kp6',
    tenTruSo: 'Trụ sở Khu phố 6',
    loaiTruSo: 'khu_pho',
    khuPhoThuocVong: 'Khu phố 6',
    diaChi: '89 Hậu Giang, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '0918445522',
    gioLamViec: '08:00 - 17:00',
    canBoPhuTrach: 'Phan Văn Hải',
    chucVuCanBo: 'Trưởng Ban CT Mặt trận KP6',
    toaDo: { lat: 10.7525, lng: 106.6495 },
    moTaChucNang: 'Trụ sở làm việc & sinh hoạt cộng đồng Khu phố 6.'
  },
  {
    id: 'ts-kp7',
    tenTruSo: 'Trụ sở Khu phố 7',
    loaiTruSo: 'khu_pho',
    khuPhoThuocVong: 'Khu phố 7',
    diaChi: '120 Gia Phú, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '0908123777',
    gioLamViec: '08:00 - 17:00',
    canBoPhuTrach: 'Nguyễn Văn Minh',
    chucVuCanBo: 'Trưởng Ban CT Mặt trận KP7',
    toaDo: { lat: 10.7490, lng: 106.6545 },
    moTaChucNang: 'Trụ sở làm việc & sinh hoạt cộng đồng Khu phố 7.'
  },
  {
    id: 'ts-kp8',
    tenTruSo: 'Trụ sở Khu phố 8',
    loaiTruSo: 'khu_pho',
    khuPhoThuocVong: 'Khu phố 8',
    diaChi: '45 Văn Thân, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '0913987654',
    gioLamViec: '08:00 - 17:00',
    canBoPhuTrach: 'Lê Văn Tám',
    chucVuCanBo: 'Trưởng Ban CT Mặt trận KP8',
    toaDo: { lat: 10.7502, lng: 106.6538 },
    moTaChucNang: 'Trụ sở làm việc & sinh hoạt cộng đồng Khu phố 8.'
  },
  {
    id: 'ts-kp9',
    tenTruSo: 'Trụ sở Khu phố 9',
    loaiTruSo: 'khu_pho',
    khuPhoThuocVong: 'Khu phố 9',
    diaChi: '112 Hậu Giang, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '0903112244',
    gioLamViec: '08:00 - 17:00',
    canBoPhuTrach: 'Trần Thị Kim',
    chucVuCanBo: 'Trưởng Ban CT Mặt trận KP9',
    toaDo: { lat: 10.7515, lng: 106.6488 },
    moTaChucNang: 'Trụ sở làm việc & sinh hoạt cộng đồng Khu phố 9.'
  },
  {
    id: 'ts-kp10',
    tenTruSo: 'Trụ sở Khu phố 10',
    loaiTruSo: 'khu_pho',
    khuPhoThuocVong: 'Khu phố 10',
    diaChi: '56 Bình Tây, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '0989556677',
    gioLamViec: '08:00 - 17:00',
    canBoPhuTrach: 'Vũ Quốc Hùng',
    chucVuCanBo: 'Trưởng Ban CT Mặt trận KP10',
    toaDo: { lat: 10.7512, lng: 106.6500 },
    moTaChucNang: 'Trụ sở làm việc & sinh hoạt cộng đồng Khu phố 10.'
  },
  {
    id: 'ts-kp11',
    tenTruSo: 'Trụ sở Khu phố 11',
    loaiTruSo: 'khu_pho',
    khuPhoThuocVong: 'Khu phố 11',
    diaChi: '42 Mai Xuân Thưởng, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '0908778899',
    gioLamViec: '08:00 - 17:00',
    canBoPhuTrach: 'Đỗ Thị Huệ',
    chucVuCanBo: 'Trưởng Ban CT Mặt trận KP11',
    toaDo: { lat: 10.7520, lng: 106.6510 },
    moTaChucNang: 'Trụ sở làm việc & sinh hoạt cộng đồng Khu phố 11.'
  },
  {
    id: 'ts-kp12',
    tenTruSo: 'Trụ sở Khu phố 12',
    loaiTruSo: 'khu_pho',
    khuPhoThuocVong: 'Khu phố 12',
    diaChi: '88 Cao Văn Lầu, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '0918334455',
    gioLamViec: '08:00 - 17:00',
    canBoPhuTrach: 'Phạm Hồng Sơn',
    chucVuCanBo: 'Trưởng Ban CT Mặt trận KP12',
    toaDo: { lat: 10.7480, lng: 106.6528 },
    moTaChucNang: 'Trụ sở làm việc & sinh hoạt cộng đồng Khu phố 12.'
  },
  {
    id: 'ts-kp13',
    tenTruSo: 'Trụ sở Khu phố 13',
    loaiTruSo: 'khu_pho',
    khuPhoThuocVong: 'Khu phố 13',
    diaChi: '250 Trang Tử, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '0903998811',
    gioLamViec: '08:00 - 17:00',
    canBoPhuTrach: 'Bùi Thị Loan',
    chucVuCanBo: 'Trưởng Ban CT Mặt trận KP13',
    toaDo: { lat: 10.7528, lng: 106.6482 },
    moTaChucNang: 'Trụ sở làm việc & sinh hoạt cộng đồng Khu phố 13.'
  },
  {
    id: 'ts-kp14',
    tenTruSo: 'Trụ sở Khu phố 14',
    loaiTruSo: 'khu_pho',
    khuPhoThuocVong: 'Khu phố 14',
    diaChi: '180 Lê Quang Sung, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '0912443322',
    gioLamViec: '08:00 - 17:00',
    canBoPhuTrach: 'Lương Văn Thành',
    chucVuCanBo: 'Trưởng Ban CT Mặt trận KP14',
    toaDo: { lat: 10.7532, lng: 106.6490 },
    moTaChucNang: 'Trụ sở làm việc & sinh hoạt cộng đồng Khu phố 14.'
  },
  {
    id: 'ts-kp15',
    tenTruSo: 'Trụ sở Khu phố 15',
    loaiTruSo: 'khu_pho',
    khuPhoThuocVong: 'Khu phố 15',
    diaChi: '35 Tháp Mười, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '0908556611',
    gioLamViec: '08:00 - 17:00',
    canBoPhuTrach: 'Ngô Thanh Hải',
    chucVuCanBo: 'Trưởng Ban CT Mặt trận KP15',
    toaDo: { lat: 10.7535, lng: 106.6505 },
    moTaChucNang: 'Trụ sở làm việc & sinh hoạt cộng đồng Khu phố 15.'
  },
  {
    id: 'ts-kp16',
    tenTruSo: 'Trụ sở Khu phố 16',
    loaiTruSo: 'khu_pho',
    khuPhoThuocVong: 'Khu phố 16',
    diaChi: '92 Phan Văn Khỏe, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '0919223344',
    gioLamViec: '08:00 - 17:00',
    canBoPhuTrach: 'Hoàng Văn Phúc',
    chucVuCanBo: 'Trưởng Ban CT Mặt trận KP16',
    toaDo: { lat: 10.7540, lng: 106.6515 },
    moTaChucNang: 'Trụ sở làm việc & sinh hoạt cộng đồng Khu phố 16.'
  },
  {
    id: 'ts-kp17',
    tenTruSo: 'Trụ sở Khu phố 17',
    loaiTruSo: 'khu_pho',
    khuPhoThuocVong: 'Khu phố 17',
    diaChi: '15 Nguyễn Hữu Thận, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '0903778811',
    gioLamViec: '08:00 - 17:00',
    canBoPhuTrach: 'Đinh Thiện Nhân',
    chucVuCanBo: 'Trưởng Ban CT Mặt trận KP17',
    toaDo: { lat: 10.7522, lng: 106.6530 },
    moTaChucNang: 'Trụ sở làm việc & sinh hoạt cộng đồng Khu phố 17.'
  },
  {
    id: 'ts-kp18',
    tenTruSo: 'Trụ sở Khu phố 18',
    loaiTruSo: 'khu_pho',
    khuPhoThuocVong: 'Khu phố 18',
    diaChi: '68 Ngô Nhân Tịnh, Phường Bình Tiên, TP. Hồ Chí Minh',
    soDienThoai: '0918667788',
    gioLamViec: '08:00 - 17:00',
    canBoPhuTrach: 'Huỳnh Văn Đức',
    chucVuCanBo: 'Trưởng Ban CT Mặt trận KP18',
    toaDo: { lat: 10.7518, lng: 106.6540 },
    moTaChucNang: 'Trụ sở làm việc & sinh hoạt cộng đồng Khu phố 18.'
  }
];

export const GOOGLE_APPS_SCRIPT_SAMPLE_CODE = `/**
 * Google Apps Script Backend for Front Working Committee Personnel
 * Copy toàn bộ đoạn mã này và dán vào Google Apps Script (Extensions > Apps Script) của Google Sheet.
 * Sau đó Deploy as Web App (Execute as: Me, Who has access: Anyone) và copy Web App URL dán vào ứng dụng!
 */

var HEADERS = [
  "STT",
  "Họ và tên",
  "Năm sinh Nam",
  "Năm sinh Nữ",
  "Chức danh Mặt trận",
  "Chức danh kiêm nhiệm",
  "Địa chỉ cư trú",
  "Số điện thoại",
  "Khu phố"
];

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  // Tự tạo tiêu đề cột nếu Sheet chưa có gì
  if (data.length === 0 || (data.length === 1 && !data[0][0] && !data[0][1])) {
    sheet.clear();
    sheet.appendRow(HEADERS);
    return createJsonResponse({ status: "success", total: 0, data: [] });
  }
  
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] && !row[1]) continue; // Bỏ qua dòng trống
    
    // Đảm bảo số điện thoại luôn giữ số 0 ở đầu
    var rawPhone = row[7] ? String(row[7]).trim() : "";
    if (rawPhone && !rawPhone.startsWith("0") && rawPhone.length === 9) {
      rawPhone = "0" + rawPhone;
    }
    
    var chucDanhKhacStr = row[5] ? String(row[5]) : "";
    
    result.push({
      id: "gs_" + i + "_" + new Date().getTime(),
      stt: row[0] || i,
      hoTen: row[1] || "",
      namSinhNam: row[2] || "",
      namSinhNu: row[3] || "",
      chucDanhMatTran: row[4] || "Thành viên",
      chucDanhKhac: chucDanhKhacStr,
      diaChi: row[6] || "",
      soDienThoai: rawPhone,
      khuPho: row[8] || "Khu phố 1",
      isCapUy: chucDanhKhacStr.toLowerCase().indexOf("bí thư") !== -1 || chucDanhKhacStr.toLowerCase().indexOf("cấp ủy") !== -1
    });
  }
  
  return createJsonResponse({ status: "success", total: result.length, data: result });
}

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var action = contents.action;
    var item = contents.data;
    
    // Đảm bảo Sheet đã có tiêu đề cột
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }
    
    if (action === "ADD") {
      var phoneStr = item.soDienThoai ? "'" + String(item.soDienThoai).trim() : "";
      sheet.appendRow([
        item.stt || (sheet.getLastRow()),
        item.hoTen || "",
        item.namSinhNam || "",
        item.namSinhNu || "",
        item.chucDanhMatTran || "Thành viên",
        item.chucDanhKhac || "",
        item.diaChi || "",
        phoneStr,
        item.khuPho || "Khu phố 1"
      ]);
      return createJsonResponse({ status: "success", message: "Đã thêm thành công vào Google Sheet" });
    }
    
    if (action === "UPDATE") {
      var data = sheet.getDataRange().getValues();
      var targetRow = -1;
      
      for (var r = 1; r < data.length; r++) {
        if (String(data[r][1]).trim().toLowerCase() === String(item.hoTen).trim().toLowerCase() && 
            String(data[r][8]).trim().toLowerCase() === String(item.khuPho).trim().toLowerCase()) {
          targetRow = r + 1;
          break;
        }
      }
      
      if (targetRow > 0) {
        var phoneVal = item.soDienThoai ? "'" + String(item.soDienThoai).trim() : "";
        sheet.getRange(targetRow, 1, 1, 9).setValues([[
          item.stt || targetRow - 1,
          item.hoTen || "",
          item.namSinhNam || "",
          item.namSinhNu || "",
          item.chucDanhMatTran || "Thành viên",
          item.chucDanhKhac || "",
          item.diaChi || "",
          phoneVal,
          item.khuPho || "Khu phố 1"
        ]]);
        return createJsonResponse({ status: "success", message: "Đã cập nhật dòng trong Google Sheet" });
      } else {
        // Nếu không tìm thấy dòng trùng tên & khu phố -> thêm dòng mới
        var pVal = item.soDienThoai ? "'" + String(item.soDienThoai).trim() : "";
        sheet.appendRow([
          item.stt || (sheet.getLastRow()),
          item.hoTen || "",
          item.namSinhNam || "",
          item.namSinhNu || "",
          item.chucDanhMatTran || "Thành viên",
          item.chucDanhKhac || "",
          item.diaChi || "",
          pVal,
          item.khuPho || "Khu phố 1"
        ]);
        return createJsonResponse({ status: "success", message: "Đã thêm mới do không tìm thấy dòng cần sửa" });
      }
    }
    
    if (action === "DELETE") {
      var rows = sheet.getDataRange().getValues();
      for (var d = 1; d < rows.length; d++) {
        if (String(rows[d][1]).trim().toLowerCase() === String(item.hoTen).trim().toLowerCase() && 
            String(rows[d][8]).trim().toLowerCase() === String(item.khuPho).trim().toLowerCase()) {
          sheet.deleteRow(d + 1);
          return createJsonResponse({ status: "success", message: "Đã xóa nhân sự khỏi Google Sheet" });
        }
      }
      return createJsonResponse({ status: "error", message: "Không tìm thấy dữ liệu để xóa" });
    }
    
    if (action === "SYNC_ALL") {
      // Ghi đè toàn bộ danh sách
      sheet.clear();
      sheet.appendRow(HEADERS);
      var list = contents.list || [];
      for (var s = 0; s < list.length; s++) {
        var p = list[s];
        sheet.appendRow([
          p.stt || (s + 1),
          p.hoTen || "",
          p.namSinhNam || "",
          p.namSinhNu || "",
          p.chucDanhMatTran || "Thành viên",
          p.chucDanhKhac || "",
          p.diaChi || "",
          p.soDienThoai ? "'" + String(p.soDienThoai).trim() : "",
          p.khuPho || "Khu phố 1"
        ]);
      }
      return createJsonResponse({ status: "success", message: "Đã đồng bộ toàn bộ danh sách lên Google Sheet" });
    }

    if (action === "updateHeadquartersToaDo") {
      var hqSheet = ss.getSheetByName("ToaDoTruSo") || ss.insertSheet("ToaDoTruSo");
      if (hqSheet.getLastRow() === 0) {
        hqSheet.appendRow(["Mã Trụ Sở", "Tên Trụ Sở", "Vĩ Độ (Latitude)", "Kinh Độ (Longitude)", "Thời Gian Cập Nhật"]);
      }
      hqSheet.appendRow([
        contents.id || "",
        contents.tenTruSo || "",
        contents.lat || "",
        contents.lng || "",
        new Date().toLocaleString("vi-VN")
      ]);
      return createJsonResponse({ status: "success", message: "Đã lưu tọa độ trụ sở lên Google Sheet" });
    }
    
    return createJsonResponse({ status: "error", message: "Hành động không hợp lệ" });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const DEFAULT_FANPAGE_URL = 'https://www.facebook.com/mttqvn.phuongbinhtien';

export const INITIAL_RED_SITES_DATA: RedSite[] = [
  {
    id: 'red-site-1',
    name: 'Mộ và Đền thờ ông Phạm Văn Chí (Đình Bình Hòa)',
    category: 'Di tích Lịch sử Cấp Thành phố',
    address: 'Số 703 đường Phạm Văn Chí - Phường Bình Tiên, TP.HCM',
    summary: 'Ông Phạm Văn Chí sinh trưởng tại làng Bình Đông (Chợ Lớn), xuất thân là một hương chức làng. Khi giặc Pháp xâm chiếm miền Đông Nam Việt, tuy chức phận nhỏ nhưng chí khí cao, ý thức được nhiệm vụ của công dân đối với quốc gia nên ông đã gia nhập phong trào chống xâm lăng của Trương Công Định và lãnh nhiệm vụ hoạt động trong vùng Chợ Lớn với nhiều chiến công oanh liệt. Ngày 10/10/2008, UBND thành phố Hồ Chí Minh ban hành Quyết định số 4301/QĐ-UBND về xếp hạng di tích lịch sử cấp thành phố đối với Mộ và Đền thờ ông Phạm Văn Chí.',
    detailedHistory: 'Di tích lịch sử Mộ và Đền thờ ông Phạm Văn Chí là nơi để nhân dân ghi nhớ, thờ phụng, tôn vinh công đức của tiền nhân; là nơi để nhân dân tham quan, tìm hiểu, nghiên cứu các giá trị về lịch sử, truyền thống đấu tranh chống ngoại xâm và truyền thống đấu tranh cách mạng của dân tộc.',
    imageUrl: 'https://images.unsplash.com/photo-1599386032032-4951d69123a8?auto=format&fit=crop&q=80&w=1000',
    galleryImages: [
      'https://images.unsplash.com/photo-1599386032032-4951d69123a8?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1000'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    toaDo: {
      lat: 10.74450,
      lng: 106.63480,
    },
    openHours: '07:30 - 17:00',
    ticketPrice: 'Miễn phí',
    isFeatured: true,
  },
  {
    id: 'red-site-2',
    name: 'Nhà Truyền Thống Cách Mạng Người Hoa',
    category: 'Di tích Lịch sử Cấp Thành phố',
    address: 'Số 91 đường Phạm Văn Chí - Phường Bình Tiên, TP.HCM',
    summary: 'Với truyền thống yêu nước, truyền thống cách mạng, đồng bào người Việt cũng như người Hoa ở địa phương, đã một lòng một dạ theo Đảng và trong suốt hai cuộc kháng chiến chống thực dân Pháp và đế quốc Mỹ, địa phương luôn là niềm tin, chỗ dựa vững chắc của Thành phố, nhiều vị lãnh đạo Trung ương, Thành ủy đã từng có thời gian hoạt động, chỉ đạo phong trào đấu tranh cách mạng tại địa bàn trong sự bảo vệ, đùm bọc, che chở của nhiều cơ sở cách mạng người Việt và người Hoa, trong đó có gia đình chú Lưu Vinh (Lưu Vinh Phong) - một gia đình người Hoa yêu nước.',
    detailedHistory: 'Có thể nói, căn nhà 91 Đường Phạm Văn Chí rất xứng đáng là một trong những địa chỉ đỏ trong thời kỳ kháng chiến chống Mỹ cứu nước cũng như trong sự nghiệp xây dựng và bảo vệ Tổ quốc Việt Nam xã hội chủ nghĩa. Do giá trị lịch sử cũng như việc phát huy được giá trị trong công tác giáo dục truyền thống của căn nhà 91 Đường Phạm Văn Chí sau khi trở thành Nhà truyền thống người Hoa thành phố, nên ngày 15/10/2008, Ủy ban nhân dân thành phố Hồ Chí Minh đã ban hành Quyết định số 4377/QĐ-UBND công nhận căn nhà số 91 Phạm Văn Chí là Di tích lịch sử cấp Thành phố.',
    imageUrl: 'https://images.unsplash.com/photo-1582560469781-1965b9af903d?auto=format&fit=crop&q=80&w=1000',
    galleryImages: [
      'https://images.unsplash.com/photo-1582560469781-1965b9af903d?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&q=80&w=1000'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    toaDo: {
      lat: 10.74830,
      lng: 106.65080,
    },
    openHours: '07:30 - 17:00 (Thứ 2 - Thứ 6)',
    ticketPrice: 'Miễn phí',
    isFeatured: true,
  },
  {
    id: 'red-site-3',
    name: 'Hầm In Bí Mật Của Ban Tuyên Huấn Hoa Vận',
    category: 'Di tích Lịch sử Cấp Quốc gia',
    address: 'Số 341/10 đường Gia Phú - Phường Bình Tiên, TP.HCM',
    summary: 'Năm 1961, bộ phận Tuyên huấn của Ban cán sự Công vận người Hoa đã tổ chức một sở bí mật in truyền đơn bằng chữ Hoa ngay trong nội thành nhằm góp phần phổ biến kịp thời những tin tức thời sự nóng bỏng của quân và dân trên chiến trường, các chủ trương, chính sách của Mặt trận, cổ vũ, động viên phong trào đấu tranh của các tầng lớp nhân dân trong thành phố.',
    detailedHistory: 'Ngày 26/09/1998, Bộ Văn hóa Thông tin nay là Bộ Văn hóa, Thể thao, Thể thao đã ban hành Quyết định số 2009/1998/QĐ-BVHTT công nhận Di tích lịch sử Hầm bí mật in tài liệu của Ban Tuyên huấn Hoa vận trong thời kỳ chống Mỹ cứu nước tại số 341/10 đường Gia Phú, Phường Bình Tiên.\n\nĐịa chỉ này là nơi để nhân dân tham quan, tìm hiểu, nghiên cứu các giá trị về lịch sử, các hiện vật và truyền thống đấu tranh chống Mỹ của đồng bào Hoa, thành phố Hồ Chí Minh nói riêng và của dân tộc Việt Nam nói chung nhằm giáo dục truyền thống đấu tranh cách mạng cho nhân dân, cho các thế hệ thanh thiếu niên hôm nay và mai sau.',
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=1000',
    galleryImages: [
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1000'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    toaDo: {
      lat: 10.74980,
      lng: 106.65020,
    },
    openHours: '08:00 - 17:00 (Thứ 2 - Thứ 6)',
    ticketPrice: 'Miễn phí',
    isFeatured: true,
  },
];

export const INITIAL_NEWS_DATA: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Áp thấp nhiệt đới đã mạnh lên thành bão Noul, dự báo còn mạnh lên trong 48 giờ tới - Các Khu phố chủ động ứng phó',
    summary: 'Theo Trung tâm Dự báo Khí tượng Thủy văn Quốc gia, áp thấp nhiệt đới đã mạnh lên thành bão và có tên quốc tế là Noul, tăng tốc hướng về biển Đông. Thường trực Ban Công tác Mặt trận 18 Khu phố chủ động kiểm tra các điểm xung yếu, hỗ trợ các hộ dân yếu thế trên địa bàn Phường.',
    imageUrl: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&q=80&w=1000',
    fbUrl: 'https://www.facebook.com/mttqvn.phuongbinhtien',
    publishedAt: '25/07/2026 - 11:34',
    category: 'Cảnh báo & Ứng phó Bão',
    isFeatured: true,
  },
  {
    id: 'news-2',
    title: 'Hà Nội chi 10,4 tỷ đồng dịp Quốc khánh 2/9, người dân được tặng 3 - 25 triệu đồng an sinh xã hội',
    summary: 'UBND & Mặt trận Tổ quốc phát động chuỗi hoạt động chăm lo các gia đình chính sách, người có công và hộ có hoàn cảnh khó khăn dịp Lễ Quốc khánh.',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=400',
    fbUrl: 'https://www.facebook.com/mttqvn.phuongbinhtien',
    publishedAt: '24/07/2026 - 15:20',
    category: 'An sinh xã hội',
    isFeatured: false,
  },
  {
    id: 'news-3',
    title: 'Cô gái hoảng hốt khi camera ghi lại chiếc quạt bốc cháy giữa đêm - Khuyến cáo PCCC hộ gia đình',
    summary: 'Công an & Mặt trận Phường khuyến cáo người dân kiểm tra an toàn hệ thống điện, tắt các thiết bị không cần thiết trước khi đi ngủ hoặc ra khỏi nhà.',
    imageUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400',
    fbUrl: 'https://www.facebook.com/mttqvn.phuongbinhtien',
    publishedAt: '24/07/2026 - 09:15',
    category: 'Tuyên truyền PCCC',
    isFeatured: false,
  },
  {
    id: 'news-4',
    title: '3 sai lầm khi luộc thịt nhiều người Việt mắc phải ảnh hưởng sức khỏe gia đình',
    summary: 'Chuyên gia y tế dự phòng khuyến cáo các nguyên tắc vệ sinh an toàn thực phẩm, lựa chọn thực phẩm tươi sạch trong khu dân cư.',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400',
    fbUrl: 'https://www.facebook.com/mttqvn.phuongbinhtien',
    publishedAt: '23/07/2026 - 18:45',
    category: 'Y tế & Sức khỏe',
    isFeatured: false,
  },
  {
    id: 'news-5',
    title: 'Chàng trai quyết định về quê \'thừa kế\' quán bún mắm vì lời hứa - Gương thanh niên khởi nghiệp',
    summary: 'Phong trào thanh niên làm kinh tế giỏi, phát huy giá trị văn hóa ẩm thực truyền thống địa phương do Đoàn Thanh niên & Mặt trận hỗ trợ.',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=400',
    fbUrl: 'https://www.facebook.com/mttqvn.phuongbinhtien',
    publishedAt: '22/07/2026 - 14:10',
    category: 'Gương sáng cộng đồng',
    isFeatured: false,
  },
];

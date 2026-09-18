/**
 * Tiện ích xử lý múi giờ Việt Nam (Asia/Ho_Chi_Minh - UTC+7)
 * Đảm bảo lưu dữ liệu lên Supabase theo UTC chuẩn (Z) và hiển thị chính xác theo giờ Việt Nam.
 */

/**
 * Lấy các thành phần ngày giờ hiện tại hoặc từ một Date object theo múi giờ Việt Nam
 */
export function getVietnamTimeParts(dateObj: Date = new Date()): {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
  date: string; // YYYY-MM-DD
} {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(dateObj);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    date: `${year}-${month}-${day}`,
  };
}

/**
 * Chuyển ngày, giờ, phút người dùng chọn trên form (theo giờ Việt Nam UTC+7)
 * thành chuỗi ISO UTC chuẩn (kết thúc bằng .000Z) để lưu vào Supabase timestamptz.
 * 
 * Ví dụ: "2026-09-18", "16", "20" -> "2026-09-18T09:20:00.000Z"
 */
export function formatVietnamTimeToUtcISO(
  dateStr: string,
  hourStr: string,
  minuteStr: string
): string {
  const cleanDate = (dateStr || '').trim();
  const cleanHour = (hourStr !== undefined && hourStr !== null ? String(hourStr) : '').trim();
  const cleanMinute = (minuteStr !== undefined && minuteStr !== null ? String(minuteStr) : '').trim();

  // 1. Validate dateStr: Phải có dạng YYYY-MM-DD hợp lệ
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    throw new Error('Ngày hoặc giờ gửi thông báo không hợp lệ');
  }
  const [yearNum, monthNum, dayNum] = cleanDate.split('-').map(Number);
  const calendarCheck = new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
  if (
    calendarCheck.getUTCFullYear() !== yearNum ||
    calendarCheck.getUTCMonth() !== monthNum - 1 ||
    calendarCheck.getUTCDate() !== dayNum
  ) {
    throw new Error('Ngày hoặc giờ gửi thông báo không hợp lệ');
  }

  // 2. Validate hour: Phải từ 00 đến 23
  if (!/^\d{1,2}$/.test(cleanHour)) {
    throw new Error('Ngày hoặc giờ gửi thông báo không hợp lệ');
  }
  const hNum = Number(cleanHour);
  if (isNaN(hNum) || hNum < 0 || hNum > 23) {
    throw new Error('Ngày hoặc giờ gửi thông báo không hợp lệ');
  }

  // 3. Validate minute: Phải từ 00 đến 59
  if (!/^\d{1,2}$/.test(cleanMinute)) {
    throw new Error('Ngày hoặc giờ gửi thông báo không hợp lệ');
  }
  const mNum = Number(cleanMinute);
  if (isNaN(mNum) || mNum < 0 || mNum > 59) {
    throw new Error('Ngày hoặc giờ gửi thông báo không hợp lệ');
  }

  const paddedHour = String(hNum).padStart(2, '0');
  const paddedMinute = String(mNum).padStart(2, '0');

  // Gắn tường minh offset +07:00 của Việt Nam
  const vnDateTimeString = `${cleanDate}T${paddedHour}:${paddedMinute}:00+07:00`;
  const date = new Date(vnDateTimeString);

  if (isNaN(date.getTime())) {
    throw new Error('Ngày hoặc giờ gửi thông báo không hợp lệ');
  }

  return date.toISOString();
}

/**
 * Phân tích chuỗi ISO (hoặc timestamptz từ Supabase) ngược về ngày, giờ, phút
 * theo múi giờ Việt Nam (Asia/Ho_Chi_Minh) để đổ lên form nhập liệu.
 */
export function parseUtcToVietnamTime(isoString: string): {
  date: string;
  hour: string;
  minute: string;
} {
  if (!isoString) {
    const nowParts = getVietnamTimeParts();
    return { date: nowParts.date, hour: nowParts.hour, minute: nowParts.minute };
  }

  let dateObj: Date;
  const trimmed = isoString.trim();

  // Xử lý chuỗi cũ chưa có timezone offset (dạng YYYY-MM-DDTHH:mm:ss hoặc YYYY-MM-DDTHH:mm)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    dateObj = new Date(`${trimmed}+07:00`);
  } else {
    dateObj = new Date(trimmed);
  }

  if (isNaN(dateObj.getTime())) {
    const nowParts = getVietnamTimeParts();
    return { date: nowParts.date, hour: nowParts.hour, minute: nowParts.minute };
  }

  const { date, hour, minute } = getVietnamTimeParts(dateObj);
  return { date, hour, minute };
}

/**
 * Định dạng hiển thị ngày họp theo múi giờ Việt Nam
 */
export function formatVietnamMeetingDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Định dạng hiển thị giờ họp theo múi giờ Việt Nam
 */
export function formatVietnamMeetingTime(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
  } catch {
    return '';
  }
}

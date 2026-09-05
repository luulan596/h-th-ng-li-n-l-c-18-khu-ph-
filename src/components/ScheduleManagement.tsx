import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Bell,
  ShieldCheck,
  Send,
  Plus,
  Trash2,
  Pencil,
  RotateCw,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Lock,
  ChevronRight,
  Download
} from 'lucide-react';
import {
  ScheduledNotification,
  fetchScheduledNotifications,
  saveScheduledNotification,
  updateScheduledNotification,
  deleteScheduledNotification,
  clearAllScheduledNotifications,
  triggerImmediatePushNotification,
  broadcastToAllDevices,
  startNotificationBackgroundScheduler
} from '../services/notificationService';

interface ScheduleManagementProps {
  onShowToast?: (msg: string) => void;
  onRefreshInAppNotifications?: () => void;
}

export const ScheduleManagement: React.FC<ScheduleManagementProps> = ({
  onShowToast,
  onRefreshInAppNotifications
}) => {
  // Authentication State for Admin Workspace
  const [isAdminWorkspace, setIsAdminWorkspace] = useState<boolean>(false);
  const [authAccount, setAuthAccount] = useState<string | null>(() => {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('mt_auth_account');
    }
    return null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authPasswordInput, setAuthPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Notification Scheduling State
  const [scheduledNotifs, setScheduledNotifs] = useState<ScheduledNotification[]>([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState<boolean>(false);

  // Form inputs
  const [notifTitle, setNotifTitle] = useState<string>('');
  const [notifDate, setNotifDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [notifHour, setNotifHour] = useState<string>('08');
  const [notifMinute, setNotifMinute] = useState<string>('00');
  const [notifLocation, setNotifLocation] = useState<string>('Hội trường UBND Phường');
  const [notifContent, setNotifContent] = useState<string>('');
  const [editingNotifId, setEditingNotifId] = useState<string | null>(null);

  // Loading indicator for instant push button
  const [isSendingImmediate, setIsSendingImmediate] = useState<boolean>(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false);

  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);

  const toast = (msg: string) => {
    if (onShowToast) {
      onShowToast(msg);
    } else {
      console.log(msg);
    }
  };

  // Load scheduled notifications on mount and start background scheduler
  useEffect(() => {
    loadNotifications();
    // Kích hoạt Bộ đếm tự động phát tức thì (Background Scheduler quét mỗi 15 - 30 giây)
    startNotificationBackgroundScheduler(() => {
      loadNotifications();
      if (onRefreshInAppNotifications) onRefreshInAppNotifications();
    });
  }, []);

  const loadNotifications = async () => {
    setIsLoadingNotifs(true);
    try {
      const list = await fetchScheduledNotifications();
      setScheduledNotifs(list);
    } catch (err) {
      console.warn('Lỗi tải danh sách lịch:', err);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  // NÚT CHỌN NHANH 'SAU 5 PHÚT NỮA' & CHUẨN HÓA GIỜ VIỆT NAM (GMT+7)
  const handleSetPlus5Minutes = () => {
    const now = new Date();
    // Cộng thêm đúng 5 phút
    const target = new Date(now.getTime() + 5 * 60 * 1000);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const date = String(target.getDate()).padStart(2, '0');
    const hour = String(target.getHours()).padStart(2, '0');
    const minute = String(target.getMinutes()).padStart(2, '0');

    setNotifDate(`${year}-${month}-${date}`);
    setNotifHour(hour);
    setNotifMinute(minute);
    toast(`⏱️ Đã chọn phát sau 5 phút: ${hour}:${minute} (${date}/${month}/${year})`);
  };

  const handleSetToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    setNotifDate(`${year}-${month}-${date}`);
  };

  const handleSetTomorrow = () => {
    const tomorrow = new Date(Date.now() + 86400000);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const date = String(tomorrow.getDate()).padStart(2, '0');
    setNotifDate(`${year}-${month}-${date}`);
  };

  // Open Admin Workspace
  const handleOpenAdminWorkspace = () => {
    const current = authAccount || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('mt_auth_account') : null);
    if (current === 'yeunuhotranp7') {
      setIsAdminWorkspace(true);
      toast('Đã kích hoạt Không gian Quản trị Lịch công tác!');
    } else {
      setAuthPasswordInput('');
      setAuthError('');
      setIsAuthModalOpen(true);
    }
  };

  // Verify Admin Password
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (authPasswordInput.trim() === 'yeunuhotranp7') {
      setAuthAccount('yeunuhotranp7');
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('mt_auth_account', 'yeunuhotranp7');
      }
      setIsAuthModalOpen(false);
      setIsAdminWorkspace(true);
      toast('Xác thực thành công! Đã mở Bảng điều khiển Quản trị.');
    } else {
      setAuthError('Mật khẩu không chính xác. Vui lòng kiểm tra lại!');
    }
  };

  // Reset form
  const handleResetForm = () => {
    setNotifTitle('');
    const d = new Date();
    setNotifDate(d.toISOString().split('T')[0]);
    setNotifHour('08');
    setNotifMinute('00');
    setNotifLocation('Hội trường UBND Phường');
    setNotifContent('');
    setEditingNotifId(null);
  };

  // Handle Edit existing item (đổ dữ liệu lên form để sửa đè, không tạo bản ghi mới)
  const handleStartEdit = (item: ScheduledNotification) => {
    const safeId = String(item.id);
    setEditingNotifId(safeId);
    setNotifTitle(item.tieu_de || '');
    setNotifLocation(item.dia_diem || 'Hội trường UBND Phường');
    setNotifContent(item.noi_dung || '');

    if (item.thoi_gian_gui) {
      try {
        const dt = new Date(item.thoi_gian_gui);
        const year = dt.getFullYear();
        const month = String(dt.getMonth() + 1).padStart(2, '0');
        const date = String(dt.getDate()).padStart(2, '0');
        setNotifDate(`${year}-${month}-${date}`);
        setNotifHour(String(dt.getHours()).padStart(2, '0'));
        setNotifMinute(String(dt.getMinutes()).padStart(2, '0'));
      } catch {
        // fallback
      }
    }

    toast(`✏️ Đang chỉnh sửa thông báo: "${item.tieu_de}". Dữ liệu sẽ được ghi đè trực tiếp.`);
    const formCard = document.getElementById('admin-schedule-form-card');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle Delete từng thông báo
  const handleDeleteNotif = async (id: string | number) => {
    if (!window.confirm('Đồng chí có chắc chắn muốn xóa lịch công tác này khỏi hệ thống?')) {
      return;
    }
    const safeId = String(id);
    // Cập nhật giao diện ngay lập tức
    setScheduledNotifs((prev) => prev.filter((x) => String(x.id) !== safeId));
    if (editingNotifId === safeId) {
      handleResetForm();
    }
    await deleteScheduledNotification(id);
    toast('🗑️ Đã xóa thông báo thành công!');
    await loadNotifications();
    if (onRefreshInAppNotifications) onRefreshInAppNotifications();
  };

  // Bổ sung nút 'XÓA TẤT CẢ LỊCH' (Clear All)
  const handleClearAll = async () => {
    if (
      !window.confirm(
        'CẢNH BÁO: Đồng chí có chắc chắn muốn XÓA TOÀN BỘ tất cả các lịch thông báo trong cơ sở dữ liệu Supabase? Hành động này sẽ làm sạch hoàn toàn và không thể hoàn tác!'
      )
    ) {
      return;
    }
    try {
      setScheduledNotifs([]);
      handleResetForm();
      const res = await clearAllScheduledNotifications();
      toast(`🗑️ ${res.message}`);
      await loadNotifications();
      if (onRefreshInAppNotifications) onRefreshInAppNotifications();
    } catch (err: any) {
      toast(`Lỗi khi xóa toàn bộ lịch: ${err?.message || 'Vui lòng kiểm tra lại'}`);
    }
  };

  // 1. SAVE SCHEDULE (Lưu lịch phát thông thường hoặc CẬP NHẬT THAY THẾ)
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim()) {
      toast('Vui lòng nhập tiêu đề thông báo!');
      return;
    }

    setIsSavingSchedule(true);
    try {
      const scheduledDateTime = `${notifDate}T${notifHour}:${notifMinute}:00`;
      const itemToSave = {
        id: editingNotifId || undefined,
        tieu_de: notifTitle.trim(),
        thoi_gian_gui: scheduledDateTime,
        dia_diem: notifLocation.trim() || 'Hội trường UBND Phường',
        noi_dung: notifContent.trim() || 'Kính mời quý đại biểu tham dự cuộc họp đúng giờ.',
        loai_thong_bao: 'LỊCH HỌP'
      };

      const result = await saveScheduledNotification(itemToSave);
      if (result.success) {
        toast(editingNotifId ? '💾 Đã cập nhật thay thế thông báo thành công!' : 'Đã lên lịch phát thông báo thành công!');
        handleResetForm();
        await loadNotifications();
        if (onRefreshInAppNotifications) onRefreshInAppNotifications();
      } else {
        toast(result.message || 'Lỗi khi lưu lịch');
      }
    } catch (err: any) {
      toast(err?.message || 'Có lỗi xảy ra khi lưu lịch');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // 2. IMMEDIATE PUSH BROADCAST (🚀 PHÁT THÔNG BÁO NGAY LẬP TỨC / GỬI ĐẾN TOÀN BỘ THIẾT BỊ)
  const handleTriggerImmediatePush = async () => {
    if (!notifTitle.trim()) {
      toast('Vui lòng nhập Tiêu đề thông báo trước khi phát!');
      return;
    }

    if (!window.confirm('Xác nhận: PHÁT THÔNG BÁO NGAY LẬP TỨC đến toàn bộ các thiết bị đăng ký trong bảng push_subscribers và hiển thị chuông đỏ (Red Badge)?')) {
      return;
    }

    setIsSendingImmediate(true);
    try {
      const scheduledDateTime = `${notifDate}T${notifHour}:${notifMinute}:00`;
      const title = notifTitle.trim();
      const content = notifContent.trim() || 'Kính mời các đồng chí tham dự cuộc họp công tác theo lịch.';
      const location = notifLocation.trim() || 'Hội trường UBND Phường';

      // Bước 1: Lưu vào cơ sở dữ liệu Supabase bảng scheduled_notifications
      const itemToSave = {
        id: editingNotifId || undefined,
        tieu_de: title,
        thoi_gian_gui: scheduledDateTime,
        dia_diem: location,
        noi_dung: content,
        loai_thong_bao: 'KHẨN'
      };
      const saveRes = await saveScheduledNotification(itemToSave);
      const recordId = saveRes.data?.id || editingNotifId || undefined;

      // Bước 2: Kích hoạt broadcastToAllDevices
      // (Đọc danh sách push_subscribers, gửi Push, cập nhật scheduled_notifications từ pending sang sent, bật Red Badge)
      const pushResult = await broadcastToAllDevices({
        id: recordId,
        tieu_de: title,
        noi_dung: content,
        dia_diem: location,
        thoi_gian_gui: scheduledDateTime,
        loai_thong_bao: 'KHẨN'
      });

      toast(`🚀 ${pushResult.message}`);
      handleResetForm();
      await loadNotifications();
      if (onRefreshInAppNotifications) onRefreshInAppNotifications();
    } catch (err: any) {
      toast(`Lỗi khi phát thông báo: ${err?.message || 'Vui lòng kiểm tra lại kết nối'}`);
    } finally {
      setIsSendingImmediate(false);
    }
  };

  // 3. GỬI ĐẾN TOÀN BỘ THIẾT BỊ TỪ DANH SÁCH LỊCH ĐÃ CÓ
  const handleSendToAllDevices = async (item: ScheduledNotification) => {
    if (!window.confirm(`Xác nhận: GỬI ĐẾN TOÀN BỘ THIẾT BỊ thông báo "${item.tieu_de}"? Hệ thống sẽ quét toàn bộ bảng push_subscribers, gửi thông báo đẩy và bật chuông đỏ ứng dụng.`)) {
      return;
    }

    setIsSendingImmediate(true);
    try {
      const pushResult = await broadcastToAllDevices({
        id: item.id,
        tieu_de: item.tieu_de,
        noi_dung: item.noi_dung || '',
        dia_diem: item.dia_diem || '',
        thoi_gian_gui: item.thoi_gian_gui,
        loai_thong_bao: item.loai_thong_bao || 'LỊCH HỌP'
      });

      toast(`🚀 ${pushResult.message}`);
      await loadNotifications();
      if (onRefreshInAppNotifications) onRefreshInAppNotifications();
    } catch (err: any) {
      toast(`Lỗi khi gửi thông báo: ${err?.message || 'Vui lòng thử lại'}`);
    } finally {
      setIsSendingImmediate(false);
    }
  };

  // Format date and time
  const formatMeetingDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatMeetingTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  // Helper to generate & download .ics file for Apple Calendar (iOS / macOS)
  const downloadICS = (item: ScheduledNotification, start: Date, end: Date) => {
    const formatICSDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UBMTTQ Binh Tien//Lich Hop//VI',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:mt-meet-${item.id}-${Date.now()}@mttq-binhtien.gov.vn`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(start)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${item.tieu_de}`,
      `LOCATION:${item.dia_diem || 'Hội trường UBND Phường Bình Tiên'}`,
      `DESCRIPTION:${item.noi_dung || 'Kính mời quý đại biểu tham dự cuộc họp đúng giờ.'}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Nhắc nhở họp trước 30 phút',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `LichHop-MTTQ-${item.id || Date.now()}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to open Google Calendar event creation
  const openGoogleCalendar = (item: ScheduledNotification, start: Date, end: Date) => {
    const formatGCalDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const title = encodeURIComponent(item.tieu_de || 'Lịch họp Mặt trận');
    const details = encodeURIComponent(item.noi_dung || '');
    const location = encodeURIComponent(item.dia_diem || 'Hội trường UBND Phường Bình Tiên');
    const dates = `${formatGCalDate(start)}/${formatGCalDate(end)}`;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Handle Remind Meeting
  const handleRemindScheduledMeeting = (item: ScheduledNotification) => {
    const start = new Date(item.thoi_gian_gui);
    const end = new Date(start.getTime() + 2 * 3600 * 1000);
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    const platform = typeof navigator !== 'undefined' ? ((navigator as any).userAgentData?.platform || navigator.platform || '') : '';
    const isApple =
      /iPhone|iPad|iPod|Macintosh|Mac OS X/i.test(ua) ||
      /Mac/i.test(platform) ||
      (platform === 'MacIntel' && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);

    if (isApple) {
      downloadICS(item, start, end);
      toast('Đang tải tệp .ics mở ứng dụng Lịch (Apple Calendar)!');
    } else {
      openGoogleCalendar(item, start, end);
      toast('Đang mở Google Calendar để lưu lịch họp!');
    }
  };

  // Check if item is new (within 24h)
  const isNewNotification = (createdAt?: string) => {
    if (!createdAt) return false;
    try {
      const created = new Date(createdAt).getTime();
      return Date.now() - created < 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  };

  // Filter out expired schedules for public view
  const publicScheduleList = scheduledNotifs.filter((item) => {
    if (!item.thoi_gian_gui) return true;
    try {
      const d = new Date(item.thoi_gian_gui);
      // Keep today and upcoming
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      return d.getTime() >= startOfToday.getTime();
    } catch {
      return true;
    }
  });

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* GIAO DIỆN 1: QUẢN TRỊ VIÊN (KHI BẬT ADMIN WORKSPACE VỚI yeunuhotranp7)     */}
      {/* ========================================================================= */}
      {isAdminWorkspace && authAccount === 'yeunuhotranp7' ? (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Header Action Bar for Admin */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAdminWorkspace(false);
                handleResetForm();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-black border border-slate-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <span>← Quay lại lịch công tác</span>
            </button>

            <span className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Không gian Quản trị Lịch & Điều hành</span>
            </span>
          </div>

          {/* BIỂU MẪU LÊN LỊCH & PHÁT THÔNG BÁO TỨC THÌ */}
          <div
            id="admin-schedule-form-card"
            className={`bg-white p-4 sm:p-6 rounded-2xl border transition-all ${
              editingNotifId
                ? 'border-amber-400 ring-2 ring-amber-100 shadow-md'
                : 'border-slate-200 shadow-sm'
            } space-y-4`}
          >
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-800 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase">
                    {editingNotifId ? 'CHỈNH SỬA THÔNG BÁO LỊCH' : 'QUẢN TRỊ LỊCH GỬI TIN & PHÁT THÔNG BÁO'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Soạn thảo thông báo khẩn, lịch họp và phát tin tức thì qua Web Push API đến toàn bộ cán bộ và Nhân dân.
                  </p>
                </div>
              </div>

              {editingNotifId && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  ✕ Hủy sửa
                </button>
              )}
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              {/* 1. Tiêu đề thông báo (*) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Tiêu đề thông báo / Lịch họp <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Ví dụ: Triệu tập Họp Ban Thường trực UB.MTTQ VN Phường..."
                    className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 font-medium"
                  />
                  <Bell className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* 2. Thời gian phát tin (Ngày / Giờ / Phút) (*) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-start">
                <div className="sm:col-span-6 space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Ngày phát tin / Ngày họp <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={notifDate}
                      onChange={(e) => setNotifDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 font-medium bg-white shadow-2xs"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={handleSetToday}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-semibold cursor-pointer"
                    >
                      Hôm nay
                    </button>
                    <button
                      type="button"
                      onClick={handleSetTomorrow}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-semibold cursor-pointer"
                    >
                      Ngày mai
                    </button>
                    <button
                      type="button"
                      id="btn-quick-plus-5-mins"
                      onClick={handleSetPlus5Minutes}
                      className="px-2.5 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title="Tự động lấy đúng giờ hiện tại cộng thêm 5 phút, chuẩn hóa giờ Việt Nam (GMT+7)"
                    >
                      <span>⏱️ Sau 5 phút nữa</span>
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-6 space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Giờ & Phút (Định dạng 24h): <span className="font-mono text-red-700 font-bold">{notifHour}:{notifMinute}</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={notifHour}
                      onChange={(e) => setNotifHour(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 font-medium bg-white"
                    >
                      {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                        <option key={h} value={h}>Giờ: {h}</option>
                      ))}
                    </select>

                    <select
                      value={notifMinute}
                      onChange={(e) => setNotifMinute(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 font-medium bg-white"
                    >
                      {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                        <option key={m} value={m}>Phút: {m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Địa điểm làm việc / phòng họp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Địa điểm làm việc / Phòng họp
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={notifLocation}
                    onChange={(e) => setNotifLocation(e.target.value)}
                    placeholder="Ví dụ: Hội trường Tầng 2, Trụ sở UBND Phường Bình Tiên"
                    className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 font-medium"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* 4. Nội dung chi tiết thông báo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Nội dung chi tiết thông báo
                </label>
                <textarea
                  rows={3}
                  value={notifContent}
                  onChange={(e) => setNotifContent(e.target.value)}
                  placeholder="Kính mời các đồng chí trong Ban Thường trực, Trưởng Ban CTMT 18 Khu phố tham dự đầy đủ..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 font-medium leading-relaxed"
                />
              </div>

              {/* 5. NÚT HÀNH ĐỘNG 2 NÚT NỔI BẬT: 🚀 PHÁT THÔNG BÁO NGAY LẬP TỨC + LƯU LỊCH GỬI */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                {editingNotifId && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                  >
                    ✕ Hủy sửa
                  </button>
                )}

                {/* NÚT 1: 🚀 PHÁT THÔNG BÁO NGAY LẬP TỨC (GỬI ĐẾN TOÀN BỘ THIẾT BỊ) */}
                <button
                  type="button"
                  id="btn-broadcast-immediate-push"
                  disabled={isSendingImmediate || isSavingSchedule}
                  onClick={handleTriggerImmediatePush}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl text-xs sm:text-sm font-black tracking-wide flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 ring-2 ring-red-300"
                  title="Đọc danh sách bảng push_subscribers, gửi thông báo tới tất cả thiết bị, cập nhật scheduled_notifications sang sent và bật Red Badge"
                >
                  <span className="text-base leading-none">🚀</span>
                  <span>{isSendingImmediate ? 'ĐANG PHÁT THÔNG BÁO...' : '🚀 PHÁT THÔNG BÁO NGAY LẬP TỨC (GỬI ĐẾN TOÀN BỘ THIẾT BỊ)'}</span>
                </button>

                {/* NÚT 2: LƯU LỊCH GỬI / CẬP NHẬT THAY THẾ THÔNG BÁO */}
                {editingNotifId ? (
                  <button
                    type="submit"
                    disabled={isSavingSchedule || isSendingImmediate}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md hover:shadow-lg ring-2 ring-amber-300 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    title="Ghi đè trực tiếp vào bản ghi cũ theo ID trên Supabase, tuyệt đối không tạo bản ghi mới"
                  >
                    <span>💾</span>
                    <span>{isSavingSchedule ? 'ĐANG CẬP NHẬT...' : '💾 CẬP NHẬT THAY THẾ THÔNG BÁO'}</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSavingSchedule || isSendingImmediate}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Calendar className="w-4 h-4 text-slate-300" />
                    <span>{isSavingSchedule ? 'ĐANG LƯU...' : 'LƯU LỊCH GỬI'}</span>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* DANH SÁCH LỊCH ĐÃ TẠO TRONG DATABASE */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h5 className="text-xs sm:text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                <span>DANH SÁCH THÔNG BÁO & LỊCH CÔNG TÁC ĐÃ LÊN LỊCH</span>
                <span className="text-xs font-bold text-slate-500">({scheduledNotifs.length})</span>
              </h5>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-clear-all-schedules"
                  onClick={handleClearAll}
                  disabled={scheduledNotifs.length === 0}
                  className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                  title="Xóa toàn bộ tất cả thông báo trong cơ sở dữ liệu Supabase"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa tất cả lịch</span>
                </button>
                <button
                  type="button"
                  onClick={loadNotifications}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Tải lại danh sách"
                >
                  <RotateCw className={`w-4 h-4 ${isLoadingNotifs ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {scheduledNotifs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Chưa có thông báo nào được lưu trong hệ thống.
              </p>
            ) : (
              <div className="space-y-2.5">
                {scheduledNotifs.map((item) => {
                  const safeId = String(item.id);
                  const isEditingThis = editingNotifId === safeId;
                  const isSent = item.trang_thai === 'sent';

                  return (
                    <div
                      key={safeId}
                      className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
                        isEditingThis
                          ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-200'
                          : 'bg-slate-50/70 hover:bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                            {item.loai_thong_bao || 'Lịch Họp'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isSent
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {isSent ? '✓ Đã gửi (Sent)' : '⏱ Chờ gửi (Pending)'}
                          </span>
                          <span className="text-[11px] font-bold text-slate-900">
                            {item.tieu_de}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            type="button"
                            onClick={() => handleSendToAllDevices(item)}
                            disabled={isSendingImmediate}
                            className="px-2.5 py-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg text-[10px] font-black tracking-wide flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                            title="Quét bảng push_subscribers, gửi thông báo tới tất cả thiết bị, cập nhật scheduled_notifications sang sent và bật Red Badge"
                          >
                            <span>🚀</span>
                            <span>GỬI ĐẾN TOÀN BỘ THIẾT BỊ</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-800 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="Sửa thông báo"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNotif(item.id)}
                            className="p-1.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="Xóa thông báo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-red-600" />
                          <span>{formatMeetingDate(item.thoi_gian_gui)} - {formatMeetingTime(item.thoi_gian_gui)}</span>
                        </div>
                        {item.dia_diem && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-600" />
                            <span>{item.dia_diem}</span>
                          </div>
                        )}
                      </div>

                      {item.noi_dung && (
                        <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2">
                          {item.noi_dung}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* GIAO DIỆN 2: DÀNH CHO CÁN BỘ & NHÂN DÂN XEM CÔNG KHAI                    */
        /* ========================================================================= */
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Nút bấm Quản trị: Lên lịch phát thông báo */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Lịch giao ban Thường trực, tiếp xúc cử tri & sinh hoạt Ban CTMT 18 Khu phố.
            </span>

            <button
              id="btn-admin-schedule-notif"
              type="button"
              onClick={handleOpenAdminWorkspace}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Dành cho Quản trị viên: Đăng nhập để lên lịch và quản lý thông báo"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Quản trị: Lên lịch phát thông báo</span>
            </button>
          </div>

          {/* DANH SÁCH LỊCH CÔNG TÁC ĐÃ PHÁT HÀNH */}
          {publicScheduleList.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center space-y-2.5">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Hiện không có lịch công tác nào sắp tới</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Các lịch họp đã qua ngày sẽ tự động được ẩn khỏi màn hình. Khi Ban Thường trực phát hành lịch họp mới, thông tin sẽ được cập nhật ngay tại đây.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {publicScheduleList.map((item) => {
                const isNew = isNewNotification(item.created_at);

                return (
                  <div
                    key={String(item.id)}
                    className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-3 relative group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                            {item.loai_thong_bao || 'Lịch Công Tác'}
                          </span>

                          {isNew && (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500 text-white shadow-xs animate-pulse ring-2 ring-rose-200"
                              title="Thông báo mới phát hành trong vòng 24 giờ qua"
                            >
                              <Zap className="w-3 h-3 fill-current text-amber-100" />
                              <span>MỚI</span>
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                          Phường Bình Tiên
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {item.tieu_de}
                      </h4>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-700">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                          <span className="font-bold text-slate-900">{formatMeetingTime(item.thoi_gian_gui)}</span>
                          <span className="text-slate-400">|</span>
                          <Calendar className="w-3.5 h-3.5 text-red-700 shrink-0" />
                          <span>{formatMeetingDate(item.thoi_gian_gui)}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          <span>Địa điểm: <strong className="text-slate-900">{item.dia_diem || 'Hội trường UBND Phường'}</strong></span>
                        </div>
                      </div>

                      {item.noi_dung && (
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {item.noi_dung}
                        </p>
                      )}
                    </div>

                    {/* NÚT DUY NHẤT: [🔔 NHẮC TÔI / LƯU VÀO LỊCH] - TỰ ĐỘNG NHẬN DIỆN HỆ ĐIỀU HÀNH */}
                    <div className="pt-3 border-t border-slate-100">
                      <button
                        id={`btn-remind-meeting-${item.id}`}
                        type="button"
                        onClick={() => handleRemindScheduledMeeting(item)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs hover:shadow-sm transition-all active:scale-95 cursor-pointer"
                        title="Tự động thêm vào Apple Calendar (iOS/Mac) hoặc Google Calendar (Android/Windows)"
                      >
                        <Bell className="w-4 h-4 text-amber-100" />
                        <span>🔔 NHẮC TÔI / LƯU VÀO LỊCH</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL XÁC THỰC MẬT KHẨU QUẢN TRỊ (yeunuhotranp7) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase">
                  XÁC THỰC QUẢN TRỊ VIÊN
                </h4>
                <p className="text-[11px] text-slate-500">
                  Nhập mật khẩu quản trị để mở giao diện lên lịch & phát tin.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mật khẩu Quản trị
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  value={authPasswordInput}
                  onChange={(e) => {
                    setAuthPasswordInput(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="Nhập mật khẩu..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                {authError && (
                  <p className="text-[11px] font-bold text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{authError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

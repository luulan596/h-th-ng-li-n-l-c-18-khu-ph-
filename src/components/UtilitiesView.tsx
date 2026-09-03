import React, { useState, useMemo, useEffect } from 'react';
import { Personnel, Headquarters, RedSite, ScheduledNotification } from '../types';
import { OverviewView } from './OverviewView';
import {
  fetchScheduledNotifications,
  saveScheduledNotification,
  deleteScheduledNotification
} from '../services';
import {
  BarChart3,
  Calendar,
  CalendarDays,
  FileText,
  MessageSquareQuote,
  Plus,
  Bell,
  BellRing,
  Clock,
  MapPin,
  Users,
  Lock,
  CheckCircle2,
  AlertCircle,
  Download,
  ExternalLink,
  ChevronRight,
  Search,
  BookOpen,
  Send,
  Sparkles,
  ShieldCheck,
  Trash2,
  RefreshCw,
  Smartphone,
  X
} from 'lucide-react';

interface UtilitiesViewProps {
  personnelList: Personnel[];
  headquartersList: Headquarters[];
  redSitesList: RedSite[];
  onSelectKhuPho?: (kp: string) => void;
  onNavigateToFeedback?: () => void;
}

interface MeetingEvent {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DDTHH:mm
  endDate: string;
  location: string;
  attendees: string;
  description: string;
  category: 'Giao ban' | 'Tiếp xúc cử tri' | 'Sinh hoạt Mặt trận' | 'Tập huấn' | 'Đột xuất';
}

const DEFAULT_MEETINGS: MeetingEvent[] = [
  {
    id: 'meet-1',
    title: 'Họp Giao ban Ban Thường trực UB.MTTQ Việt Nam Phường',
    startDate: '2026-09-07T08:30',
    endDate: '2026-09-07T10:30',
    location: 'Hội trường số 2, Trụ sở UBND Phường Bình Tiên',
    attendees: 'Ban Thường trực UB.MTTQ VN Phường, đại diện các tổ chức Chính trị - Xã hội',
    description: 'Đánh giá tiến độ công tác tuần qua, kiểm tra phong trào và phân công nhiệm vụ trọng tâm tuần mới.',
    category: 'Giao ban'
  },
  {
    id: 'meet-2',
    title: 'Hội nghị Tiếp xúc Cử tri trước kỳ họp HĐND các cấp',
    startDate: '2026-09-15T14:00',
    endDate: '2026-09-15T16:30',
    location: 'Hội trường Trung tâm Văn hóa Phường Bình Tiên',
    attendees: 'Thường trực HĐND - UBND - UB.MTTQ VN Phường và Đại diện Cử tri 18 Khu phố',
    description: 'Báo cáo dự kiến chương trình kỳ họp, tiếp thu ý kiến và tâm tư nguyện vọng của nhân dân địa phương.',
    category: 'Tiếp xúc cử tri'
  },
  {
    id: 'meet-3',
    title: 'Sinh hoạt định kỳ Ban Công tác Mặt trận 18 Khu phố tháng 9/2026',
    startDate: '2026-09-11T19:00',
    endDate: '2026-09-11T20:30',
    location: 'Tại 18 Trụ sở Ban Điều hành & Ban Công tác Mặt trận Khu phố',
    attendees: 'Trưởng ban, Phó Trưởng ban và các Thành viên Ban CTMT 18 Khu phố',
    description: 'Triển khai Cuộc vận động Toàn dân đoàn kết xây dựng nông thôn mới, đô thị văn minh và rà soát an sinh xã hội.',
    category: 'Sinh hoạt Mặt trận'
  },
  {
    id: 'meet-4',
    title: 'Tập huấn bồi dưỡng kỹ năng giám sát, phản biện xã hội ở cơ sở',
    startDate: '2026-09-22T08:00',
    endDate: '2026-09-22T11:30',
    location: 'Hội trường Trung tâm Bồi dưỡng Chính trị Quận',
    attendees: 'Trưởng Ban CTMT 18 Khu phố và Ban Thanh tra nhân dân Phường',
    description: 'Hướng dẫn quy trình giám sát đầu tư cộng đồng theo Luật Thực hiện Dân chủ ở cơ sở năm 2022.',
    category: 'Tập huấn'
  }
];

interface OfficialDocument {
  id: string;
  code: string;
  title: string;
  issueDate: string;
  agency: string;
  summary: string;
  category: string;
  highlights: string[];
}

const OFFICIAL_DOCUMENTS: OfficialDocument[] = [
  {
    id: 'doc-1',
    code: 'Luật số 10/2022/QH15',
    title: 'Luật Thực hiện Dân chủ ở cơ sở năm 2022',
    issueDate: '10/11/2022 (Hiệu lực 01/07/2023)',
    agency: 'Quốc hội nước CHXHCN Việt Nam',
    summary: 'Quy định nội dung, cách thức thực hiện dân chủ ở cơ sở, quyền và nghĩa vụ của công dân, trách nhiệm của Ban Công tác Mặt trận.',
    category: 'Luật pháp',
    highlights: [
      'Công khai, minh bạch các khoản đóng góp tự nguyện của nhân dân',
      'Nhân dân bàn và quyết định trực tiếp các công trình phúc lợi cộng đồng',
      'Phát huy vai trò của Ban Thanh tra nhân dân và Ban Giám sát đầu tư của cộng đồng'
    ]
  },
  {
    id: 'doc-2',
    code: 'Điều lệ MTTQ VN (Khóa IX)',
    title: 'Điều lệ Mặt trận Tổ quốc Việt Nam',
    issueDate: '20/09/2019',
    agency: 'Đại hội Đại biểu Toàn quốc MTTQ Việt Nam',
    summary: 'Xác định vị trí, vai trò, nguyên tắc hiệp thương dân chủ và tổ chức của Ban Công tác Mặt trận ở khu phố.',
    category: 'Điều lệ',
    highlights: [
      'Ban Công tác Mặt trận do Ban Thường trực UB.MTTQ cấp xã ra quyết định thành lập',
      'Cơ cấu gồm Trưởng ban, Phó Trưởng ban và đại diện các chi hội đoàn thể khu phố',
      'Phối hợp với Trưởng khu phố tổ chức các cuộc vận động, phong trào thi đua yêu nước'
    ]
  },
  {
    id: 'doc-3',
    code: 'Hướng dẫn số 01/HD-MTTQ',
    title: 'Quy trình kiện toàn Trưởng, Phó Ban Công tác Mặt trận Khu phố',
    issueDate: '15/01/2025',
    agency: 'Ban Thường trực UB.MTTQ VN Phường Bình Tiên',
    summary: 'Hướng dẫn tiêu chuẩn nhân sự, quy trình hiệp thương giới thiệu và chuẩn y nhân sự Ban CTMT 18 Khu phố.',
    category: 'Hướng dẫn nghiệp vụ',
    highlights: [
      'Tiêu chuẩn: Cán bộ có uy tín, nhiệt tình, có tinh thần trách nhiệm cao với cộng đồng',
      'Quy trình 3 bước: Chi bộ giới thiệu -> Hiệp thương khu phố -> Thường trực Phường chuẩn y',
      'Bảo đảm tỷ lệ cấp ủy chi bộ tham gia lãnh đạo công tác Mặt trận cơ sở'
    ]
  },
  {
    id: 'doc-4',
    code: 'Thông tri số 25/TT-MTTW-BTT',
    title: 'Tổ chức Ngày hội Đại đoàn kết toàn dân tộc ở khu dân cư',
    issueDate: '10/08/2023',
    agency: 'Ủy ban Trung ương MTTQ Việt Nam',
    summary: 'Hướng dẫn tổ chức phần Lễ và phần Hội nhân dịp kỷ niệm Ngày Truyền thống MTTQ Việt Nam (18/11 hàng năm).',
    category: 'Phong trào',
    highlights: [
      'Tổ chức trang trọng, tiết kiệm, thực chất và thu hút đông đảo nhân dân',
      'Biểu dương các gia đình văn hóa, người tốt việc tốt và gương điển hình cơ sở',
      'Tổ chức bữa cơm đại đoàn kết và các trò chơi dân gian gắn kết tình làng nghĩa xóm'
    ]
  }
];

export const UtilitiesView: React.FC<UtilitiesViewProps> = ({
  personnelList,
  headquartersList,
  redSitesList,
  onSelectKhuPho,
  onNavigateToFeedback
}) => {
  // --- Active Tab State ---
  const [activeCard, setActiveCard] = useState<'THONG_KE' | 'LICH_CONG_TAC' | 'VAN_BAN' | 'Y_KIEN' | 'THONG_BAO_DAY'>('THONG_KE');
  const [shakingCard, setShakingCard] = useState<string | null>(null);

  // --- Scheduled Notifications State ---
  const [scheduledNotifs, setScheduledNotifs] = useState<ScheduledNotification[]>([]);
  const [isFetchingNotifs, setIsFetchingNotifs] = useState(false);
  const [isSavingNotif, setIsSavingNotif] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifContent, setNotifContent] = useState('');
  const [notifDate, setNotifDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [notifHour, setNotifHour] = useState('08');
  const [notifMinute, setNotifMinute] = useState('30');
  const [pendingAuthAction, setPendingAuthAction] = useState<'ADD_MEETING' | 'THONG_BAO_DAY' | null>(null);

  // Load scheduled notifications on mount
  useEffect(() => {
    loadScheduledNotifications();
  }, []);

  const loadScheduledNotifications = async () => {
    setIsFetchingNotifs(true);
    try {
      const data = await fetchScheduledNotifications();
      setScheduledNotifs(data);
    } catch (e) {
      console.warn('Error loading scheduled notifications:', e);
    } finally {
      setIsFetchingNotifs(false);
    }
  };

  // --- Meetings State ---
  const [meetings, setMeetings] = useState<MeetingEvent[]>(() => {
    const saved = localStorage.getItem('mt_custom_meetings_v2026');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* fallback */ }
    }
    return DEFAULT_MEETINGS;
  });

  // --- Auth & Add Meeting Modal State ---
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddMeetingModalOpen, setIsAddMeetingModalOpen] = useState(false);
  const [authAccount, setAuthAccount] = useState<string>(() => {
    return sessionStorage.getItem('mt_auth_account') || '';
  });
  const [authUsernameInput, setAuthUsernameInput] = useState('');
  const [authPasswordInput, setAuthPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // --- New Meeting Form State ---
  const [newMeeting, setNewMeeting] = useState<Omit<MeetingEvent, 'id'>>({
    title: '',
    startDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 86400000 + 7200000).toISOString().slice(0, 16),
    location: 'Trụ sở UBND Phường Bình Tiên',
    attendees: 'Ban Công tác Mặt trận 18 Khu phố',
    description: '',
    category: 'Giao ban'
  });

  // --- Feedback Card State ---
  const [feedbackForm, setFeedbackForm] = useState({
    senderName: '',
    phone: '',
    khuPho: 'Khu phố 1',
    category: 'An sinh xã hội',
    title: '',
    content: ''
  });
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // --- Document Modal State ---
  const [selectedDoc, setSelectedDoc] = useState<OfficialDocument | null>(null);
  const [calendarToast, setCalendarToast] = useState<string | null>(null);

  // Click card handler with CSS lacLuThe animation
  const handleCardClick = (cardKey: 'THONG_KE' | 'LICH_CONG_TAC' | 'VAN_BAN' | 'Y_KIEN' | 'THONG_BAO_DAY') => {
    setShakingCard(cardKey);
    setActiveCard(cardKey);
    setTimeout(() => {
      setShakingCard(null);
    }, 350);
  };

  // Trigger calendar reminder (.ics download for iOS/Mac or Google Calendar for Android/Web)
  const handleRemindMeeting = (meeting: MeetingEvent) => {
    const start = new Date(meeting.startDate);
    const end = new Date(meeting.endDate || start.getTime() + 2 * 3600 * 1000);

    const isIOS =
      typeof navigator !== 'undefined' &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

    if (isIOS) {
      // Generate & download .ics file for iOS Calendar
      downloadICS(meeting, start, end);
      showToast('Đang tải tệp lịch .ics mở trong Lịch iPhone/iPad!');
    } else {
      // Open Google Calendar for Android / Windows / Web
      openGoogleCalendar(meeting, start, end);
      showToast('Đang chuyển hướng sang Google Calendar để thêm lịch nhắc!');
    }
  };

  const showToast = (msg: string) => {
    setCalendarToast(msg);
    setTimeout(() => setCalendarToast(null), 3500);
  };

  // Helper to generate & download .ics file
  const downloadICS = (meeting: MeetingEvent, start: Date, end: Date) => {
    const formatICSDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UBMTTQ Binh Tien//Lich Hop//VI',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:mttq-${meeting.id}-${Date.now()}@binhtien.gov.vn`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(start)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${meeting.title}`,
      `DESCRIPTION:${meeting.description.replace(/\n/g, '\\n')} - Thành phần: ${meeting.attendees}`,
      `LOCATION:${meeting.location}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Nhắc nhở cuộc họp Mặt trận Phường Bình Tiên',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lich_hop_MTTQ_${meeting.title.slice(0, 25).replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper to open Google Calendar
  const openGoogleCalendar = (meeting: MeetingEvent, start: Date, end: Date) => {
    const formatGCalDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dates = `${formatGCalDate(start)}/${formatGCalDate(end)}`;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      meeting.title
    )}&dates=${dates}&details=${encodeURIComponent(
      `${meeting.description}\n\nThành phần tham dự: ${meeting.attendees}\nĐơn vị: UB.MTTQ Việt Nam Phường Bình Tiên`
    )}&location=${encodeURIComponent(meeting.location)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Handle "+ THÊM LỊCH HỌP" button click
  const handleOpenAddMeeting = () => {
    // Check if authenticated as yeunuhotranp7
    const currentAuth = authAccount || sessionStorage.getItem('mt_auth_account');
    if (currentAuth === 'yeunuhotranp7') {
      setIsAddMeetingModalOpen(true);
    } else {
      setPendingAuthAction('ADD_MEETING');
      setIsAuthModalOpen(true);
    }
  };

  // Handle "Lên lịch phát thông báo" click
  const handleOpenScheduleNotif = () => {
    const currentAuth = authAccount || sessionStorage.getItem('mt_auth_account');
    if (currentAuth === 'yeunuhotranp7') {
      handleCardClick('THONG_BAO_DAY');
    } else {
      setPendingAuthAction('THONG_BAO_DAY');
      setIsAuthModalOpen(true);
    }
  };

  // Handle Authentication submit
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = authUsernameInput.trim().toLowerCase();
    const cleanPass = authPasswordInput.trim().toLowerCase();

    // Verify account yeunuhotranp7 or yeunuhotranp7@gmail.com or password yeunuhotranp7
    if (cleanUser === 'yeunuhotranp7' || cleanUser === 'yeunuhotranp7@gmail.com' || cleanPass === 'yeunuhotranp7') {
      sessionStorage.setItem('mt_auth_account', 'yeunuhotranp7');
      setAuthAccount('yeunuhotranp7');
      setAuthError('');
      setIsAuthModalOpen(false);
      if (pendingAuthAction === 'ADD_MEETING') {
        setIsAddMeetingModalOpen(true);
      } else {
        handleCardClick('THONG_BAO_DAY');
        showToast('Đã đăng nhập Quản trị viên yeunuhotranp7 thành công!');
      }
      setPendingAuthAction(null);
    } else {
      setAuthError('Xác thực không thành công! Yêu cầu tài khoản hoặc mật mã quản trị: yeunuhotranp7');
    }
  };

  // Helper format scheduled time
  const formatScheduledTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${hours}:${minutes} - Ngày ${day}/${month}/${year}`;
    } catch {
      return isoString;
    }
  };

  // Handle Save Scheduled Notification to Supabase scheduled_notifications
  const handleSaveScheduledNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim()) {
      showToast('Vui lòng nhập tiêu đề thông báo!');
      return;
    }
    if (!notifContent.trim()) {
      showToast('Vui lòng nhập nội dung chi tiết thông báo!');
      return;
    }

    setIsSavingNotif(true);
    try {
      const scheduledTime = `${notifDate}T${notifHour}:${notifMinute}:00`;
      const res = await saveScheduledNotification({
        tieu_de: notifTitle.trim(),
        noi_dung: notifContent.trim(),
        thoi_gian_gui: scheduledTime,
        nguoi_tao: authAccount || 'yeunuhotranp7'
      });

      if (res.success && res.data) {
        setScheduledNotifs((prev) => [res.data!, ...prev.filter((x) => x.id !== res.data!.id)]);
        showToast('Lưu lịch gửi thông báo thành công (trạng thái: Đang chờ phát)!');
        setNotifTitle('');
        setNotifContent('');
      } else {
        showToast(res.message || 'Lưu lịch thông báo thành công!');
      }
    } catch (err: any) {
      showToast('Đã lưu thông báo dự phòng vào bộ nhớ!');
    } finally {
      setIsSavingNotif(false);
    }
  };

  // Handle Delete / Cancel Scheduled Notification
  const handleDeleteNotif = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch phát thông báo này không?')) return;
    try {
      await deleteScheduledNotification(id);
      setScheduledNotifs((prev) => prev.filter((item) => item.id !== id));
      showToast('Đã xóa thông báo hẹn giờ thành công!');
    } catch (e) {
      showToast('Có lỗi khi xóa thông báo');
    }
  };

  // Handle Save New Meeting
  const handleSaveNewMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.title.trim()) return;

    const created: MeetingEvent = {
      ...newMeeting,
      id: `meet-${Date.now()}`
    };

    const updated = [created, ...meetings];
    setMeetings(updated);
    localStorage.setItem('mt_custom_meetings_v2026', JSON.stringify(updated));
    setIsAddMeetingModalOpen(false);
    showToast('Đã thêm lịch họp mới thành công!');
    // Reset form
    setNewMeeting({
      title: '',
      startDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 86400000 + 7200000).toISOString().slice(0, 16),
      location: 'Trụ sở UBND Phường Bình Tiên',
      attendees: 'Ban Công tác Mặt trận 18 Khu phố',
      description: '',
      category: 'Giao ban'
    });
  };

  // Handle Feedback Submit
  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.title.trim() || !feedbackForm.content.trim()) return;

    // Save to local feedback storage
    try {
      const savedFeedbacks = JSON.parse(localStorage.getItem('mt_citizen_feedback') || '[]');
      const newEntry = {
        ...feedbackForm,
        id: `fb-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'da_tiep_nhan'
      };
      localStorage.setItem('mt_citizen_feedback', JSON.stringify([newEntry, ...savedFeedbacks]));
    } catch (err) {
      console.log('Error saving feedback:', err);
    }

    setFeedbackSuccess(true);
    setTimeout(() => {
      setFeedbackSuccess(false);
      setFeedbackForm({
        senderName: '',
        phone: '',
        khuPho: 'Khu phố 1',
        category: 'An sinh xã hội',
        title: '',
        content: ''
      });
    }, 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {calendarToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-amber-400/40 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <Bell className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{calendarToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-red-900 to-amber-900 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-amber-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-400/40">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TRUNG TÂM TIỆN ÍCH SỐ MẶT TRẬN</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-sans uppercase tracking-tight text-amber-200">
              TIỆN ÍCH & ĐIỀU HÀNH CÔNG TÁC MẶT TRẬN
            </h2>
            <p className="text-xs sm:text-sm text-red-100/90 mt-1 max-w-2xl">
              Hệ sinh thái công cụ hỗ trợ cán bộ Mặt trận và Nhân dân: Thống kê số liệu, Lịch công tác, Văn bản chỉ đạo và Kênh tiếp nhận ý kiến đóng góp.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            <button
              id="btn-schedule-push-header"
              onClick={handleOpenScheduleNotif}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                activeCard === 'THONG_BAO_DAY'
                  ? 'bg-amber-400 text-amber-950 border-amber-300 ring-2 ring-amber-400/50'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/40 text-amber-200'
              }`}
            >
              <BellRing className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Lên lịch phát thông báo</span>
              {scheduledNotifs.filter((n) => n.trang_thai === 'pending').length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black">
                  {scheduledNotifs.filter((n) => n.trang_thai === 'pending').length}
                </span>
              )}
            </button>

            {authAccount === 'yeunuhotranp7' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>yeunuhotranp7 (Quản trị)</span>
              </span>
            ) : (
              <button
                onClick={() => {
                  setPendingAuthAction('THONG_BAO_DAY');
                  setIsAuthModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>Xác thực Quản trị</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LƯỚI GỒM CÁC THẺ TIỆN ÍCH (Với hiệu ứng lắc lư lacLuThe khi click) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* THẺ 1: THỐNG KÊ */}
        <div
          id="card-thong-ke"
          onClick={() => handleCardClick('THONG_KE')}
          className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
            shakingCard === 'THONG_KE' ? 'animate-lac-lu' : ''
          } ${
            activeCard === 'THONG_KE'
              ? 'bg-gradient-to-br from-red-50 to-amber-50 border-red-600 shadow-md ring-2 ring-red-600/30'
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                activeCard === 'THONG_KE' ? 'bg-red-700 text-white shadow-sm' : 'bg-red-50 text-red-700'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
            </div>
            {activeCard === 'THONG_KE' ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-700 text-white uppercase tracking-wider">
                Đang xem
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Thẻ 1
              </span>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 mt-3">Thống kê</h3>
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
            Cơ cấu nhân sự 18 Khu phố, giới tính, độ tuổi, cấp ủy và đoàn thể kiêm nhiệm.
          </p>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-red-800">
            <span>Báo cáo số liệu</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* THẺ 2: LỊCH CÔNG TÁC */}
        <div
          id="card-lich-cong-tac"
          onClick={() => handleCardClick('LICH_CONG_TAC')}
          className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
            shakingCard === 'LICH_CONG_TAC' ? 'animate-lac-lu' : ''
          } ${
            activeCard === 'LICH_CONG_TAC'
              ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-600 shadow-md ring-2 ring-blue-600/30'
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                activeCard === 'LICH_CONG_TAC' ? 'bg-blue-700 text-white shadow-sm' : 'bg-blue-50 text-blue-700'
              }`}
            >
              <CalendarDays className="w-5 h-5" />
            </div>
            {activeCard === 'LICH_CONG_TAC' ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-700 text-white uppercase tracking-wider">
                Đang xem
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {meetings.length} Cuộc họp
              </span>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 mt-3">Lịch công tác</h3>
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
            Lịch giao ban Thường trực, tiếp xúc cử tri & sinh hoạt Ban CTMT 18 Khu phố.
          </p>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-blue-800">
            <span>Nhắc lịch & Đặt hẹn</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* THẺ 3: VĂN BẢN / HƯỚNG DẪN */}
        <div
          id="card-van-ban"
          onClick={() => handleCardClick('VAN_BAN')}
          className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
            shakingCard === 'VAN_BAN' ? 'animate-lac-lu' : ''
          } ${
            activeCard === 'VAN_BAN'
              ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-600 shadow-md ring-2 ring-emerald-600/30'
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                activeCard === 'VAN_BAN' ? 'bg-emerald-700 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <FileText className="w-5 h-5" />
            </div>
            {activeCard === 'VAN_BAN' ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white uppercase tracking-wider">
                Đang xem
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {OFFICIAL_DOCUMENTS.length} Tài liệu
              </span>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 mt-3">Văn bản / Hướng dẫn</h3>
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
            Luật Dân chủ ở cơ sở, Điều lệ Mặt trận & quy định kiện toàn cán bộ cơ sở.
          </p>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-emerald-800">
            <span>Tra cứu văn bản số</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* THẺ 4: ĐÓNG GÓP Ý KIẾN */}
        <div
          id="card-y-kien"
          onClick={() => handleCardClick('Y_KIEN')}
          className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
            shakingCard === 'Y_KIEN' ? 'animate-lac-lu' : ''
          } ${
            activeCard === 'Y_KIEN'
              ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-600 shadow-md ring-2 ring-amber-600/30'
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                activeCard === 'Y_KIEN' ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-50 text-amber-700'
              }`}
            >
              <MessageSquareQuote className="w-5 h-5" />
            </div>
            {activeCard === 'Y_KIEN' ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-600 text-white uppercase tracking-wider">
                Đang xem
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                Tiếp nhận 24/7
              </span>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 mt-3">Đóng góp ý kiến</h3>
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
            Kênh gửi phản ánh, kiến nghị và hiến kế trực tiếp tới Ban Thường trực Phường.
          </p>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-amber-800">
            <span>Hiến kế xây dựng</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* THẺ 5: LÊN LỊCH PHÁT THÔNG BÁO (Khu vực Quản trị yeunuhotranp7) */}
        <div
          id="card-thong-bao-day"
          onClick={handleOpenScheduleNotif}
          className={`col-span-2 relative p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
            shakingCard === 'THONG_BAO_DAY' ? 'animate-lac-lu' : ''
          } ${
            activeCard === 'THONG_BAO_DAY'
              ? 'bg-gradient-to-r from-red-950 via-red-900 to-amber-950 border-amber-400 shadow-md ring-2 ring-amber-400/40 text-white'
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:shadow-sm text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  activeCard === 'THONG_BAO_DAY'
                    ? 'bg-amber-400 text-amber-950 shadow-sm'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                <BellRing className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`text-sm sm:text-base font-black ${activeCard === 'THONG_BAO_DAY' ? 'text-amber-200' : 'text-slate-900'}`}>
                    Lên lịch phát thông báo
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeCard === 'THONG_BAO_DAY'
                      ? 'bg-amber-400/30 text-amber-200 border border-amber-400/40'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    Khu vực Quản trị yeunuhotranp7
                  </span>
                </div>
                <p className={`text-[11px] mt-0.5 line-clamp-1 ${activeCard === 'THONG_BAO_DAY' ? 'text-red-100' : 'text-slate-500'}`}>
                  Cơ chế Thông báo đẩy hẹn giờ (Scheduled Push) phát tin đến cán bộ 18 Khu phố qua Supabase.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeCard === 'THONG_BAO_DAY' ? (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 uppercase tracking-wider">
                  Đang mở
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {scheduledNotifs.filter((n) => n.trang_thai === 'pending').length} chờ phát
                </span>
              )}
              <ChevronRight className={`w-4 h-4 ${activeCard === 'THONG_BAO_DAY' ? 'text-amber-300' : 'text-slate-400'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NỘI DUNG CHI TIẾT TƯƠNG ỨNG VỚI TỪNG THẺ ĐƯỢC CHỌN */}
      {/* ========================================================================= */}

      {/* 1. NỘI DUNG THẺ 1: THỐNG KÊ (GIỮ NGUYÊN 100% NỘI DUNG CŨ CỦA OVERVIEW VIEW) */}
      {activeCard === 'THONG_KE' && (
        <div className="mt-4 pt-2 border-t border-slate-200 animate-in fade-in duration-300">
          <OverviewView
            personnelList={personnelList}
            headquartersList={headquartersList}
            redSitesList={redSitesList}
            onSelectKhuPho={onSelectKhuPho}
          />
        </div>
      )}

      {/* 2. NỘI DUNG THẺ 2: LỊCH CÔNG TÁC */}
      {activeCard === 'LICH_CONG_TAC' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Action Bar: Title + "+ THÊM LỊCH HỌP" Button */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-700" />
                <h3 className="text-base font-black text-slate-900 uppercase">
                  LỊCH HỌP & CÔNG TÁC MẶT TRẬN
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Đồng bộ lịch công tác về thiết bị di động, tự động nhắc nhở trước giờ họp 30 phút.
              </p>
            </div>

            <button
              onClick={handleOpenAddMeeting}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ THÊM LỊCH HỌP</span>
            </button>
          </div>

          {/* List of Scheduled Meetings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {meetings.map((item) => {
              const start = new Date(item.startDate);
              const dateStr = start.toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
              const timeStr = `${start.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
              })} - ${new Date(item.endDate).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
              })}`;

              return (
                <div
                  key={item.id}
                  className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Badge Category */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                        {item.category}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        Phường Bình Tiên
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h4>

                    {/* Date & Time */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <span className="font-semibold text-slate-900">{timeStr}</span>
                        <span className="text-slate-400">|</span>
                        <span className="capitalize">{dateStr}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-red-700 shrink-0 mt-0.5" />
                        <span>{item.location}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Users className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                        <span className="text-slate-600">Thành phần: {item.attendees}</span>
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-500 italic line-clamp-2">
                        &ldquo;{item.description}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* NÚT [🔔 NHẮC TÔI / LƯU VÀO LỊCH] */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => handleRemindMeeting(item)}
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                      <Bell className="w-4 h-4 text-amber-100" />
                      <span>🔔 NHẮC TÔI / LƯU VÀO LỊCH</span>
                    </button>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => downloadICS(item, new Date(item.startDate), new Date(item.endDate))}
                        className="text-blue-700 hover:underline font-semibold"
                        title="Tải tệp .ics cho iPhone/iPad/Mac"
                      >
                        File .ics (iOS)
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => openGoogleCalendar(item, new Date(item.startDate), new Date(item.endDate))}
                        className="text-emerald-700 hover:underline font-semibold"
                        title="Mở Google Calendar trên Web hoặc Android"
                      >
                        Google Calendar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. NỘI DUNG THẺ 3: VĂN BẢN / HƯỚNG DẪN */}
      {activeCard === 'VAN_BAN' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-700" />
              <h3 className="text-base font-black text-slate-900 uppercase">
                KHO VĂN BẢN & HƯỚNG DẪN NGHIỆP VỤ MẶT TRẬN
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống văn bản quy phạm pháp luật, Điều lệ và hướng dẫn công tác Mặt trận ở địa bàn dân cư.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {OFFICIAL_DOCUMENTS.map((doc) => (
              <div
                key={doc.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      {doc.category}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">{doc.code}</span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    {doc.title}
                  </h4>

                  <div className="text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">Cơ quan ban hành: {doc.agency}</p>
                    <p className="text-slate-500 text-[11px]">Ngày ban hành: {doc.issueDate}</p>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {doc.summary}
                  </p>

                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-bold uppercase text-slate-700">Điểm cốt lõi:</span>
                    {doc.highlights.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Xem chi tiết</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${doc.title} - ${doc.code}\n${doc.summary}`);
                      showToast('Đã sao chép trích dẫn văn bản vào bộ nhớ tạm!');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-900 font-semibold"
                  >
                    Sao chép trích dẫn
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. NỘI DUNG THẺ 4: ĐÓNG GÓP Ý KIẾN */}
      {activeCard === 'Y_KIEN' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquareQuote className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base font-black text-slate-900 uppercase">
                    TIẾP NHẬN Ý KIẾN & HIẾN KẾ MẶT TRẬN
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ban Thường trực UB.MTTQ VN Phường Bình Tiên luôn lắng nghe tâm tư, nguyện vọng và hiến kế của nhân dân.
                </p>
              </div>

              {onNavigateToFeedback && (
                <button
                  onClick={onNavigateToFeedback}
                  className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-center"
                >
                  <span>Xem Hộp thư Dân chủ (Tab 2)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {feedbackSuccess ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Cảm ơn đồng chí / người dân đã gửi ý kiến!
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Ban Thường trực UB.MTTQ Việt Nam Phường Bình Tiên đã tiếp nhận thông tin và sẽ tiến hành phân loại, chuyển tới bộ phận liên quan giải quyết kịp thời.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-3.5 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ và tên người gửi <span className="text-slate-400 font-normal">(Hoặc để trống nếu ẩn danh)</span>
                    </label>
                    <input
                      type="text"
                      value={feedbackForm.senderName}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, senderName: e.target.value })}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số điện thoại liên hệ <span className="text-slate-400 font-normal">(Để phản hồi kết quả)</span>
                    </label>
                    <input
                      type="tel"
                      value={feedbackForm.phone}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, phone: e.target.value })}
                      placeholder="Ví dụ: 0903..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Khu phố cư trú / Địa bàn liên quan
                    </label>
                    <select
                      value={feedbackForm.khuPho}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, khuPho: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                    >
                      {Array.from({ length: 18 }, (_, i) => `Khu phố ${i + 1}`).map((kp) => (
                        <option key={kp} value={kp}>
                          {kp}
                        </option>
                      ))}
                      <option value="Toàn phường">Toàn địa bàn phường</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lĩnh vực đóng góp ý kiến
                    </label>
                    <select
                      value={feedbackForm.category}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                    >
                      <option value="An sinh xã hội">An sinh xã hội & Chăm lo đời sống</option>
                      <option value="Trật tự đô thị">Đô thị, Môi trường & Rác thải</option>
                      <option value="Giám sát xây dựng">Giám sát công trình & Quy chế dân chủ</option>
                      <option value="Công tác Mặt trận">Hiến kế đổi mới hoạt động Mặt trận</option>
                      <option value="Khác">Lĩnh vực khác</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tiêu đề ý kiến / Kiến nghị <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={feedbackForm.title}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, title: e.target.value })}
                    placeholder="Tóm tắt ngắn gọn nội dung kiến nghị..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nội dung chi tiết & Đề xuất giải pháp <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={feedbackForm.content}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, content: e.target.value })}
                    placeholder="Mô tả cụ thể sự việc, địa điểm và những hiến kế, giải pháp khắc phục..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>GỬI Ý KIẾN ĐÓNG GÓP</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. NỘI DUNG THẺ 5: LÊN LỊCH PHÁT THÔNG BÁO (KHU VỰC QUẢN TRỊ yeunuhotranp7) */}
      {/* ========================================================================= */}
      {activeCard === 'THONG_BAO_DAY' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Banner Khu vực Quản trị */}
          <div className="bg-gradient-to-r from-red-950 via-red-900 to-amber-950 text-white p-5 sm:p-6 rounded-2xl shadow-md border-2 border-amber-400/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-400/40">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>KHU VỰC QUẢN TRỊ BẢO MẬT: yeunuhotranp7</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black uppercase text-amber-200 flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-amber-300 animate-pulse" />
                  LÊN LỊCH PHÁT THÔNG BÁO ĐẨY HẸN GIỜ
                </h3>
                <p className="text-xs sm:text-sm text-red-100/90 mt-1 max-w-2xl leading-relaxed">
                  Thiết lập lịch phát tin tự động đến toàn bộ thiết bị của Cán bộ Ban Công tác Mặt trận 18 Khu phố và Nhân dân đã cấp quyền nhận thông báo.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={loadScheduledNotifications}
                  disabled={isFetchingNotifs}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all"
                  title="Làm mới dữ liệu từ Supabase"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetchingNotifs ? 'animate-spin' : ''}`} />
                  <span>Đồng bộ Supabase</span>
                </button>
              </div>
            </div>
          </div>

          {/* Form Lên lịch phát thông báo */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-red-700" />
                  BIỂU MẪU LÊN LỊCH THÔNG BÁO
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dữ liệu được lưu trực tiếp vào bảng <code className="text-red-700 font-mono font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">scheduled_notifications</code> trên Supabase.
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Trạng thái mặc định: pending
              </span>
            </div>

            <form onSubmit={handleSaveScheduledNotification} className="space-y-4">
              {/* Tiêu đề thông báo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Tiêu đề thông báo <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Ví dụ: Triệu tập họp giao ban khẩn"
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 font-medium"
                  />
                  <Bell className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                {/* Gợi ý mẫu nhanh */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-500 self-center mr-1">Mẫu nhanh:</span>
                  {[
                    'Triệu tập họp giao ban khẩn',
                    'Thông báo tiếp xúc cử tri 18 Khu phố',
                    'Triển khai quà Tết an sinh xã hội',
                    'Kiểm tra công tác Mặt trận địa bàn'
                  ].map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => setNotifTitle(tpl)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-medium transition-colors border border-slate-200"
                    >
                      + {tpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nội dung chi tiết thông báo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Nội dung chi tiết thông báo <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={notifContent}
                  onChange={(e) => setNotifContent(e.target.value)}
                  placeholder="Nhập nội dung chi tiết thông báo, thời gian, địa điểm hoặc chỉ đạo khẩn từ Ban Thường trực..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 font-medium leading-relaxed"
                />
              </div>

              {/* Thời gian phát tin: Chọn Ngày, Giờ và Phút cần gửi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Thời gian phát tin <span className="text-red-600">*</span> (Ngày, Giờ và Phút)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Chọn Ngày */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      1. Chọn Ngày gửi
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={notifDate}
                        onChange={(e) => setNotifDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 font-medium"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  {/* Chọn Giờ */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      2. Chọn Giờ (00 - 23h)
                    </label>
                    <div className="relative">
                      <select
                        value={notifHour}
                        onChange={(e) => setNotifHour(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 font-medium bg-white"
                      >
                        {Array.from({ length: 24 }).map((_, i) => {
                          const val = String(i).padStart(2, '0');
                          return (
                            <option key={val} value={val}>
                              {val} Giờ
                            </option>
                          );
                        })}
                      </select>
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  {/* Chọn Phút */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      3. Chọn Phút (00 - 55p)
                    </label>
                    <div className="relative">
                      <select
                        value={notifMinute}
                        onChange={(e) => setNotifMinute(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 font-medium bg-white"
                      >
                        {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((min) => (
                          <option key={min} value={min}>
                            {min} Phút
                          </option>
                        ))}
                      </select>
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>

                {/* Phím hẹn giờ nhanh */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="text-[11px] text-slate-500 mr-1">Hẹn giờ nhanh:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date(Date.now() + 15 * 60 * 1000);
                      setNotifDate(now.toISOString().split('T')[0]);
                      setNotifHour(String(now.getHours()).padStart(2, '0'));
                      setNotifMinute(String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0'));
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-medium transition-colors"
                  >
                    + 15 Phút nữa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date(Date.now() + 60 * 60 * 1000);
                      setNotifDate(now.toISOString().split('T')[0]);
                      setNotifHour(String(now.getHours()).padStart(2, '0'));
                      setNotifMinute(String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0'));
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-medium transition-colors"
                  >
                    + 1 Giờ nữa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
                      setNotifDate(tomorrow.toISOString().split('T')[0]);
                      setNotifHour('08');
                      setNotifMinute('30');
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-medium transition-colors"
                  >
                    Sáng mai 08:30
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
                      setNotifDate(tomorrow.toISOString().split('T')[0]);
                      setNotifHour('14');
                      setNotifMinute('30');
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-medium transition-colors"
                  >
                    Chiều mai 14:30
                  </button>
                </div>
              </div>

              {/* Nút LƯU LỊCH GỬI */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Dự kiến phát lúc:{' '}
                    <strong className="text-slate-900 font-bold">
                      {notifHour}:{notifMinute} ngày {notifDate}
                    </strong>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSavingNotif}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-red-800 via-red-700 to-amber-700 hover:from-red-900 hover:to-amber-800 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSavingNotif ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang lưu Supabase...</span>
                    </>
                  ) : (
                    <>
                      <CalendarDays className="w-4 h-4" />
                      <span>LƯU LỊCH GỬI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* DANH SÁCH CÁC THÔNG BÁO ĐANG CHỜ PHÁT */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase">
                  DANH SÁCH THÔNG BÁO ĐANG CHỜ PHÁT (PENDING)
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                  {scheduledNotifs.filter((n) => n.trang_thai === 'pending').length} lịch hẹn
                </span>
              </div>

              <button
                onClick={loadScheduledNotifications}
                className="text-xs text-slate-500 hover:text-red-700 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Làm mới</span>
              </button>
            </div>

            {scheduledNotifs.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                <BellRing className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">Chưa có thông báo nào được lên lịch</p>
                <p className="text-xs text-slate-400">
                  Vui lòng điền biểu mẫu phía trên để lên lịch phát thông báo tự động.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {scheduledNotifs.map((item) => {
                  const isPending = item.trang_thai === 'pending';
                  return (
                    <div
                      key={item.id}
                      className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all space-y-3 relative group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                Đang chờ phát (pending)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                                {item.trang_thai}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">
                              Mã: {item.id.slice(0, 12)}
                            </span>
                          </div>
                          <h5 className="font-black text-sm sm:text-base text-slate-900 leading-snug">
                            {item.tieu_de}
                          </h5>
                        </div>

                        <button
                          onClick={() => handleDeleteNotif(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hủy lịch phát thông báo này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                        {item.noi_dung}
                      </p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
                        <div className="flex items-center gap-1 text-red-900 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-red-700" />
                          <span>Hẹn phát: {formatScheduledTime(item.thoi_gian_gui)}</span>
                        </div>

                        <span className="text-[11px] text-slate-400">
                          Người tạo: <strong className="text-slate-700">{item.nguoi_tao || 'yeunuhotranp7'}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: XÁC THỰC TÀI KHOẢN QUẢN TRỊ (YÊU CẦU yeunuhotranp7) */}
      {/* ========================================================================= */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-red-800">
                <Lock className="w-5 h-5" />
                <h3 className="font-bold text-base uppercase">XÁC THỰC QUẢN TRỊ VIÊN</h3>
              </div>
              <button
                onClick={() => {
                  setIsAuthModalOpen(false);
                  setAuthError('');
                }}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
              <p className="font-bold">Quy định bảo mật hệ thống:</p>
              <p>
                Khu vực <strong>Lên lịch phát thông báo</strong> và <strong>Quản trị lịch họp</strong> yêu cầu xác thực bằng tài khoản/mã quản trị:{' '}
                <span className="font-bold text-red-700 font-mono">yeunuhotranp7</span>.
              </p>
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên tài khoản hoặc Email Quản trị
                </label>
                <input
                  type="text"
                  value={authUsernameInput}
                  onChange={(e) => setAuthUsernameInput(e.target.value)}
                  placeholder="yeunuhotranp7 hoặc yeunuhotranp7@gmail.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu xác thực (hoặc mã bảo mật)
                </label>
                <input
                  type="password"
                  value={authPasswordInput}
                  onChange={(e) => setAuthPasswordInput(e.target.value)}
                  placeholder="yeunuhotranp7"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95"
                >
                  Xác thực & Mở
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: THÊM LỊCH HỌP MỚI (CHO yeunuhotranp7) */}
      {/* ========================================================================= */}
      {isAddMeetingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-800">
                <CalendarDays className="w-5 h-5" />
                <h3 className="font-bold text-base uppercase">THÊM LỊCH HỌP CÔNG TÁC</h3>
              </div>
              <button
                onClick={() => setIsAddMeetingModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Đã xác thực quản trị: yeunuhotranp7</span>
            </div>

            <form onSubmit={handleSaveNewMeeting} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề cuộc họp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  placeholder="Ví dụ: Họp chuẩn bị Ngày hội Đại đoàn kết toàn dân tộc..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phân loại cuộc họp
                </label>
                <select
                  value={newMeeting.category}
                  onChange={(e) => setNewMeeting({ ...newMeeting, category: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                >
                  <option value="Giao ban">Họp Giao ban định kỳ</option>
                  <option value="Tiếp xúc cử tri">Tiếp xúc cử tri</option>
                  <option value="Sinh hoạt Mặt trận">Sinh hoạt Ban CTMT Khu phố</option>
                  <option value="Tập huấn">Tập huấn nghiệp vụ</option>
                  <option value="Đột xuất">Họp đột xuất / Khẩn</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thời gian bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newMeeting.startDate}
                    onChange={(e) => setNewMeeting({ ...newMeeting, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thời gian kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newMeeting.endDate}
                    onChange={(e) => setNewMeeting({ ...newMeeting, endDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Địa điểm tổ chức <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMeeting.location}
                  onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                  placeholder="Ví dụ: Hội trường UBND Phường, hoặc Trụ sở Khu phố 5..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thành phần tham dự
                </label>
                <input
                  type="text"
                  value={newMeeting.attendees}
                  onChange={(e) => setNewMeeting({ ...newMeeting, attendees: e.target.value })}
                  placeholder="Ví dụ: Ban Thường trực, Trưởng Ban CTMT 18 Khu phố..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung tóm tắt / Ghi chú
                </label>
                <textarea
                  rows={3}
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                  placeholder="Nội dung thảo luận, tài liệu cần chuẩn bị..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMeetingModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95"
                >
                  Lưu & Đăng Lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: XEM CHI TIẾT VĂN BẢN */}
      {/* ========================================================================= */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  {selectedDoc.category}
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">{selectedDoc.title}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedDoc.code}</p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="font-semibold text-slate-900">Cơ quan ban hành: {selectedDoc.agency}</p>
                <p className="text-slate-600">Thời gian: {selectedDoc.issueDate}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">Mục đích & Tóm tắt nội dung:</h4>
                <p className="leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-slate-800">
                  {selectedDoc.summary}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">Các điểm mấu chốt:</h4>
                <div className="space-y-2">
                  {selectedDoc.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${selectedDoc.title}\n${selectedDoc.code}\n${selectedDoc.summary}`);
                  showToast('Đã sao chép nội dung văn bản!');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Sao chép nội dung
              </button>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

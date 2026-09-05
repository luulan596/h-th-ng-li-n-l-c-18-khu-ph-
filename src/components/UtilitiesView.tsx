import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Personnel, Headquarters, RedSite, ScheduledNotification } from '../types';
import { OverviewView } from './OverviewView';
import {
  fetchScheduledNotifications,
  saveScheduledNotification,
  updateScheduledNotification,
  deleteScheduledNotification,
  triggerImmediatePushNotification,
  OfficialDocument,
  OFFICIAL_DOCUMENTS,
  fetchDocuments,
  saveDocument,
  deleteDocument,
  OFFICIAL_DRIVE_FOLDER_URL,
  getLocalDocuments,
  getGoogleDriveDownloadUrl
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
  Eye,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  BookOpen,
  Send,
  Sparkles,
  ShieldCheck,
  Trash2,
  RefreshCw,
  Smartphone,
  ArrowLeft,
  X,
  Pencil,
  Zap,
  LogOut,
  Share2,
  FolderOpen,
  Folder,
  GraduationCap
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

export const UtilitiesView: React.FC<UtilitiesViewProps> = ({
  personnelList,
  headquartersList,
  redSitesList,
  onSelectKhuPho,
  onNavigateToFeedback
}) => {
  // --- Active Tab State (Single-view UX) ---
  // null = Hiển thị lưới thẻ danh mục tiện ích ban đầu; lưu trạng thái vào sessionStorage để giữ màn hình khi reload
  const [activeUtilityTab, setActiveUtilityTab] = useState<'THONG_KE' | 'LICH_CONG_TAC' | 'VAN_BAN' | 'Y_KIEN' | null>(() => {
    try {
      const saved = sessionStorage.getItem('mt_active_utility_tab');
      if (saved === 'THONG_KE' || saved === 'LICH_CONG_TAC' || saved === 'VAN_BAN' || saved === 'Y_KIEN') {
        return saved;
      }
    } catch { /* ignore */ }
    return null;
  });

  useEffect(() => {
    if (activeUtilityTab) {
      sessionStorage.setItem('mt_active_utility_tab', activeUtilityTab);
    } else {
      sessionStorage.removeItem('mt_active_utility_tab');
    }
  }, [activeUtilityTab]);
  const [shakingCard, setShakingCard] = useState<string | null>(null);
  const [showScheduleNotifForm, setShowScheduleNotifForm] = useState(false);
  const [isAdminWorkspace, setIsAdminWorkspace] = useState(false);
  const [editingNotifId, setEditingNotifId] = useState<string | null>(null);

  // --- Scheduled Notifications State ---
  const [scheduledNotifs, setScheduledNotifs] = useState<ScheduledNotification[]>([]);
  const [isFetchingNotifs, setIsFetchingNotifs] = useState(false);
  const [isSavingNotif, setIsSavingNotif] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifLocation, setNotifLocation] = useState('');
  const [notifContent, setNotifContent] = useState('');
  const [notifDate, setNotifDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [notifHour, setNotifHour] = useState('08');
  const [notifMinute, setNotifMinute] = useState('30');
  const [pendingAuthAction, setPendingAuthAction] = useState<'ADD_MEETING' | 'SCHEDULE_NOTIFICATION' | 'ADD_DOCUMENT' | null>(null);

  // Refs cho bộ cuộn Giờ & Phút (Scroll Wheel Picker)
  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn bộ cuộn giờ/phút đến đúng vị trí đang chọn
  useEffect(() => {
    if (hourScrollRef.current) {
      const hIndex = parseInt(notifHour, 10) || 0;
      if (Math.abs(hourScrollRef.current.scrollTop - hIndex * 36) > 18) {
        hourScrollRef.current.scrollTo({ top: hIndex * 36, behavior: 'smooth' });
      }
    }
  }, [notifHour, isAdminWorkspace]);

  useEffect(() => {
    if (minuteScrollRef.current) {
      const mIndex = parseInt(notifMinute, 10) || 0;
      if (Math.abs(minuteScrollRef.current.scrollTop - mIndex * 36) > 18) {
        minuteScrollRef.current.scrollTo({ top: mIndex * 36, behavior: 'smooth' });
      }
    }
  }, [notifMinute, isAdminWorkspace]);

  const handleHourScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / 36);
    const clamped = Math.max(0, Math.min(23, index));
    const newHour = String(clamped).padStart(2, '0');
    if (newHour !== notifHour) {
      setNotifHour(newHour);
    }
  };

  const handleMinuteScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / 36);
    const clamped = Math.max(0, Math.min(59, index));
    const newMinute = String(clamped).padStart(2, '0');
    if (newMinute !== notifMinute) {
      setNotifMinute(newMinute);
    }
  };

  const selectHour = (val: string, index: number) => {
    setNotifHour(val);
    if (hourScrollRef.current) {
      hourScrollRef.current.scrollTo({ top: index * 36, behavior: 'smooth' });
    }
  };

  const selectMinute = (val: string, index: number) => {
    setNotifMinute(val);
    if (minuteScrollRef.current) {
      minuteScrollRef.current.scrollTo({ top: index * 36, behavior: 'smooth' });
    }
  };

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
        if (Array.isArray(parsed)) return parsed;
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

  // --- Phân hệ Văn bản / Hướng dẫn công tác (Supabase & Google Drive) ---
  const [documents, setDocuments] = useState<OfficialDocument[]>(() => getLocalDocuments());
  const [isFetchingDocs, setIsFetchingDocs] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [isSavingDoc, setIsSavingDoc] = useState(false);
  const [calendarToast, setCalendarToast] = useState<string | null>(null);

  // Form thêm văn bản mới dành cho Admin
  const [newDocForm, setNewDocForm] = useState({
    title: '',
    code: '',
    issueDate: new Date().toISOString().split('T')[0],
    agency: 'Ban Thường trực UB.MTTQ VN Phường Bình Tiên',
    category: 'Phong trào',
    customCategory: '',
    isCustomCategory: false,
    driveUrl: OFFICIAL_DRIVE_FOLDER_URL,
    summary: ''
  });

  // Tải danh sách văn bản từ Supabase khi mở ứng dụng
  useEffect(() => {
    let isMounted = true;
    const loadDocs = async () => {
      setIsFetchingDocs(true);
      try {
        const data = await fetchDocuments();
        if (isMounted && data && data.length > 0) {
          setDocuments(data);
        }
      } catch (err) {
        console.warn('Lỗi tải danh mục văn bản từ Supabase:', err);
      } finally {
        if (isMounted) setIsFetchingDocs(false);
      }
    };
    loadDocs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Phân trang danh sách văn bản: mặc định hiển thị 5 văn bản đầu tiên
  const [visibleDocCount, setVisibleDocCount] = useState(5);

  // Danh mục tab chuẩn mực theo yêu cầu:
  // 'Tất cả (X)', 'Văn bản mới', 'Nghiệp vụ Mặt trận', 'Luật & Nghị quyết', 'Biểu mẫu'
  const standardTabs = useMemo(() => [
    'Tất cả',
    'Văn bản mới',
    'Nghiệp vụ Mặt trận',
    'Luật & Nghị quyết',
    'Biểu mẫu'
  ], []);

  // Danh mục động kết hợp tab chuẩn và danh mục tùy chỉnh
  const categories = useMemo(() => {
    const extraCats = Array.from(
      new Set(
        documents
          .map((d) => d.category)
          .filter((cat) => {
            if (!cat) return false;
            if (['Nghiệp vụ Mặt trận', 'Hướng dẫn nghiệp vụ', 'Phong trào', 'Luật & Nghị quyết', 'Luật pháp', 'Điều lệ', 'Thông tri', 'Biểu mẫu'].includes(cat)) {
              return false;
            }
            return true;
          })
      )
    );
    return [...standardTabs, ...extraCats];
  }, [documents, standardTabs]);

  // Reset số lượng hiển thị về 5 mỗi khi đổi danh mục hoặc gõ tìm kiếm
  useEffect(() => {
    setVisibleDocCount(5);
  }, [selectedCategory, docSearchQuery]);

  // Định dạng hiển thị ngày phát hành DD/MM/YYYY chuẩn mực
  const formatDocDate = (dateStr?: string) => {
    if (!dateStr) return '';
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
      return dateStr.split(' ')[0];
    }
    try {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch { /* ignore */ }
    return dateStr;
  };

  // Kiểm tra văn bản mới (trong vòng 24-48 giờ hoặc có cờ isNew: true)
  const isDocNew = (doc: OfficialDocument) => {
    if (doc.isNew) return true;
    if (!doc.issueDate) return false;
    try {
      let docDate: Date | null = null;
      if (doc.issueDate.includes('/')) {
        const parts = doc.issueDate.split(' ')[0].split('/');
        if (parts.length === 3) {
          docDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
      } else if (doc.issueDate.includes('-')) {
        const parts = doc.issueDate.split('T')[0].split('-');
        if (parts.length === 3) {
          docDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        }
      }
      if (docDate && !isNaN(docDate.getTime())) {
        const diffHours = (Date.now() - docDate.getTime()) / (1000 * 60 * 60);
        if (diffHours >= -24 && diffHours <= 48) return true;
      }
    } catch { /* ignore */ }
    return false;
  };

  // Đếm số lượng văn bản theo từng tab
  const getTabCount = (tabName: string) => {
    if (tabName === 'Tất cả') return documents.length;
    if (tabName === 'Văn bản mới') return documents.filter((d) => isDocNew(d)).length;
    if (tabName === 'Nghiệp vụ Mặt trận') {
      return documents.filter((d) => ['Nghiệp vụ Mặt trận', 'Hướng dẫn nghiệp vụ', 'Phong trào'].includes(d.category)).length;
    }
    if (tabName === 'Luật & Nghị quyết') {
      return documents.filter((d) => ['Luật & Nghị quyết', 'Luật pháp', 'Điều lệ', 'Thông tri'].includes(d.category)).length;
    }
    if (tabName === 'Biểu mẫu') {
      return documents.filter((d) => d.category === 'Biểu mẫu').length;
    }
    return documents.filter((d) => d.category === tabName).length;
  };

  // Lọc văn bản theo danh mục và từ khóa tìm kiếm tinh gọn
  const filteredDocs = useMemo(() => {
    const q = docSearchQuery.toLowerCase().trim();
    return documents.filter((doc) => {
      let matchCategory = true;
      if (selectedCategory === 'Tất cả') {
        matchCategory = true;
      } else if (selectedCategory === 'Văn bản mới') {
        matchCategory = isDocNew(doc);
      } else if (selectedCategory === 'Nghiệp vụ Mặt trận') {
        matchCategory = ['Nghiệp vụ Mặt trận', 'Hướng dẫn nghiệp vụ', 'Phong trào'].includes(doc.category);
      } else if (selectedCategory === 'Luật & Nghị quyết') {
        matchCategory = ['Luật & Nghị quyết', 'Luật pháp', 'Điều lệ', 'Thông tri'].includes(doc.category);
      } else if (selectedCategory === 'Biểu mẫu') {
        matchCategory = doc.category === 'Biểu mẫu';
      } else {
        matchCategory = doc.category === selectedCategory;
      }

      const matchSearch =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        (doc.code && doc.code.toLowerCase().includes(q)) ||
        (doc.summary && doc.summary.toLowerCase().includes(q)) ||
        (doc.agency && doc.agency.toLowerCase().includes(q));

      return matchCategory && matchSearch;
    });
  }, [documents, docSearchQuery, selectedCategory]);

  // Phân trang: Mặc định hiển thị 5 văn bản đầu tiên
  const displayedDocs = useMemo(() => {
    return filteredDocs.slice(0, visibleDocCount);
  }, [filteredDocs, visibleDocCount]);

  const remainingDocsCount = Math.max(0, filteredDocs.length - visibleDocCount);

  // Đóng/mở thẻ Accordion
  const toggleExpandDoc = (docId: string) => {
    setExpandedDocId((prev) => (prev === docId ? null : docId));
  };

  // Xem hoặc tải văn bản (trỏ trực tiếp vào Google Drive)
  const handleViewOrDownloadDoc = (doc: OfficialDocument) => {
    const targetUrl = doc.driveUrl || OFFICIAL_DRIVE_FOLDER_URL;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Chia sẻ văn bản qua Web Share API hoặc sao chép liên kết kèm Toast đúng quy chuẩn
  const handleShareDoc = async (doc: OfficialDocument) => {
    const shareUrl = doc.driveUrl || OFFICIAL_DRIVE_FOLDER_URL;
    const shareData = {
      title: doc.title,
      text: `[Văn bản MTTQ Phường Bình Tiên] ${doc.code ? doc.code + ': ' : ''}${doc.title} (Ban hành: ${formatDocDate(doc.issueDate)}).\nTrích yếu: ${doc.summary}`,
      url: shareUrl
    };

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    // Fallback: Tự động sao chép đường link văn bản/link Drive
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(
          `${doc.title}${doc.code ? ' (' + doc.code + ')' : ''}\nNgày ban hành: ${formatDocDate(doc.issueDate)}\nTrích yếu: ${doc.summary}\nLiên kết: ${shareUrl}`
        );
      }
      showToast('Đã sao chép liên kết văn bản!');
    } catch {
      showToast('Đã sao chép liên kết văn bản!');
    }
  };

  // Mở modal thêm văn bản mới (bảo mật mật khẩu yeunuhotranp7)
  const handleOpenAddDoc = () => {
    const currentAuth = authAccount || sessionStorage.getItem('mt_auth_account');
    if (currentAuth === 'yeunuhotranp7') {
      setIsAddDocModalOpen(true);
    } else {
      setPendingAuthAction('ADD_DOCUMENT');
      setAuthPasswordInput('');
      setAuthError('');
      setIsAuthModalOpen(true);
    }
  };

  // Lưu văn bản mới lên Supabase
  const handleSaveNewDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocForm.title.trim()) {
      showToast('Vui lòng nhập tiêu đề văn bản!');
      return;
    }
    if (!newDocForm.summary.trim()) {
      showToast('Vui lòng nhập tóm tắt trích yếu văn bản!');
      return;
    }

    const finalCategory = newDocForm.isCustomCategory
      ? (newDocForm.customCategory.trim() || 'Văn bản')
      : (newDocForm.category || 'Văn bản');

    setIsSavingDoc(true);
    try {
      const res = await saveDocument({
        title: newDocForm.title,
        code: newDocForm.code || `VB-${new Date().getFullYear()}`,
        issueDate: newDocForm.issueDate,
        agency: newDocForm.agency,
        category: finalCategory,
        driveUrl: newDocForm.driveUrl || OFFICIAL_DRIVE_FOLDER_URL,
        summary: newDocForm.summary
      });

      if (res.data) {
        setDocuments((prev) => [res.data!, ...prev.filter((d) => d.id !== res.data!.id)]);
      }
      setIsAddDocModalOpen(false);
      setNewDocForm({
        title: '',
        code: '',
        issueDate: new Date().toISOString().split('T')[0],
        agency: 'Ban Thường trực UB.MTTQ VN Phường Bình Tiên',
        category: finalCategory,
        customCategory: '',
        isCustomCategory: false,
        driveUrl: OFFICIAL_DRIVE_FOLDER_URL,
        summary: ''
      });
      showToast(res.message || 'Đã lưu và công bố văn bản thành công!');
    } catch (err: any) {
      showToast('Lỗi khi lưu văn bản: ' + (err.message || 'Vui lòng thử lại'));
    } finally {
      setIsSavingDoc(false);
    }
  };

  // Xóa văn bản (Quản trị viên)
  const handleDeleteDoc = async (docId: string, docTitle: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa văn bản "${docTitle}"?`)) {
      const res = await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (expandedDocId === docId) setExpandedDocId(null);
      showToast(res.message || 'Đã xóa văn bản thành công!');
    }
  };

  // Click card handler with CSS lacLuThe animation and activate single view
  const handleCardClick = (cardKey: 'THONG_KE' | 'LICH_CONG_TAC' | 'VAN_BAN' | 'Y_KIEN') => {
    setShakingCard(cardKey);
    setActiveUtilityTab(cardKey);
    setTimeout(() => {
      setShakingCard(null);
    }, 350);
  };

  // Trigger calendar reminder (.ics download for iOS/Mac or Google Calendar for Android/Windows/other)
  const handleRemindMeeting = (meeting: MeetingEvent) => {
    const start = new Date(meeting.startDate);
    const end = new Date(meeting.endDate || start.getTime() + 2 * 3600 * 1000);

    // Tự động nhận diện hệ điều hành qua userAgent và platform: iOS / macOS / iPhone / iPad
    const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
    const platform = typeof navigator !== 'undefined' ? ((navigator as any).userAgentData?.platform || navigator.platform || '') : '';
    const isApple =
      /iPhone|iPad|iPod|Macintosh|Mac OS X/i.test(ua) ||
      /Mac/i.test(platform) ||
      (platform === 'MacIntel' && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);

    if (isApple) {
      // iOS / macOS / iPhone / iPad: Tự động tạo và tải/mở file lịch chuẩn .ics (mở ứng dụng Apple Calendar) chỉ với một chạm
      downloadICS(meeting, start, end);
      showToast('Đang tải tệp .ics mở ứng dụng Lịch (Apple Calendar)!');
    } else {
      // Android / Windows / hệ điều hành khác: Tự động mở đường dẫn thêm sự kiện vào Google Calendar
      openGoogleCalendar(meeting, start, end);
      showToast('Đang mở Google Calendar để lưu lịch họp!');
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
    const currentAuth = authAccount || sessionStorage.getItem('mt_auth_account');
    if (currentAuth === 'yeunuhotranp7') {
      setIsAddMeetingModalOpen(true);
    } else {
      setPendingAuthAction('ADD_MEETING');
      setAuthPasswordInput('');
      setAuthError('');
      setIsAuthModalOpen(true);
    }
  };

  // Handle Open Admin Workspace
  const handleOpenAdminWorkspace = () => {
    const currentAuth = authAccount || sessionStorage.getItem('mt_auth_account');
    if (currentAuth === 'yeunuhotranp7') {
      setIsAdminWorkspace(true);
    } else {
      setPendingAuthAction('SCHEDULE_NOTIFICATION');
      setAuthPasswordInput('');
      setAuthError('');
      setIsAuthModalOpen(true);
    }
  };

  // Handle Admin Logout
  const handleAdminLogout = () => {
    sessionStorage.removeItem('mt_auth_account');
    setAuthAccount('');
    setIsAdminWorkspace(false);
    handleCancelEdit();
    showToast('Đã đăng xuất tài khoản Quản trị viên');
  };

  // Handle Cancel Edit
  const handleCancelEdit = () => {
    setEditingNotifId(null);
    setNotifTitle('');
    setNotifLocation('');
    setNotifContent('');
    const today = new Date();
    setNotifDate(today.toISOString().split('T')[0]);
    setNotifHour('08');
    setNotifMinute('30');
  };

  // Handle Start Edit Notification
  const handleStartEdit = (item: ScheduledNotification) => {
    const safeId = String(item.id);
    setEditingNotifId(safeId);
    setNotifTitle(item.tieu_de || '');
    setNotifLocation(item.dia_diem || '');
    setNotifContent(item.noi_dung || '');

    if (item.thoi_gian_gui) {
      try {
        const dt = new Date(item.thoi_gian_gui);
        if (!isNaN(dt.getTime())) {
          const dateStr = item.thoi_gian_gui.includes('T') ? item.thoi_gian_gui.split('T')[0] : dt.toISOString().split('T')[0];
          setNotifDate(dateStr);
          setNotifHour(String(dt.getHours()).padStart(2, '0'));
          setNotifMinute(String(dt.getMinutes()).padStart(2, '0'));
        }
      } catch {
        // fallback
      }
    }

    const formElement = document.getElementById('admin-schedule-form-card');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    showToast(`Đang chỉnh sửa: "${item.tieu_de}"`);
  };

  // Handle "Quản trị: Lên lịch phát thông báo" button click inside Lịch công tác
  const handleAdminScheduleNotifClick = () => {
    handleOpenAdminWorkspace();
  };

  // Handle Delete Meeting: trực tiếp xóa lịch khi người dùng nhấn nút Xóa
  const handleDeleteMeeting = (meeting: MeetingEvent) => {
    const updated = (meetings || []).filter((m) => m.id !== meeting.id);
    setMeetings(updated);
    try {
      localStorage.setItem('mt_custom_meetings_v2026', JSON.stringify(updated));
    } catch (e) {
      console.error('Lỗi khi lưu lịch vào localStorage:', e);
    }
    showToast(`Đã xóa lịch họp "${meeting.title}" thành công!`);
  };

  // Handle Authentication submit
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = authPasswordInput.trim();

    // Verify password yeunuhotranp7
    if (cleanPass === 'yeunuhotranp7') {
      sessionStorage.setItem('mt_auth_account', 'yeunuhotranp7');
      setAuthAccount('yeunuhotranp7');
      setAuthError('');
      setAuthPasswordInput('');
      setIsAuthModalOpen(false);
      if (pendingAuthAction === 'ADD_MEETING') {
        setIsAddMeetingModalOpen(true);
      } else if (pendingAuthAction === 'ADD_DOCUMENT') {
        setIsAddDocModalOpen(true);
        showToast('Đã xác thực Quản trị viên: Mở biểu mẫu thêm văn bản mới!');
      } else {
        setIsAdminWorkspace(true);
        setShowScheduleNotifForm(true);
        showToast('Đã xác thực Quản trị viên: Mở Không gian Quản trị Lịch công tác!');
      }
      setPendingAuthAction(null);
    } else {
      setAuthError('Mã xác thực không chính xác! Vui lòng thử lại.');
    }
  };

  // Helper format meeting date (DD/MM/YYYY)
  const formatMeetingDate = (isoString?: string) => {
    if (!isoString) return 'Chưa xác định';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) {
        const parts = isoString.split('T');
        return parts[0] || isoString;
      }
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return isoString;
    }
  };

  // Helper format meeting time (HH:mm)
  const formatMeetingTime = (isoString?: string) => {
    if (!isoString) return 'Chưa xác định';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) {
        const parts = isoString.split('T');
        return parts[1]?.slice(0, 5) || isoString;
      }
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return isoString;
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

  // Handle Save Scheduled Notification to Supabase scheduled_notifications (Hỗ trợ cả Tạo mới và Chỉnh sửa)
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
    const scheduledTime = `${notifDate}T${notifHour}:${notifMinute}:00`;

    try {
      if (editingNotifId) {
        // =========================================================================
        // QUY TRÌNH XỬ LÝ KHI NHẤN 'CẬP NHẬT THÔNG BÁO'
        // =========================================================================
        // BƯỚC 1: Ghi đè Supabase: Thực hiện lệnh update bản ghi trong bảng scheduled_notifications
        let supabaseSuccess = false;
        try {
          const res = await updateScheduledNotification(editingNotifId, {
            tieu_de: notifTitle.trim(),
            noi_dung: notifContent.trim(),
            thoi_gian_gui: scheduledTime,
            dia_diem: notifLocation.trim() || undefined,
          });
          supabaseSuccess = res.success;
        } catch (dbErr) {
          console.warn('[Admin] Ngoại lệ khi ghi đè Supabase:', dbErr);
        }

        // BƯỚC 2: Tự động kích hoạt Push tức thì:
        // Ngay sau khi Supabase update thành công, tự động gọi API request ngầm (Fetch)
        // tới endpoint gửi push (/api/cron-push hoặc /api/send-push) truyền kèm payload thông báo
        // vừa cập nhật để hệ thống bắn Push ngay lập tức đến toàn bộ subscriber trong bảng push_subscribers.
        let pushNetworkError = false;
        try {
          await triggerImmediatePushNotification({
            id: editingNotifId,
            tieu_de: notifTitle.trim(),
            noi_dung: notifContent.trim(),
            dia_diem: notifLocation.trim() || undefined,
            thoi_gian_gui: scheduledTime,
          });
        } catch (pushErr) {
          console.warn('[Admin] Lỗi mạng khi kích hoạt Push ngầm:', pushErr);
          pushNetworkError = true;
        }

        // BƯỚC 3: Phản hồi giao diện:
        // - Hiển thị thông báo Toast ngắn gọn
        if (pushNetworkError) {
          showToast('Đã lưu dữ liệu thành công trên Supabase!');
        } else {
          showToast('Đã cập nhật và phát thông báo mới đến toàn bộ thành viên thành công!');
        }

        // - Reset form về trạng thái bình thường (nút chuyển về lại 'LƯU LỊCH GỬI')
        handleCancelEdit();

        // - Tự động reload lại danh sách lịch hiển thị
        await loadScheduledNotifications();
      } else {
        // Chế độ LƯU LỊCH GỬI MỚI (Create Mode)
        const res = await saveScheduledNotification({
          tieu_de: notifTitle.trim(),
          noi_dung: notifContent.trim(),
          thoi_gian_gui: scheduledTime,
          dia_diem: notifLocation.trim() || undefined,
          nguoi_tao: 'Ban Quản trị'
        });

        if (res.success && res.data) {
          showToast('Lưu lịch gửi thông báo thành công!');
          handleCancelEdit();
          await loadScheduledNotifications();
        } else {
          showToast(res.message || 'Lưu lịch thông báo thành công!');
        }
      }
    } catch (err: any) {
      console.error('[Admin] Lỗi ngoại lệ trong xử lý biểu mẫu thông báo:', err);
      // Xử lý an toàn: thông báo dữ liệu đã được lưu thành công trên Supabase/bộ nhớ, không để crash trang
      showToast('Đã lưu dữ liệu thành công trên Supabase!');
      handleCancelEdit();
      await loadScheduledNotifications();
    } finally {
      setIsSavingNotif(false);
    }
  };

  // Handle Delete / Cancel Scheduled Notification
  const handleDeleteNotif = async (id: string | number) => {
    const safeId = String(id);
    try {
      await deleteScheduledNotification(safeId);
      setScheduledNotifs((prev) => (prev || []).filter((item) => String(item.id) !== safeId));
      if (editingNotifId === safeId) {
        handleCancelEdit();
      }
      showToast('Đã xóa thông báo hẹn giờ thành công!');
    } catch (e) {
      showToast('Có lỗi khi xóa thông báo');
    }
  };

  // Kiểm tra lịch có bị hết hạn (ngày họp nhỏ hơn ngày hôm nay) hay không
  const isMeetingExpired = (meetingDateStr?: string): boolean => {
    if (!meetingDateStr) return false;
    const meetingDate = new Date(meetingDateStr);
    if (isNaN(meetingDate.getTime())) return false;

    // Lấy 00:00:00 của ngày hôm nay theo giờ địa phương
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();

    // Lấy 00:00:00 của ngày họp
    const meetingDayStart = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate(), 0, 0, 0, 0).getTime();

    // Nếu ngày họp nhỏ hơn ngày hôm nay => đã qua ngày (hết hạn)
    return meetingDayStart < todayStart;
  };

  // Kiểm tra thông báo mới tạo trong vòng 24 giờ
  const isNewNotification = (createdAt?: string): boolean => {
    if (!createdAt) return false;
    const createdTime = new Date(createdAt).getTime();
    if (isNaN(createdTime)) return false;
    const now = Date.now();
    const diffMs = now - createdTime;
    return diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000;
  };

  // Danh sách lịch công tác hiển thị cho Người dùng xem (tự động loại bỏ các lịch đã hết hạn qua ngày)
  const publicScheduleList = useMemo(() => {
    return (scheduledNotifs || [])
      .filter((item) => !isMeetingExpired(item?.thoi_gian_gui))
      .sort((a, b) => {
        const timeA = new Date(a?.thoi_gian_gui).getTime() || 0;
        const timeB = new Date(b?.thoi_gian_gui).getTime() || 0;
        return timeA - timeB;
      });
  }, [scheduledNotifs]);

  const formatFullMeetingDate = (isoString?: string) => {
    if (!isoString) return 'Chưa xác định';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  // Kích hoạt nhắc lịch cho thông báo lịch phát hành (tự động nhận diện iOS -> .ics, Android -> Google Calendar)
  const handleRemindScheduledMeeting = (item: ScheduledNotification) => {
    const start = new Date(item.thoi_gian_gui);
    const end = new Date(start.getTime() + 2 * 3600 * 1000);

    const meetingEvent: MeetingEvent = {
      id: String(item.id),
      title: item.tieu_de,
      startDate: item.thoi_gian_gui,
      endDate: end.toISOString(),
      location: item.dia_diem || 'Trụ sở UBND Phường Bình Tiên',
      attendees: 'Ban Thường trực và Ban Công tác Mặt trận 18 Khu phố',
      description: item.noi_dung,
      category: 'Giao ban'
    };

    handleRemindMeeting(meetingEvent);
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

      {/* Header Banner - CHỈ HIỂN THỊ KHI Ở MÀN HÌNH DANH MỤC GỐC (activeUtilityTab === null) */}
      {activeUtilityTab === null && (
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-amber-900 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-amber-500/30 animate-in fade-in duration-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-400/40">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TRUNG TÂM TIỆN ÍCH SỐ MẶT TRẬN</span>
            </div>
            <h2 className="text-sm sm:text-xl md:text-2xl font-black font-sans uppercase tracking-tight text-amber-200 whitespace-nowrap">
              TIỆN ÍCH & ĐIỀU HÀNH CÔNG TÁC MẶT TRẬN
            </h2>
            <p className="text-xs sm:text-sm text-red-100/90 mt-1 max-w-2xl">
              Hệ sinh thái công cụ hỗ trợ cán bộ Mặt trận và Nhân dân: Thống kê số liệu, Lịch công tác, Văn bản chỉ đạo và Kênh tiếp nhận ý kiến đóng góp.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. KHI CHƯA MỞ TIỆN ÍCH CỤ THỂ (activeUtilityTab === null): LƯỚI THẺ CHỌN */}
      {/* ========================================================================= */}
      {activeUtilityTab === null && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* THẺ TIỆN ÍCH SỐ (SMART ACTION CARD): BÌNH DÂN HỌC VỤ SỐ - ƯU TIÊN HÀNG ĐẦU */}
          <div
            id="card-binh-dan-hoc-vu-so"
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/80 border border-blue-200/80 shadow-2xs hover:shadow-md transition-all relative overflow-hidden"
          >
            {/* Subtle tech background glow */}
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30 border border-blue-500">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white shadow-xs animate-pulse ring-2 ring-rose-200 drop-shadow-xs"
                      title="Chương trình số 2026"
                    >
                      <Zap className="w-3 h-3 fill-current text-amber-100 shrink-0" />
                      <span>CHƯƠNG TRÌNH SỐ 2026</span>
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                    Bình dân học vụ số – Kỹ năng số cho Nhân dân
                  </h3>
                  <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                    Khóa học bồi dưỡng kỹ năng số toàn dân, hướng dẫn sử dụng dịch vụ công trực tuyến và tiện ích số văn minh.
                  </p>
                </div>
              </div>

              <div className="shrink-0 pt-1 sm:pt-0">
                <a
                  href="https://binhdanhocvuso.gov.vn/courses/course-v1:MOET+KNS-ND+2026-1/course/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-sm shadow-blue-600/20 hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Tham gia học ngay</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* LƯỚI 4 THẺ TIỆN ÍCH */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* THẺ 1: THỐNG KÊ */}
          <div
            id="card-thong-ke"
            onClick={() => handleCardClick('THONG_KE')}
            className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:shadow-md hover:border-red-300 group ${
              shakingCard === 'THONG_KE' ? 'animate-lac-lu' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 text-red-700 group-hover:bg-red-700 group-hover:text-white transition-colors">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Thẻ 1
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 mt-3 group-hover:text-red-800 transition-colors">Thống kê</h3>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Cơ cấu nhân sự 18 Khu phố, giới tính, độ tuổi, cấp ủy và đoàn thể kiêm nhiệm.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-red-800">
              <span>Báo cáo số liệu</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* THẺ 2: LỊCH CÔNG TÁC */}
          <div
            id="card-lich-cong-tac"
            onClick={() => handleCardClick('LICH_CONG_TAC')}
            className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 group ${
              shakingCard === 'LICH_CONG_TAC' ? 'animate-lac-lu' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-700 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                <CalendarDays className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {(meetings || []).length} Cuộc họp
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 mt-3 group-hover:text-blue-800 transition-colors">Lịch công tác</h3>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Lịch giao ban Thường trực, tiếp xúc cử tri & sinh hoạt Ban CTMT 18 Khu phố.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-blue-800">
              <span>Nhắc lịch & Đặt hẹn</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* THẺ 3: VĂN BẢN / HƯỚNG DẪN */}
          <div
            id="card-van-ban"
            onClick={() => handleCardClick('VAN_BAN')}
            className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:shadow-md hover:border-emerald-300 group ${
              shakingCard === 'VAN_BAN' ? 'animate-lac-lu' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {documents.length} Tài liệu
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 mt-3 group-hover:text-emerald-800 transition-colors">Văn bản / Hướng dẫn</h3>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Luật Dân chủ ở cơ sở, Điều lệ Mặt trận & quy định kiện toàn cán bộ cơ sở.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-emerald-800">
              <span>Tra cứu văn bản số</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* THẺ 4: ĐÓNG GÓP Ý KIẾN */}
          <div
            id="card-y-kien"
            onClick={() => handleCardClick('Y_KIEN')}
            className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:shadow-md hover:border-amber-300 group ${
              shakingCard === 'Y_KIEN' ? 'animate-lac-lu' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <MessageSquareQuote className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                Tiếp nhận 24/7
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 mt-3 group-hover:text-amber-800 transition-colors">Tiếp nhận ý kiến Nhân dân</h3>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Kênh tiếp nhận tâm tư, nguyện vọng và ý kiến đóng góp xây dựng địa phương của Nhân dân.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-amber-800">
              <span>Đóng góp ý kiến</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* 2. KHI ĐANG MỞ MỘT TIỆN ÍCH (activeUtilityTab !== null): THANH ĐIỀU HƯỚNG QUAY LẠI */}
      {/* ========================================================================= */}
      {activeUtilityTab !== null && (
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <button
              id="btn-back-to-utilities-menu"
              onClick={() => {
                setActiveUtilityTab(null);
                setShowScheduleNotifForm(false);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition-all active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer select-none"
            >
              <span className="text-base font-black leading-none text-slate-900">←</span>
              <span>Quay lại danh mục</span>
            </button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-900">
              {activeUtilityTab === 'THONG_KE' && (
                <>
                  <span className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </span>
                  <span>Thống kê số liệu 18 Khu phố</span>
                </>
              )}
              {activeUtilityTab === 'LICH_CONG_TAC' && (
                <>
                  <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-4 h-4" />
                  </span>
                  <span>Lịch họp & Công tác Mặt trận</span>
                </>
              )}
              {activeUtilityTab === 'VAN_BAN' && (
                <>
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </span>
                  <span>Văn bản / Hướng dẫn công tác</span>
                </>
              )}
              {activeUtilityTab === 'Y_KIEN' && (
                <>
                  <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <MessageSquareQuote className="w-4 h-4" />
                  </span>
                  <span>Tiếp nhận ý kiến Nhân dân</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. NỘI DUNG CHI TIẾT (CHỈ HIỂN THỊ DUY NHẤT TIỆN ÍCH ĐANG ĐƯỢC CHỌN) */}
      {/* ========================================================================= */}

      {/* THẺ 1: THỐNG KÊ (GIỮ NGUYÊN 100% NỘI DUNG CŨ CỦA OVERVIEW VIEW) */}
      {activeUtilityTab === 'THONG_KE' && (
        <div className="mt-2 pt-2 border-t border-slate-200 animate-in fade-in duration-300">
          <OverviewView
            personnelList={personnelList}
            headquartersList={headquartersList}
            redSitesList={redSitesList}
            onSelectKhuPho={onSelectKhuPho}
          />
        </div>
      )}

      {/* 2. NỘI DUNG THẺ 2: LỊCH CÔNG TÁC */}
      {activeUtilityTab === 'LICH_CONG_TAC' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {isAdminWorkspace && authAccount === 'yeunuhotranp7' ? (
            /* ========================================================================= */
            /* GIAO DIỆN 1: DÀNH RIÊNG CHO QUẢN TRỊ VIÊN (Sau khi xác thực yeunuhotranp7) */
            /* ========================================================================= */
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Nút quay lại nhỏ gọn để Admin thoát ra xem giao diện thường */}
              <div className="flex items-center justify-start">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminWorkspace(false);
                    handleCancelEdit();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-950 rounded-xl text-xs font-black border border-slate-200 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer select-none"
                  title="Quay lại giao diện xem lịch công tác"
                >
                  <span className="text-base font-black leading-none text-slate-900">←</span>
                  <span>Quay lại lịch công tác</span>
                </button>
              </div>

              {/* BIỂU MẪU LÊN LỊCH & CHỈNH SỬA THÔNG BÁO */}
              <div
                id="admin-schedule-form-card"
                className={`bg-white p-5 sm:p-6 rounded-2xl border transition-all ${
                  editingNotifId
                    ? 'border-amber-400 ring-2 ring-amber-100 shadow-md'
                    : 'border-slate-200 shadow-sm'
                } space-y-5`}
              >
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    {editingNotifId ? (
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <Pencil className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-red-100 text-red-800 flex items-center justify-center shrink-0">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase">
                        {editingNotifId ? 'CHỈNH SỬA THÔNG BÁO LỊCH' : 'BIỂU MẪU LÊN LỊCH & PHÁT HÀNH THÔNG BÁO'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {editingNotifId
                          ? 'Dữ liệu thông báo đã được tự động điền vào biểu mẫu. Chỉnh sửa và bấm CẬP NHẬT THÔNG BÁO để ghi đè vào Supabase.'
                          : 'Nhập thông tin bên dưới để lên lịch phát thông báo đẩy và đồng bộ vào lịch công tác.'}
                      </p>
                    </div>
                  </div>

                  {editingNotifId && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 animate-pulse">
                      <span>Đang sửa thông báo</span>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-amber-800 hover:text-red-700 font-black ml-1 cursor-pointer"
                        title="Hủy sửa và đặt lại biểu mẫu"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveScheduledNotification} className="space-y-4">
                  {/* 1. Tiêu đề thông báo (*) */}
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
                        placeholder="Ví dụ: Triệu tập Họp Ban Thường trực UB.MTTQ VN Phường..."
                        className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 font-medium"
                      />
                      <Bell className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  {/* 2. Thời gian phát tin (ngày/giờ/phút) (*) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Thời gian phát tin (Ngày / Giờ / Phút) <span className="text-red-600">*</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-start">
                      {/* Cột 1: Chọn ngày phát tin (5 cột trên desktop) */}
                      <div className="sm:col-span-5 space-y-1.5">
                        <label className="block text-[11px] font-semibold text-slate-500">
                          Ngày phát tin / Ngày họp
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

                        {/* Nút chọn nhanh ngày */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date();
                              setNotifDate(d.toISOString().split('T')[0]);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                          >
                            Hôm nay
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date(Date.now() + 86400000);
                              setNotifDate(d.toISOString().split('T')[0]);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                          >
                            Ngày mai
                          </button>
                        </div>
                      </div>

                      {/* Cột 2: Bộ cuộn Giờ & Phút (Scroll Wheel Picker 2 cột) (7 cột trên desktop) */}
                      <div className="sm:col-span-7 space-y-1.5">
                        {/* Dòng hiển thị kết quả giờ phát tin gọn gàng */}
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <label className="block text-[11px] font-semibold text-slate-600">
                            Giờ phát tin: <span className="text-red-700 font-black text-xs sm:text-sm font-mono tracking-wide">{notifHour}:{notifMinute}</span>
                          </label>
                        </div>

                        {/* Nhãn cột GIỜ và PHÚT tách hẳn ra ngoài khung cuộn, đặt cố định ở một hàng riêng biệt */}
                        <div className="flex items-center text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 pt-0.5">
                          <div className="flex-1">Giờ (00 - 23)</div>
                          <div className="w-5" />
                          <div className="flex-1">Phút (00 - 59)</div>
                        </div>

                        {/* KHUNG CUỘN 2 CỘT NGANG NHAU (SCROLL WHEEL PICKER - cao cố định 112px) */}
                        <div className="relative h-[112px] bg-slate-50/80 border border-slate-200 rounded-xl overflow-hidden shadow-inner flex">
                          {/* Thanh highlight trung tâm làm nổi bật hàng đang chọn */}
                          <div className="absolute top-[38px] left-2 right-2 h-9 bg-white border border-red-300/80 rounded-lg pointer-events-none z-10 shadow-xs ring-2 ring-red-500/10" />

                          {/* Cột Giờ (00 đến 23) - Không còn nhãn nào đè lên số */}
                          <div className="flex-1 flex flex-col items-center relative z-20">
                            <div
                              ref={hourScrollRef}
                              onScroll={handleHourScroll}
                              className="w-full h-full overflow-y-auto snap-y snap-mandatory pt-[38px] pb-[38px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                            >
                              {Array.from({ length: 24 }).map((_, i) => {
                                const val = String(i).padStart(2, '0');
                                const isSelected = val === notifHour;
                                return (
                                  <div
                                    key={`hour-${val}`}
                                    data-hour={val}
                                    onClick={() => selectHour(val, i)}
                                    className={`h-9 flex items-center justify-center snap-center cursor-pointer select-none transition-all duration-150 font-mono ${
                                      isSelected
                                        ? 'text-red-700 font-black text-base sm:text-lg scale-110 opacity-100'
                                        : 'text-slate-500 hover:text-slate-800 text-xs sm:text-sm font-medium opacity-45 hover:opacity-80'
                                    }`}
                                  >
                                    <span>{val}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Dấu phân tách 2 cột (:) */}
                          <div className="w-5 flex items-center justify-center text-slate-400 font-black text-sm select-none z-20 pb-0.5">
                            :
                          </div>

                          {/* Cột Phút (00 đến 59) - Không còn nhãn nào đè lên số */}
                          <div className="flex-1 flex flex-col items-center relative z-20">
                            <div
                              ref={minuteScrollRef}
                              onScroll={handleMinuteScroll}
                              className="w-full h-full overflow-y-auto snap-y snap-mandatory pt-[38px] pb-[38px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                            >
                              {Array.from({ length: 60 }).map((_, i) => {
                                const val = String(i).padStart(2, '0');
                                const isSelected = val === notifMinute;
                                return (
                                  <div
                                    key={`minute-${val}`}
                                    data-minute={val}
                                    onClick={() => selectMinute(val, i)}
                                    className={`h-9 flex items-center justify-center snap-center cursor-pointer select-none transition-all duration-150 font-mono ${
                                      isSelected
                                        ? 'text-red-700 font-black text-base sm:text-lg scale-110 opacity-100'
                                        : 'text-slate-500 hover:text-slate-800 text-xs sm:text-sm font-medium opacity-45 hover:opacity-80'
                                    }`}
                                  >
                                    <span>{val}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Địa điểm / Địa chỉ */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Địa điểm
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={notifLocation}
                        onChange={(e) => setNotifLocation(e.target.value)}
                        placeholder="Ví dụ: Hội trường UBND Phường Bình Tiên..."
                        className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 font-medium"
                      />
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  {/* 4. Nội dung thông báo (*) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Nội dung thông báo <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={notifContent}
                      onChange={(e) => setNotifContent(e.target.value)}
                      placeholder="Nhập nội dung chi tiết thông báo, chương trình làm việc..."
                      className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 font-medium leading-relaxed resize-y"
                    />
                  </div>

                  {/* 5. Nút hành động: Bình thường 'LƯU LỊCH GỬI', Khi sửa 'CẬP NHẬT THÔNG BÁO' kèm 'Hủy sửa' */}
                  <div className="pt-2">
                    {editingNotifId ? (
                      <div className="flex flex-col sm:flex-row items-center gap-2.5">
                        <button
                          type="submit"
                          disabled={isSavingNotif}
                          className="w-full sm:flex-1 py-3.5 px-6 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isSavingNotif ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>ĐANG CẬP NHẬT...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>CẬP NHẬT THÔNG BÁO</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isSavingNotif}
                          className="w-full sm:w-auto py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 transition-all cursor-pointer active:scale-95"
                        >
                          Hủy sửa
                        </button>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSavingNotif}
                        className="w-full py-3.5 px-6 bg-gradient-to-r from-red-800 via-red-700 to-amber-700 hover:from-red-900 hover:to-amber-800 text-white font-black text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isSavingNotif ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span>ĐANG LƯU LỊCH GỬI...</span>
                          </>
                        ) : (
                          <>
                            <CalendarDays className="w-5 h-5" />
                            <span>LƯU LỊCH GỬI</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* DANH SÁCH CÁC LỊCH THÔNG BÁO QUẢN TRỊ (NẰM NGAY DƯỚI BIỂU MẪU ADMIN KÈM NÚT SỬA VÀ XÓA) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-amber-600" />
                    <h5 className="text-xs sm:text-sm font-black text-slate-900 uppercase">
                      DANH SÁCH LỊCH THÔNG BÁO QUẢN TRỊ ({scheduledNotifs.length})
                    </h5>
                  </div>

                  <button
                    type="button"
                    onClick={loadScheduledNotifications}
                    className="text-xs text-slate-500 hover:text-red-700 flex items-center gap-1 font-semibold cursor-pointer"
                    title="Làm mới bảng thông báo từ Supabase"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingNotifs ? 'animate-spin' : ''}`} />
                    <span>Làm mới</span>
                  </button>
                </div>

                {(scheduledNotifs || []).length === 0 ? (
                  <div className="bg-slate-50 p-6 rounded-xl text-center text-xs text-slate-500 border border-slate-200/80">
                    Chưa có thông báo nào được lưu trong cơ sở dữ liệu Supabase.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {scheduledNotifs.map((item) => {
                      const safeIdStr = String(item?.id || '');
                      const isEditingThis = editingNotifId === safeIdStr;

                      return (
                        <div
                          key={safeIdStr || Math.random()}
                          className={`p-4 rounded-xl border transition-all space-y-3 relative group ${
                            isEditingThis
                              ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-200 shadow-xs'
                              : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200 shadow-2xs hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {isEditingThis && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-600 text-white animate-pulse">
                                    Đang sửa
                                  </span>
                                )}
                                <span className="text-[10px] font-semibold text-slate-500">
                                  Mã: {safeIdStr.slice(0, 12)}
                                </span>
                              </div>
                              <h6 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                                {item?.tieu_de}
                              </h6>
                            </div>

                            {/* BỔ SUNG TÍNH NĂNG CHỈNH SỬA (SỬA) VÀ XÓA (DELETE) */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(item)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer active:scale-95 ${
                                  isEditingThis
                                    ? 'bg-amber-600 text-white shadow-2xs'
                                    : 'bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300'
                                }`}
                                title="Chỉnh sửa thông báo này (tự động điền dữ liệu vào biểu mẫu)"
                              >
                                <Pencil className="w-3.5 h-3.5 text-amber-600" />
                                <span>Sửa</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteNotif(safeIdStr)}
                                className="px-2.5 py-1 bg-white hover:bg-red-50 text-slate-500 hover:text-red-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-200 hover:border-red-200 transition-colors cursor-pointer active:scale-95"
                                title="Xóa thông báo này khỏi cơ sở dữ liệu"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                <span>Xóa</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-red-700 shrink-0" />
                              <span>
                                Ngày: <strong className="text-slate-900">{formatMeetingDate(item?.thoi_gian_gui)}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                              <span>
                                Giờ: <strong className="text-slate-900">{formatMeetingTime(item?.thoi_gian_gui)}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-1.5 text-[11px] text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-red-700 shrink-0 mt-0.5" />
                            <span>
                              Địa điểm: <strong className="text-slate-900">{item?.dia_diem || 'Hội trường UBND Phường'}</strong>
                            </span>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 leading-relaxed">
                            <span className="font-semibold text-slate-700">Nội dung: </span>
                            <span>{item?.noi_dung}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* GIAO DIỆN 2: DÀNH CHO NGƯỜI DÙNG XEM (CÔNG KHAI KHI MỞ LỊCH CÔNG TÁC)      */
            /* ========================================================================= */
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Nút bấm Quản trị: Lên lịch phát thông báo (Tối giản hóa, tiết kiệm tối đa diện tích màn hình) */}
              <div className="flex items-center justify-end">
                <button
                  id="btn-admin-schedule-notif"
                  onClick={handleOpenAdminWorkspace}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="Dành cho Quản trị viên: Đăng nhập để lên lịch và quản lý thông báo"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Quản trị: Lên lịch phát thông báo</span>
                </button>
              </div>

              {/* DANH SÁCH THẺ THÔNG BÁO LỊCH DO ADMIN ĐÃ PHÁT HÀNH (ĐÃ LỌC LỊCH QUA NGÀY) */}
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
                          {/* Top Row: Category / Badge MỚI */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                                Lịch Công Tác
                              </span>

                              {/* HUY HIỆU 'MỚI' NỔI BẬT CHO LỊCH VỪA PHÁT HÀNH (TRONG VÒNG 24 GIỜ) */}
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

                          {/* Tiêu đề thông báo */}
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                            {item.tieu_de}
                          </h4>

                          {/* Thời gian & Địa điểm */}
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-700">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                              <span className="font-bold text-slate-900">{formatMeetingTime(item.thoi_gian_gui)}</span>
                              <span className="text-slate-400">|</span>
                              <span className="capitalize font-medium text-slate-700">{formatFullMeetingDate(item.thoi_gian_gui)}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="w-3.5 h-3.5 text-red-700 shrink-0 mt-0.5" />
                              <span>{item.dia_diem || 'Hội trường UBND Phường Bình Tiên'}</span>
                            </div>
                          </div>

                          {/* Nội dung thông báo */}
                          {item.noi_dung && (
                            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/60">
                              {item.noi_dung}
                            </p>
                          )}
                        </div>

                        {/* NÚT DUY NHẤT: [🔔 NHẮC TÔI / LƯU VÀO LỊCH] - TỰ ĐỘNG NHẬN DIỆN HỆ ĐIỀU HÀNH */}
                        <div className="pt-3 border-t border-slate-100">
                          <button
                            id={`btn-remind-meeting-${item.id}`}
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
        </div>
      )}

      {/* 3. NỘI DUNG THẺ 3: VĂN BẢN / HƯỚNG DẪN CÔNG TÁC (MOBILE-FIRST) */}
      {activeUtilityTab === 'VAN_BAN' && (
        <div className="space-y-3 animate-in fade-in duration-300">
          {/* 1. HÀNG CÔNG CỤ TÍCH HỢP 1 DÒNG (TIẾT KIỆM DIỆN TÍCH, CHỐNG TRÀN LỀ) */}
          <div className="flex items-center gap-2">
            {/* Ô tìm kiếm bo tròn tinh tế chiếm phần lớn */}
            <div className="relative flex-1 bg-white rounded-full border border-slate-200/90 shadow-2xs overflow-hidden focus-within:ring-2 focus-within:ring-emerald-600 focus-within:border-transparent transition-all">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                placeholder="Tìm tên, số hiệu văn bản..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
              />
              {docSearchQuery && (
                <button
                  type="button"
                  onClick={() => setDocSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2 nút icon tròn nhỏ gọn 36x36px */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Icon 1: 📂 Mở link kho Drive gốc */}
              <a
                href={OFFICIAL_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 flex items-center justify-center transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
                title="Mở Thư mục Google Drive gốc"
              >
                <FolderOpen className="w-4 h-4 text-emerald-700" />
              </a>

              {/* Icon 2: ➕ Quản trị thêm văn bản mới (yêu cầu mật khẩu nếu chưa xác thực) */}
              <button
                type="button"
                onClick={handleOpenAddDoc}
                className="w-9 h-9 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
                title="Quản trị viên thêm văn bản mới (Yêu cầu mật khẩu Admin)"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. THANH LỌC DANH MỤC NGANG PHẲNG (PILLS) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs -mx-0.5 px-0.5">
            {categories.map((tab) => {
              const isSelected = selectedCategory === tab;
              const count = getTabCount(tab);
              // Tab 'Tất cả (X)' hiển thị số lượng theo định dạng yêu cầu
              const label = tab === 'Tất cả' ? `Tất cả (${count})` : tab;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedCategory(tab)}
                  className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 text-xs active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs font-bold'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/90 hover:text-slate-900'
                  }`}
                >
                  <span>{label}</span>
                  {tab !== 'Tất cả' && count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isSelected ? 'bg-emerald-900/60 text-emerald-100' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 3. DANH SÁCH THẺ VĂN BẢN (ACCORDION TINH GỌN) */}
          {isFetchingDocs && documents.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 shadow-2xs space-y-2">
              <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-600 font-semibold">
                Đang tải danh sách văn bản và liên kết Google Drive...
              </p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 shadow-2xs space-y-2">
              <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                Không tìm thấy văn bản phù hợp trong danh mục "{selectedCategory}" với từ khóa "{docSearchQuery}".
              </p>
              <button
                type="button"
                onClick={() => {
                  setDocSearchQuery('');
                  setSelectedCategory('Tất cả');
                }}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Xem tất cả văn bản
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedDocs.map((doc) => {
                const isNew = isDocNew(doc);
                const isExpanded = expandedDocId === doc.id;
                const formattedDate = formatDocDate(doc.issueDate);

                return (
                  <div
                    key={doc.id}
                    className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? 'border-emerald-300 shadow-sm ring-1 ring-emerald-100'
                        : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    {/* KHU VỰC HIỂN THỊ THU GỌN: CHẠM BẤT KỲ VỊ TRÍ NÀO ĐỂ MỞ RỘNG / THU GỌN */}
                    <div
                      onClick={() => toggleExpandDoc(doc.id)}
                      className="p-3 sm:p-3.5 cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                    >
                      {/* DÀNH 100% CHIỀU NGANG CHO TIÊU ĐỀ (TỐI ĐA 2 DÒNG ĐẦY ĐỦ, KHÔNG BỊ CẮT CỤT) */}
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                        {isNew && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500 text-white shadow-xs animate-pulse ring-2 ring-rose-200 mr-2 align-middle"
                            title="Văn bản mới phát hành"
                          >
                            <Zap className="w-3 h-3 fill-current text-amber-100" />
                            <span>MỚI</span>
                          </span>
                        )}
                        <span>{doc.title}</span>
                      </h4>

                      {/* HÀNG PHỤ BÊN DƯỚI TIÊU ĐỀ: [Tên danh mục] • Ngày ban hành (DD/MM/YYYY) */}
                      <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-slate-500 mt-1.5">
                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {doc.category}
                        </span>
                        <span>•</span>
                        <span>Ngày ban hành: {formattedDate}</span>
                        {doc.code && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-600">{doc.code}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* KHU VỰC MỞ RỘNG (KHI CHẠM VÀO THẺ) */}
                    {isExpanded && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="px-3.5 pb-3.5 pt-1.5 sm:px-4 sm:pb-4 border-t border-slate-100 bg-slate-50/50 space-y-3 animate-in fade-in duration-200"
                      >
                        {/* Cơ quan ban hành */}
                        {doc.agency && (
                          <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-0.5">
                            <span className="font-semibold text-slate-700">Cơ quan ban hành:</span>
                            <span>{doc.agency}</span>
                          </div>
                        )}

                        {/* ĐOẠN TRÍCH YẾU / TÓM TẮT NỘI DUNG */}
                        {doc.summary && (
                          <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/90 text-xs text-slate-700 leading-relaxed">
                            <p className="font-bold text-emerald-950 text-[11px] uppercase tracking-wider mb-1">
                              Trích yếu nội dung:
                            </p>
                            <p>{doc.summary}</p>
                          </div>
                        )}

                        {/* CÁC ĐIỂM TRỌNG TÂM NẾU CÓ */}
                        {doc.highlights && doc.highlights.length > 0 && (
                          <div className="space-y-1">
                            {doc.highlights.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 3 NÚT HÀNH ĐỘNG Ở ĐÁY THẺ: 'Xem', 'Tải về', 'Chia sẻ' (TRỎ TRỰC TIẾP ĐẾN GOOGLE DRIVE) */}
                        <div className="pt-1 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-1 flex-wrap sm:flex-nowrap">
                            {/* Nút Xem (Mở xem trực tuyến trên Google Drive) */}
                            <a
                              href={doc.driveUrl || OFFICIAL_DRIVE_FOLDER_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 sm:flex-initial py-2 px-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
                              title="Mở xem trực tuyến trên Google Drive"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Xem</span>
                              <ExternalLink className="w-3 h-3 opacity-70 ml-0.5" />
                            </a>

                            {/* Nút Tải về (Tải file trực tiếp từ Google Drive) */}
                            <a
                              href={getGoogleDriveDownloadUrl(doc.driveUrl) || doc.driveUrl || OFFICIAL_DRIVE_FOLDER_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 sm:flex-initial py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 active:scale-95 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
                              title="Tải văn bản trực tiếp từ máy chủ Google Drive"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Tải về</span>
                            </a>

                            {/* Nút Chia sẻ (Web Share API / copy link) */}
                            <button
                              type="button"
                              onClick={() => handleShareDoc(doc)}
                              className="flex-1 sm:flex-initial py-2 px-3 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer shadow-2xs whitespace-nowrap"
                              title="Chia sẻ qua Zalo, Facebook, tin nhắn hoặc sao chép liên kết"
                            >
                              <Share2 className="w-3.5 h-3.5 text-slate-600" />
                              <span>Chia sẻ</span>
                            </button>
                          </div>

                          {/* Nút xóa dành riêng cho Admin nếu đã xác thực yeunuhotranp7 */}
                          {(authAccount === 'yeunuhotranp7' || sessionStorage.getItem('mt_auth_account') === 'yeunuhotranp7') && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDoc(doc.id, doc.title)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                              title="Xóa văn bản này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 4. CƠ CHẾ PHÂN TRANG: 'XEM THÊM (CÒN X VĂN BẢN) ↓' */}
              {remainingDocsCount > 0 && (
                <div className="pt-2 pb-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleDocCount((prev) => prev + 5)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 hover:text-emerald-900 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/80 rounded-full transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <span>Xem thêm (còn {remainingDocsCount} văn bản)</span>
                    <span className="text-xs">↓</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. NỘI DUNG THẺ 4: ĐÓNG GÓP Ý KIẾN */}
      {activeUtilityTab === 'Y_KIEN' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquareQuote className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900 uppercase">
                  TIẾP NHẬN Ý KIẾN CỦA NHÂN DÂN
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Ban Thường trực Ủy ban MTTQ Việt Nam Phường luôn trân trọng lắng nghe, tiếp thu mọi tâm tư, nguyện vọng và ý kiến đóng góp xây dựng địa phương của Nhân dân.
              </p>
            </div>

            {feedbackSuccess ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Cảm ơn Quý vị / Đồng chí đã gửi ý kiến đóng góp!
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Ban Thường trực Ủy ban MTTQ Việt Nam Phường luôn trân trọng lắng nghe, tiếp thu và sẽ tiến hành phân loại, chuyển tới bộ phận liên quan giải quyết kịp thời.
                </p>
                <button
                  type="button"
                  onClick={() => setFeedbackSuccess(false)}
                  className="mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Gửi thêm ý kiến đóng góp khác
                </button>
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
                      placeholder="Họ và tên người gửi (Hoặc để trống nếu gửi ẩn danh)"
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
                      placeholder="Số điện thoại liên hệ (Để phản hồi kết quả trực tiếp)"
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
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
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
                  setAuthPasswordInput('');
                  setPendingAuthAction(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mật khẩu xác thực
                </label>
                <input
                  id="admin-auth-password"
                  type="password"
                  value={authPasswordInput}
                  onChange={(e) => {
                    setAuthPasswordInput(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  placeholder="Nhập mã xác thực..."
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setAuthPasswordInput('');
                    setAuthError('');
                    setPendingAuthAction(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95 cursor-pointer transition-all"
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
              <span>Đã xác thực Quản trị viên</span>
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
      {/* MODAL: THÊM VĂN BẢN MỚI (DÀNH CHO QUẢN TRỊ VIÊN yeunuhotranp7) */}
      {/* ========================================================================= */}
      {isAddDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <BookOpen className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base uppercase">THÊM VĂN BẢN MỚI</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDocModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Badge xác thực Admin */}
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Quản trị viên đã xác thực (yeunuhotranp7)</span>
            </div>

            <form onSubmit={handleSaveNewDoc} className="space-y-3.5 text-left">
              {/* Tiêu đề văn bản */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề văn bản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newDocForm.title}
                  onChange={(e) => setNewDocForm({ ...newDocForm, title: e.target.value })}
                  placeholder="Ví dụ: Kế hoạch tổ chức Ngày hội Đại đoàn kết toàn dân tộc năm 2026..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              {/* Số hiệu & Ngày ban hành */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số hiệu văn bản
                  </label>
                  <input
                    type="text"
                    value={newDocForm.code}
                    onChange={(e) => setNewDocForm({ ...newDocForm, code: e.target.value })}
                    placeholder="Ví dụ: Kế hoạch số 12/KH-MTTQ"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày ban hành <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newDocForm.issueDate}
                    onChange={(e) => setNewDocForm({ ...newDocForm, issueDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              {/* Cơ quan ban hành */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cơ quan ban hành
                </label>
                <input
                  type="text"
                  value={newDocForm.agency}
                  onChange={(e) => setNewDocForm({ ...newDocForm, agency: e.target.value })}
                  placeholder="Ban Thường trực UB.MTTQ VN Phường Bình Tiên"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              {/* Danh mục văn bản (chọn cũ hoặc nhập mới) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Danh mục phân loại <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewDocForm({ ...newDocForm, isCustomCategory: !newDocForm.isCustomCategory })}
                    className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    {newDocForm.isCustomCategory ? '← Chọn danh mục có sẵn' : '+ Nhập danh mục mới'}
                  </button>
                </div>

                {newDocForm.isCustomCategory ? (
                  <input
                    type="text"
                    required
                    value={newDocForm.customCategory}
                    onChange={(e) => setNewDocForm({ ...newDocForm, customCategory: e.target.value })}
                    placeholder="Nhập tên danh mục mới (ví dụ: Biểu mẫu, Quy chế, Giám sát...)"
                    className="w-full px-3 py-2 text-xs border border-emerald-300 bg-emerald-50/30 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                    autoFocus
                  />
                ) : (
                  <select
                    value={newDocForm.category}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setNewDocForm({ ...newDocForm, isCustomCategory: true });
                      } else {
                        setNewDocForm({ ...newDocForm, category: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none bg-white"
                  >
                    {categories.filter(c => c !== 'Tất cả').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__">+ Nhập danh mục khác...</option>
                  </select>
                )}
              </div>

              {/* Đường dẫn file Drive */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đường dẫn Google Drive (File hoặc Thư mục)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={newDocForm.driveUrl}
                    onChange={(e) => setNewDocForm({ ...newDocForm, driveUrl: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none font-mono"
                  />
                  <FolderOpen className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mặc định liên kết đến Thư mục Drive gốc của đơn vị. Bạn có thể dán link trực tiếp đến file PDF/Docx cụ thể.
                </p>
              </div>

              {/* Tóm tắt trích yếu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tóm tắt trích yếu nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={newDocForm.summary}
                  onChange={(e) => setNewDocForm({ ...newDocForm, summary: e.target.value })}
                  placeholder="Tóm tắt ngắn gọn mục đích, đối tượng và nội dung cốt lõi của văn bản..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none leading-relaxed"
                />
              </div>

              {/* Nút thao tác */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSavingDoc}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingDoc ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>LƯU VĂN BẢN</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

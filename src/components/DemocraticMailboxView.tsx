import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  Star, 
  QrCode, 
  ExternalLink, 
  ShieldCheck, 
  Heart, 
  Send, 
  Download, 
  MessageSquarePlus, 
  Inbox, 
  CheckCircle2, 
  X, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Layers, 
  Settings2,
  FileText,
  Share2
} from 'lucide-react';
import { CitizenFeedback } from '../types';

interface DemocraticMailboxViewProps {
  onBackToList?: () => void;
}

const DEFAULT_FEEDBACKS: CitizenFeedback[] = [
  {
    id: 'fb-1',
    senderName: 'Nguyễn Văn Hòa',
    isAnonymous: false,
    phone: '0903123456',
    khuPho: 'Khu phố 3',
    category: 'Đô thị & Môi trường',
    title: 'Đề xuất tăng cường thu gom rác tại hẻm 124 đường Gia Phú',
    content: 'Kính gửi Ban Công tác Mặt trận và UBND Phường, hiện tại tại đầu hẻm 124 Gia Phú lượng rác sinh hoạt dồn ứ vào các buổi chiều, kính mong chính quyền phối hợp đơn vị vệ sinh môi trường tăng cường chuyến thu gom lúc 17h.',
    createdAt: '2026-08-20 09:30',
    status: 'da_giai_quyet'
  },
  {
    id: 'fb-2',
    senderName: 'Người dân ẩn danh',
    isAnonymous: true,
    khuPho: 'Khu phố 7',
    category: 'An ninh trật tự',
    title: 'Góp ý hệ thống camera an ninh và chiếu sáng công cộng',
    content: 'Đoạn đường nhánh gần công viên khu phố 7 vào ban đêm đèn đường hơi tối, mong Mặt trận khu phố phối hợp lắp thêm camera an ninh và bóng đèn led chiếu sáng phục vụ bà con đi lại an toàn.',
    createdAt: '2026-08-22 14:15',
    status: 'dang_xu_ly'
  },
  {
    id: 'fb-3',
    senderName: 'Trần Thị Mai',
    isAnonymous: false,
    phone: '0918765432',
    khuPho: 'Khu phố 12',
    category: 'An sinh xã hội & Mặt trận',
    title: 'Biểu dương hoạt động chăm lo học bổng cho con em khó khăn',
    content: 'Gia đình rất cảm kích sự quan tâm của Ban Công tác Mặt trận Khu phố 12 đã trao học bổng Nguyễn Hữu Thọ kịp thời cho các cháu đầu năm học mới. Kính chúc các cô chú cán bộ nhiều sức khỏe.',
    createdAt: '2026-08-24 16:45',
    status: 'da_tiep_nhan'
  }
];

export const DemocraticMailboxView: React.FC<DemocraticMailboxViewProps> = () => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [feedbackUrl, setFeedbackUrl] = useState<string>(() => {
    return localStorage.getItem('mt_feedback_custom_url') || window.location.href;
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Stored feedbacks list
  const [feedbackList, setFeedbackList] = useState<CitizenFeedback[]>(() => {
    const saved = localStorage.getItem('mt_citizen_feedbacks_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return DEFAULT_FEEDBACKS;
  });

  useEffect(() => {
    localStorage.setItem('mt_citizen_feedbacks_v1', JSON.stringify(feedbackList));
  }, [feedbackList]);

  // Form inputs state
  const [formData, setFormData] = useState({
    fullName: '',
    isAnonymous: false,
    phone: '',
    email: '',
    khuPho: 'Khu phố 1',
    category: 'Đô thị & Môi trường',
    title: '',
    content: '',
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Generate QR Code image
  useEffect(() => {
    const targetUrl = feedbackUrl || window.location.href;
    QRCode.toDataURL(targetUrl, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#111827',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [feedbackUrl]);

  // Handle Form Submission
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    const newFeedback: CitizenFeedback = {
      id: `fb-${Date.now()}`,
      senderName: formData.isAnonymous ? 'Người dân ẩn danh' : (formData.fullName.trim() || 'Người dân Phường Bình Tiên'),
      isAnonymous: formData.isAnonymous,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      khuPho: formData.khuPho,
      category: formData.category,
      title: formData.title.trim(),
      content: formData.content.trim(),
      createdAt: new Date().toLocaleString('vi-VN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      status: 'da_tiep_nhan'
    };

    setFeedbackList((prev) => [newFeedback, ...prev]);
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setIsFormOpen(false);
      setFormData({
        fullName: '',
        isAnonymous: false,
        phone: '',
        email: '',
        khuPho: 'Khu phố 1',
        category: 'Đô thị & Môi trường',
        title: '',
        content: '',
      });
    }, 1800);
  };

  // Download QR Code image
  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = 'QR_Hop_Thu_Dan_Chu_Co_So_Binh_Tien.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Share link
  const handleShare = async () => {
    const shareData = {
      title: 'Hộp thư dân chủ cơ sở - Phường Bình Tiên',
      text: 'Lắng nghe ý kiến Nhân dân – Cùng xây dựng Phường Bình Tiên',
      url: feedbackUrl || window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        navigator.clipboard.writeText(shareData.url);
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      alert('Đã sao chép liên kết Hộp thư dân chủ cơ sở vào bộ nhớ tạm!');
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-fade-in">
      
      {/* MAIN REPLICATED CARD (EXACT AS IMAGE) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-slate-200/80 transition-all">
        
        {/* 1. Header Banner with rich red-crimson gradient */}
        <div className="bg-gradient-to-b from-[#7a0606] via-[#8c1010] to-[#ab1717] px-4 py-8 sm:py-10 text-center text-white relative overflow-hidden shadow-inner">
            {/* Subtle light glow overlay */}
            <div className="absolute inset-0 bg-radial-gradient from-amber-400/10 via-transparent to-transparent pointer-events-none"></div>

            {/* Badge: Ngôi sao vàng 5 cánh trên nền đỏ: ★ PHƯỜNG BÌNH TIÊN */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-amber-400/70 bg-red-900/90 text-amber-200 text-xs font-bold uppercase tracking-widest mb-3 backdrop-blur-xs shadow-md">
              <span className="w-4 h-4 rounded-full bg-red-600 border border-amber-300 flex items-center justify-center shadow-xs shrink-0">
                <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
              </span>
              <span>PHƯỜNG BÌNH TIÊN</span>
            </div>

            {/* Main Bold Yellow Title: HỘP THƯ DÂN CHỦ CƠ SỞ (single line) */}
            <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight sm:tracking-wide text-[#fde047] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] font-sans whitespace-nowrap overflow-hidden">
              HỘP THƯ DÂN CHỦ CƠ SỞ
            </h2>

            {/* Slogan: “Lắng nghe ý kiến Nhân dân – Cùng xây dựng Phường Bình Tiên” */}
            <p className="text-white/95 italic text-xs sm:text-sm font-medium mt-2 max-w-lg mx-auto tracking-wide">
              “Lắng nghe ý kiến Nhân dân – Cùng xây dựng Phường Bình Tiên”
            </p>
          </div>

          {/* 2. Body Content Container */}
          <div className="p-5 sm:p-8 space-y-6 sm:space-y-8">
            
            {/* Quote Callout Box */}
            <div className="border-l-4 border-[#b91c1c] bg-slate-50/90 rounded-r-xl p-4 text-slate-700 text-xs sm:text-[13.5px] leading-relaxed font-medium">
              “Ý kiến của Nhân dân là nguồn thông tin quan trọng góp phần nâng cao hiệu quả thực hiện dân chủ ở cơ sở và xây dựng địa phương ngày càng tốt hơn.”
            </div>

            {/* Central QR Code Card */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative p-5 sm:p-7 bg-white rounded-2xl border-2 border-red-100/90 shadow-xs flex items-center justify-center group">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Mã QR Hộp thư dân chủ cơ sở"
                    className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-52 h-52 sm:w-60 sm:h-60 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400">
                    Đang tạo mã QR...
                  </div>
                )}
              </div>

              {/* QR Hint Pill Badge */}
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-[#b91c1c] border border-red-200/80 text-xs font-bold shadow-2xs">
                <QrCode className="w-3.5 h-3.5" />
                <span>Quét mã QR để gửi ý kiến góp ý</span>
              </div>
            </div>

            {/* Primary Action Button: GỬI Ý KIẾN NGAY */}
            <div className="flex flex-col items-center justify-center pt-1">
              <button
                onClick={() => setIsFormOpen(true)}
                className="w-full sm:w-80 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#a30d0d] via-[#b91c1c] to-[#c2410c] hover:from-[#880808] hover:to-[#9a3412] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <span>GỬI Ý KIẾN NGAY</span>
                <ExternalLink className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Quick utility tools */}
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={handleDownloadQR}
                  className="text-[11px] font-semibold text-slate-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                  title="Tải ảnh mã QR về máy để in ấn hoặc dán tại khu phố"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải ảnh QR</span>
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={handleShare}
                  className="text-[11px] font-semibold text-slate-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Chia sẻ hộp thư</span>
                </button>
              </div>
            </div>

            {/* Bottom Security & Availability Footer */}
            <div className="border-t border-slate-100 pt-4 mt-6">
              <div className="flex items-center justify-center gap-6 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Bảo mật thông tin</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-red-600 fill-red-600" />
                  <span>Tiếp nhận 24/7</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      {/* FEEDBACK SUBMISSION MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-slide-up flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#880808] to-[#ab1717] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <MessageSquarePlus className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold">Gửi Ý Kiến Góp Ý – Phường Bình Tiên</h3>
                  <p className="text-[11px] text-amber-200">Ý kiến của bạn sẽ được chuyển trực tiếp đến Mặt trận và chính quyền</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {submitSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Gửi Ý Kiến Thành Công!</h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Cảm ơn sự đóng góp quý báu của bạn. Ban Công tác Mặt trận sẽ tiếp nhận và phối hợp xử lý theo đúng quy định.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs flex-1">
                
                {/* Khu phố & Lĩnh vực */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Khu phố liên quan <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.khuPho}
                      onChange={(e) => setFormData({ ...formData, khuPho: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:bg-white text-slate-900"
                    >
                      <option value="Toàn Phường Bình Tiên">Toàn Phường Bình Tiên</option>
                      {Array.from({ length: 18 }, (_, i) => `Khu phố ${i + 1}`).map((kp) => (
                        <option key={kp} value={kp}>{kp}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Lĩnh vực phản ánh <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:bg-white text-slate-900"
                    >
                      <option value="Đô thị & Môi trường">Đô thị & Môi trường</option>
                      <option value="An ninh trật tự">An ninh trật tự</option>
                      <option value="Cải cách hành chính">Cải cách hành chính</option>
                      <option value="An sinh xã hội & Mặt trận">An sinh xã hội & Mặt trận</option>
                      <option value="Hiến kế xây dựng địa phương">Hiến kế xây dựng địa phương</option>
                      <option value="Ý kiến khác">Ý kiến khác</option>
                    </select>
                  </div>
                </div>

                {/* Tiêu đề */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tiêu đề ý kiến / Phản ánh <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="VD: Đề xuất gắn thêm đèn chiếu sáng tại hẻm..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:bg-white text-slate-900 font-medium"
                  />
                </div>

                {/* Chi tiết nội dung */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nội dung chi tiết <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Mô tả cụ thể địa điểm, thời gian, sự việc hoặc giải pháp đề xuất..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:bg-white text-slate-900"
                  />
                </div>

                {/* Thông tin người gửi & Tùy chọn ẩn danh */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Thông tin liên hệ</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-semibold text-[11px]">
                      <input
                        type="checkbox"
                        checked={formData.isAnonymous}
                        onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                        className="rounded text-red-700 focus:ring-red-500"
                      />
                      <span>Gửi ẩn danh</span>
                    </label>
                  </div>

                  {!formData.isAnonymous && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Họ và tên của bạn"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Số điện thoại (để nhận phản hồi)"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 italic">
                    * Thông tin cá nhân được bảo mật tuyệt đối theo quy chế dân chủ cơ sở.
                  </p>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi Ý Kiến Ngay</span>
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* CONFIG MODAL (FOR QR URL) */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-slide-up p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-red-700" />
                <span>Cấu Hình Đường Dẫn Mã QR</span>
              </h3>
              <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-slate-700 block">
                Link liên kết khi quét mã QR:
              </label>
              <input
                type="url"
                value={feedbackUrl}
                onChange={(e) => setFeedbackUrl(e.target.value)}
                placeholder="https://... hoặc link Google Form"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500">
                Mặc định là địa chỉ trang web này. Bạn có thể thay bằng link Google Form khảo sát của Phường Bình Tiên.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setFeedbackUrl(window.location.href);
                  localStorage.removeItem('mt_feedback_custom_url');
                }}
                className="text-xs text-slate-500 hover:text-red-700"
              >
                Đặt lại mặc định
              </button>

              <button
                onClick={() => {
                  localStorage.setItem('mt_feedback_custom_url', feedbackUrl);
                  setIsConfigOpen(false);
                }}
                className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

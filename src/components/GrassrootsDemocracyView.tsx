import React from 'react';
import { QrCode, ExternalLink, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';
import { GOOGLE_FEEDBACK_FORM_URL } from '../config/feedback';

export const GrassrootsDemocracyView: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 animate-fadeIn">
      {/* Main Container Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden">
        
        {/* Top Decorative Header Banner */}
        <div className="bg-gradient-to-r from-red-900 via-red-800 to-amber-700 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -left-8 -top-8 w-32 h-32 bg-red-400/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-200 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phường Bình Tiên</span>
          </div>

          <h2 className="font-anton text-2xl sm:text-3xl lg:text-4xl tracking-wide text-amber-300 uppercase drop-shadow-sm">
            HỘP THƯ DÂN CHỦ CƠ SỞ
          </h2>
          
          <p className="mt-2 text-xs sm:text-sm font-medium text-slate-100 italic tracking-wide max-w-xl mx-auto">
            “Lắng nghe ý kiến Nhân dân – Cùng xây dựng Phường Bình Tiên”
          </p>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-8 space-y-6">

          {/* Intro Text Box */}
          <div className="bg-slate-50 border-l-4 border-red-700 p-4 sm:p-5 rounded-r-xl shadow-2xs">
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              “Ý kiến của Nhân dân là nguồn thông tin quan trọng góp phần nâng cao hiệu quả thực hiện dân chủ ở cơ sở và xây dựng địa phương ngày càng tốt hơn.”
            </p>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center space-y-4 pt-2">
            <div className="relative group bg-white p-4 rounded-2xl border-2 border-red-100 shadow-lg hover:shadow-xl transition-all duration-300">
              {/* QR Code Real Image */}
              <div className="w-52 h-52 sm:w-64 sm:h-64 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden p-2">
                <img
                  src="/qr-hop-thu-dan-chu.png"
                  alt="Mã QR Góp ý Hộp thư Dân chủ cơ sở"
                  className="w-full h-full object-contain aspect-square rounded-lg"
                />
              </div>
            </div>

            {/* Scan Instruction */}
            <p className="text-xs sm:text-sm font-bold text-red-900 tracking-wide flex items-center gap-1.5 bg-red-50 px-3.5 py-1.5 rounded-full border border-red-100">
              <QrCode className="w-4 h-4 text-red-700" />
              <span>Quét mã QR để gửi ý kiến góp ý</span>
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-2 text-center">
            <a
              href={GOOGLE_FEEDBACK_FORM_URL || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-red-700 via-red-800 to-amber-700 hover:from-red-800 hover:to-amber-800 text-white font-extrabold text-sm sm:text-base tracking-wider uppercase rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-98 cursor-pointer ${
                !GOOGLE_FEEDBACK_FORM_URL ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              <span>GỬI Ý KIẾN NGAY</span>
              <ExternalLink className="w-5 h-5 stroke-[2.5]" />
            </a>
          </div>

          {/* Footer Assurance Badges */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-center items-center gap-4 text-slate-500 text-[11px] font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Bảo mật thông tin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-red-600" />
              <span>Tiếp nhận 24/7</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

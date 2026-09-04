import React, { useState } from 'react';
import { Landmark, MapPin, Navigation, Image as ImageIcon, X, Clock, Ticket, ExternalLink, Sparkles } from 'lucide-react';
import { RedSite } from '../types';

interface RedAddressDetailModalProps {
  site: RedSite | null;
  initialTab?: 'OVERVIEW' | 'GALLERY';
  onClose: () => void;
}

// Helper: Convert Google Maps address to navigation link
const getGoogleMapsDirLink = (address: string) => {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
};

// Helper: Parse Google Drive URLs
const formatImageUrl = (url?: string) => {
  if (!url) return 'https://images.unsplash.com/photo-1599386032032-4951d69123a8?auto=format&fit=crop&q=80&w=1000';
  if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
    }
  }
  return url;
};

export const RedAddressDetailModal: React.FC<RedAddressDetailModalProps> = ({
  site,
  initialTab = 'OVERVIEW',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'GALLERY'>(initialTab);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  if (!site) return null;

  const galleryList = site.galleryImages && site.galleryImages.length > 0 
    ? site.galleryImages 
    : [site.imageUrl];

  // Xác định nhãn tóm tắt phù hợp với di tích
  const summaryLabel = site.name.toLowerCase().includes('phạm văn chí')
    ? 'Tóm Tắt Tiểu Sử Tiền Nhân'
    : 'Tóm Tắt Bối Cảnh Lịch Sử';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-950 px-4 py-3.5 sm:px-5 sm:py-4 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-400 text-red-950 shadow-xs shrink-0">
                {site.category}
              </span>
              {site.khuPho && (
                <span className="text-[10px] font-semibold text-amber-200 shrink-0">
                  • {site.khuPho}
                </span>
              )}
            </div>
            {/* Tiêu đề hiển thị trọn vẹn trên đúng 1 hàng duy nhất */}
            <h3 
              className="text-sm sm:text-base font-bold text-amber-100 uppercase tracking-tight truncate whitespace-nowrap"
              title={site.name}
            >
              {site.name}
            </h3>
            {/* Dòng địa chỉ bên dưới: text-xs trên 1 hàng ngang liền mạch kèm icon vị trí 📍 */}
            <p className="text-xs text-amber-100/90 flex items-center gap-1.5 font-medium truncate whitespace-nowrap">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{site.address}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-amber-200 hover:text-white hover:bg-red-800/80 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Đóng popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs - 2 Tabs Balanced 50% Each */}
        <div className="bg-slate-100 p-1.5 border-b border-slate-200 grid grid-cols-2 gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`py-2 px-3 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-red-800 text-amber-300 shadow-xs'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Landmark className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">CHI TIẾT</span>
          </button>

          <button
            onClick={() => setActiveTab('GALLERY')}
            className={`py-2 px-3 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'GALLERY'
                ? 'bg-slate-800 text-amber-300 shadow-xs'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">HÌNH ẢNH ({galleryList.length})</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: OVERVIEW & HISTORY */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              {/* Banner Image */}
              <div className="rounded-2xl overflow-hidden h-52 sm:h-64 bg-slate-900 relative shadow-md">
                <img
                  src={formatImageUrl(site.imageUrl)}
                  alt={site.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Opening Hours & Ticket info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/80">
                {site.openHours && (
                  <div className="flex items-center gap-2 text-amber-950 font-semibold">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Giờ mở cửa: <strong className="text-amber-900">{site.openHours}</strong></span>
                  </div>
                )}
                {site.ticketPrice && (
                  <div className="flex items-center gap-2 text-amber-950 font-semibold">
                    <Ticket className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Vé tham quan: <strong className="text-amber-900">{site.ticketPrice}</strong></span>
                  </div>
                )}
              </div>

              {/* Tóm tắt tiểu sử / Bối cảnh lịch sử */}
              {site.summary && (
                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <h4 className="text-xs font-bold uppercase text-red-900 flex items-center gap-1.5 tracking-wide">
                    <Landmark className="w-3.5 h-3.5 text-red-700 shrink-0" />
                    <span>{summaryLabel}</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal text-justify">
                    {site.summary}
                  </p>
                </div>
              )}

              {/* Ý nghĩa lịch sử & Giá trị truyền thống */}
              {site.detailedHistory && (
                <div className="space-y-2 bg-red-50/40 p-4 rounded-2xl border border-red-200/70 shadow-2xs">
                  <h4 className="text-xs font-bold uppercase text-red-950 flex items-center gap-1.5 tracking-wide border-b border-red-100 pb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-red-700 shrink-0" />
                    <span>Ý NGHĨA LỊCH SỬ & GIÁ TRỊ TRUYỀN THỐNG</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line text-justify">
                    {site.detailedHistory}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PHOTO GALLERY */}
          {activeTab === 'GALLERY' && (
            <div className="space-y-4">
              {/* Large Display Photo */}
              <div className="rounded-2xl overflow-hidden h-64 sm:h-80 bg-slate-900 shadow-md relative group">
                <img
                  src={formatImageUrl(galleryList[activeImageIndex] || site.imageUrl)}
                  alt={`${site.name} ảnh ${activeImageIndex + 1}`}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Thumbnails list */}
              {galleryList.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {galleryList.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-red-600 ring-2 ring-red-300 scale-95 shadow-md'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={formatImageUrl(img)} alt="thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}

              {/* Google Drive Link if provided */}
              {site.driveUrl && (
                <div className="pt-2 text-center">
                  <a
                    href={site.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                  >
                    <span>Xem toàn bộ album ảnh đầy đủ trên Google Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer Actions - Pure Yellow Directions Button */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end shrink-0">
          <a
            href={getGoogleMapsDirLink(site.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[44px] px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Navigation className="w-4 h-4 fill-slate-950" />
            <span>CHỈ ĐƯỜNG NGAY GOOGLE MAPS</span>
          </a>
        </div>

      </div>
    </div>
  );
};

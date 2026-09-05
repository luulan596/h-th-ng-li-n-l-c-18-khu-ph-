import React, { useState } from 'react';
import { Landmark, MapPin, Navigation, Image as ImageIcon, X, Clock, Ticket, ExternalLink, Sparkles, BookOpen, Quote } from 'lucide-react';
import { RedSite } from '../types';
import { formatImageUrl, handleImageError } from './RedAddressesView';

interface RedAddressDetailModalProps {
  site: RedSite | null;
  initialTab?: 'OVERVIEW' | 'GALLERY';
  onClose: () => void;
}

// Helper: Convert Google Maps address to navigation link
const getGoogleMapsDirLink = (address: string) => {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
};

interface HistoricalExcerptProfile {
  name: string;
  exactAddress: string;
  categoryBadge: string;
  quotes: string[];
}

// Trích nội dung lịch sử chuẩn xác cho từng di tích lịch sử
const getHistoricalExcerptProfile = (site: RedSite): HistoricalExcerptProfile | null => {
  const query = (site.name + ' ' + (site.address || '') + ' ' + site.id).toLowerCase();

  // 1. Mộ và Đền thờ ông Phạm Văn Chí (Đình Bình Hòa)
  if (query.includes('phạm văn chí') || query.includes('bình hòa') || query.includes('red-site-1')) {
    return {
      name: 'Mộ và Đền thờ ông Phạm Văn Chí (Đình Bình Hòa)',
      exactAddress: 'Số 703 đường Phạm Văn Chí',
      categoryBadge: 'Di tích Lịch sử Cấp Thành phố (QĐ số 4301/QĐ-UBND)',
      quotes: [
        'Ông Phạm Văn Chí sinh trưởng tại làng Bình Đông (Chợ Lớn), xuất thân là một hương chức làng. Khi giặc Pháp xâm chiếm miền Đông Nam Việt, tuy chức phận nhỏ nhưng chí khí cao, ý thức được nhiệm vụ của công dân đối với quốc gia nên ông đã gia nhập phong trào chống xâm lăng của Trương Công Định và lãnh nhiệm vụ hoạt động trong vùng Chợ Lớn với nhiều chiến công oanh liệt. Ngày 10/10/2008, UBND thành phố Hồ Chí Minh ban hành Quyết định số 4301/QĐ-UBND về xếp hạng di tích lịch sử cấp thành phố đối với Mộ và Đền thờ ông Phạm Văn Chí.',
        'Di tích lịch sử Mộ và Đền thờ ông Phạm Văn Chí là nơi để nhân dân ghi nhớ, thờ phụng, tôn vinh công đức của tiền nhân; là nơi để nhân dân tham quan, tìm hiểu, nghiên cứu các giá trị về lịch sử, truyền thống đấu tranh chống ngoại xâm và truyền thống đấu tranh cách mạng của dân tộc.',
      ],
    };
  }

  // 2. Nhà truyền thống cách mạng người Hoa
  if (query.includes('người hoa') || query.includes('nguoi hoa') || query.includes('lưu vinh') || query.includes('red-site-2')) {
    return {
      name: 'Nhà truyền thống cách mạng người Hoa',
      exactAddress: 'Số 91 đường Phạm Văn Chí',
      categoryBadge: 'Di tích Lịch sử Cấp Thành phố (QĐ số 4377/QĐ-UBND)',
      quotes: [
        'Với truyền thống yêu nước, truyền thống cách mạng, đồng bào người Việt cũng như người Hoa ở Quận 6, đã một lòng một dạ theo Đảng và trong suốt hai cuộc kháng chiến chống thực dân Pháp và đế quốc Mỹ, Quận 6 luôn là niềm tin, chỗ dựa vững chắc của Thành phố, nhiều vị lãnh đạo Trung ương, Thành ủy đã từng có thời gian hoạt động, chỉ đạo phong trào đấu tranh cách mạng tại địa bàn Quận 6 trong sự bảo vệ, đùm bọc, che chở của nhiều cơ sở cách mạng người Việt và người Hoa, trong đó có gia đình chú Lưu Vinh (Lưu Vinh Phong) - một gia đình người Hoa yêu nước quận 6.',
        'Có thể nói, căn nhà 91 Đường Phạm Văn Chí rất xứng đáng là một trong những địa chỉ đỏ của Quận 6 trong thời kỳ kháng chiến chống Mỹ cứu nước cũng như trong sự nghiệp xây dựng và bảo vệ Tổ quốc Việt Nam xã hội chủ nghĩa. Do giá trị lịch sử cũng như việc phát huy được giá trị trong công tác giáo dục truyền thống của căn nhà 91 Đường Phạm Văn Chí sau khi trở thành Nhà truyền thống người Hoa thành phố, nên ngày 15/10/2008, Ủy ban nhân dân thành phố Hồ Chí Minh đã ban hành Quyết định số 4377/QĐ-UBND công nhận căn nhà số 91 Phạm Văn Chí là Di tích lịch sử cấp Thành phố.',
      ],
    };
  }

  // 3. Hầm in bí mật của Ban Tuyên huấn Hoa vận
  if (query.includes('hoa vận') || query.includes('hoa van') || query.includes('gia phú') || query.includes('hầm in') || query.includes('red-site-3')) {
    return {
      name: 'Hầm in bí mật của Ban Tuyên huấn Hoa vận',
      exactAddress: 'Số 341/10 Gia Phú, phường 1 - quận 6',
      categoryBadge: 'Di tích Lịch sử Cấp Quốc gia (QĐ số 2009/1998/QĐ-BVHTT)',
      quotes: [
        'Năm 1961, bộ phận Tuyên huấn của Ban cán sự Công vận người Hoa đã tổ chức một sở bí mật in truyền đơn bằng chữ Hoa ngay trong nội thành nhằm góp phần phổ biến kịp thời những tin tức thời sự nóng bỏng của quân và dân trên chiến trường, các chủ trương, chính sách của Mặt trận, cổ vũ, động viên phong trào đấu tranh của các tầng lớp nhân dân trong thành phố.',
        'Ngày 26/09/1998, Bộ Văn hóa Thông tin nay là Bộ Văn hóa, Thể dục, Thể thao đã ban hành Quyết định số 2009/1998/QĐ-BVHTT công nhận Di tích lịch sử Hầm bí mật in tài liệu của Ban Tuyên huấn Hoa vận trong thời kỳ chống Mỹ cứu nước tại số 341/10 đường Gia Phú, phường 1- quận 6.',
        'Địa chỉ này là nơi để nhân dân tham quan, tìm hiểu, nghiên cứu các giá trị về lịch sử, các hiện vật và truyền thống đấu tranh chống Mỹ của đồng bào Hoa quận 6, thành phố Hồ Chí Minh nói riêng và của dân tộc Việt Nam nói chung nhằm giáo dục truyền thống đấu tranh cách mạng cho nhân dân, cho các thế hệ thanh thiếu niên hôm nay và mai sau.',
      ],
    };
  }

  return null;
};

export const RedAddressDetailModal: React.FC<RedAddressDetailModalProps> = ({
  site,
  initialTab = 'OVERVIEW',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'GALLERY'>(initialTab);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  if (!site) return null;

  const galleryList = (site.images && site.images.length > 0)
    ? site.images
    : (site.galleryImages && site.galleryImages.length > 0 
        ? site.galleryImages 
        : [site.image || site.imageUrl]);

  const historicalProfile = getHistoricalExcerptProfile(site);
  const displayAddress = historicalProfile ? historicalProfile.exactAddress : site.address;

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
              <span className="truncate">{displayAddress}</span>
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
                  src={formatImageUrl(site.image || site.imageUrl, site.name)}
                  alt={site.name}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  onError={(e) => handleImageError(e, site.name || site.image || site.imageUrl)}
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

              {/* ĐOẠN TRÍCH DẪN LỊCH SỬ CHUẨN XÁC NẾU LÀ 3 DI TÍCH LỊCH SỬ QUAN TRỌNG */}
              {historicalProfile ? (
                <div className="space-y-3 bg-amber-50/50 p-4 sm:p-5 rounded-2xl border border-amber-200/80 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-2.5">
                    <h4 className="text-xs font-bold uppercase text-red-900 flex items-center gap-2 tracking-wide">
                      <BookOpen className="w-4 h-4 text-red-700 shrink-0" />
                      <span>TRÍCH NỘI DUNG LỊCH SỬ & GIÁ TRỊ TRUYỀN THỐNG</span>
                    </h4>
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-md">
                      📍 {historicalProfile.exactAddress}
                    </span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {historicalProfile.quotes.map((quote, idx) => (
                      <div
                        key={idx}
                        className="relative pl-3.5 py-1 border-l-2 border-amber-500/80 bg-white/70 p-3 rounded-r-xl shadow-2xs"
                      >
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal text-justify">
                          &ldquo;{quote}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Fallback cho di tích do người dùng tự tạo */
                <>
                  {site.summary && (
                    <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
                      <h4 className="text-xs font-bold uppercase text-red-900 flex items-center gap-1.5 tracking-wide">
                        <Landmark className="w-3.5 h-3.5 text-red-700 shrink-0" />
                        <span>Tóm Tắt Bối Cảnh Lịch Sử</span>
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal text-justify">
                        {site.summary}
                      </p>
                    </div>
                  )}

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
                </>
              )}
            </div>
          )}

          {/* TAB 2: PHOTO GALLERY */}
          {activeTab === 'GALLERY' && (
            <div className="space-y-4">
              {/* Large Display Photo */}
              <div className="rounded-2xl overflow-hidden h-64 sm:h-80 bg-slate-900 shadow-md relative group">
                <img
                  src={formatImageUrl(galleryList[activeImageIndex] || site.image || site.imageUrl, site.name)}
                  alt={`${site.name} ảnh ${activeImageIndex + 1}`}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  onError={(e) => handleImageError(e, site.name || galleryList[activeImageIndex] || site.image || site.imageUrl)}
                  className="w-full h-full object-cover"
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
                      <img
                        src={formatImageUrl(img, site.name)}
                        alt="thumb"
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                        onError={(e) => handleImageError(e, site.name || img)}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
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
            href={getGoogleMapsDirLink(displayAddress)}
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

import React, { useState } from 'react';
import { RedSite } from '../types';
import { Landmark, MapPin, Navigation, Image as ImageIcon, RotateCcw, Plus, X } from 'lucide-react';
import { getGoogleMapsDirLink } from '../utils/helpers';
import { RedAddressDetailModal } from './RedAddressDetailModal';

// Helper to format image URL (supports Google Drive share links)
export const formatImageUrl = (url?: string) => {
  if (!url) return 'https://images.unsplash.com/photo-1599386032032-4951d69123a8?auto=format&fit=crop&q=80&w=1000';
  if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
    }
  }
  return url;
};

interface RedAddressesViewProps {
  redSitesList: RedSite[];
  onAddRedSite?: (newItem: RedSite) => void;
  onResetRedSites?: () => void;
}

export const RedAddressesView: React.FC<RedAddressesViewProps> = ({
  redSitesList,
  onAddRedSite,
  onResetRedSites,
}) => {
  // Modal state for viewing details
  const [selectedSiteForPopup, setSelectedSiteForPopup] = useState<RedSite | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<'OVERVIEW' | 'GALLERY'>('OVERVIEW');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for new red site
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Di tích Lịch sử');
  const [newAddress, setNewAddress] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newHistory, setNewHistory] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newLat, setNewLat] = useState('10.74825');
  const [newLng, setNewLng] = useState('106.63910');

  const handleOpenPopup = (site: RedSite, defaultTab: 'OVERVIEW' | 'GALLERY' = 'OVERVIEW') => {
    setSelectedSiteForPopup(site);
    setModalInitialTab(defaultTab);
  };

  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const created: RedSite = {
      id: 'red_site_' + Date.now(),
      name: newName.trim(),
      category: newCategory.trim() || 'Di tích Lịch sử',
      address: newAddress.trim() || 'Phường Bình Tiên, TP.HCM',
      summary: newSummary.trim() || 'Địa chỉ đỏ lưu giữ truyền thống lịch sử văn hóa.',
      detailedHistory: newHistory.trim() || newSummary.trim(),
      imageUrl: newImageUrl.trim() || 'https://images.unsplash.com/photo-1599386032032-4951d69123a8?auto=format&fit=crop&q=80&w=1000',
      galleryImages: newImageUrl.trim() ? [newImageUrl.trim()] : ['https://images.unsplash.com/photo-1599386032032-4951d69123a8?auto=format&fit=crop&q=80&w=1000'],
      toaDo: {
        lat: parseFloat(newLat) || 10.74825,
        lng: parseFloat(newLng) || 106.63910,
      },
      openHours: '08:00 - 17:00',
      ticketPrice: 'Miễn phí',
      isFeatured: false,
    };

    if (onAddRedSite) {
      onAddRedSite(created);
    }
    setShowAddModal(false);
    setNewName('');
    setNewAddress('');
    setNewSummary('');
    setNewHistory('');
    setNewImageUrl('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 my-2 pb-12 px-2 sm:px-4">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-red-950 via-red-900 to-amber-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-amber-500/30 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Top Title & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-amber-400/20 rounded-xl text-amber-300 border border-amber-400/30 shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-300 bg-red-950/80 px-2 py-0.5 rounded-md border border-amber-400/30 whitespace-nowrap">
                  Hành trình Lịch sử
                </span>
              </div>
              <h2 className="text-sm sm:text-base md:text-xl font-black text-amber-100 uppercase tracking-tight mt-0.5 whitespace-nowrap">
                ĐỊA CHỈ ĐỎ & DI TÍCH LỊCH SỬ
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onResetRedSites && (
              <button
                onClick={onResetRedSites}
                className="p-2 sm:px-3 sm:py-1.5 bg-red-950/80 hover:bg-red-900 text-amber-200 font-bold text-xs uppercase tracking-wider rounded-xl border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0 cursor-pointer"
                title="Khôi phục Di tích Mặc định"
              >
                <RotateCcw className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">Khôi phục</span>
              </button>
            )}
            {onAddRedSite && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-red-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Thêm Địa Chỉ Đỏ</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* GRID OF RED SITES - DISPLAY ALL SITES DIRECTLY */}
      <div className="space-y-3">
        {redSitesList.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl text-center border border-slate-200 space-y-2">
            <Landmark className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">
              Chưa có Địa chỉ đỏ nào trong danh sách.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {redSitesList.map((site) => (
              <div
                key={site.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Image Top: Click opens detail, NO red circular play icon overlay */}
                <div 
                  className="relative h-44 overflow-hidden bg-slate-900 cursor-pointer" 
                  onClick={() => handleOpenPopup(site, 'OVERVIEW')}
                >
                  <img
                    src={formatImageUrl(site.imageUrl)}
                    alt={site.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="bg-red-900/90 text-amber-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border border-amber-400/30 shadow-xs">
                      {site.category}
                    </span>
                    {site.isFeatured && (
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg shadow-xs">
                        Nổi bật
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 space-y-2">
                  <h4
                    onClick={() => handleOpenPopup(site, 'OVERVIEW')}
                    className="text-base font-bold text-slate-900 hover:text-red-800 transition-colors line-clamp-2 cursor-pointer uppercase leading-snug"
                  >
                    {site.name}
                  </h4>
                  <div className="flex items-start gap-1.5 text-xs text-slate-600 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{site.address}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {site.summary}
                  </p>
                </div>

                {/* Card Action Buttons Bar: Tái cấu trúc theo đúng yêu cầu */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-2">
                  {/* Hàng trên: 2 nút song song, mỗi nút 50% */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Nút 1 (Đỏ đô): 🏛 CHI TIẾT */}
                    <button
                      onClick={() => handleOpenPopup(site, 'OVERVIEW')}
                      className="min-h-[38px] py-2 px-2 bg-red-800 hover:bg-red-900 text-white rounded-xl text-[11px] font-bold uppercase flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      <Landmark className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>Chi Tiết</span>
                    </button>

                    {/* Nút 2 (Vàng cam): 🧭 CHỈ ĐƯỜNG */}
                    <a
                      href={getGoogleMapsDirLink(site.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[38px] py-2 px-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[11px] font-bold uppercase flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5 fill-slate-950 shrink-0" />
                      <span>Chỉ Đường</span>
                    </a>
                  </div>

                  {/* Hàng dưới: Chiếm trọn 100% bề ngang: Nút phụ (Xám/Đen hoặc viền xám): 🖼 HÌNH ẢNH DI TÍCH */}
                  <button
                    onClick={() => handleOpenPopup(site, 'GALLERY')}
                    className="w-full min-h-[36px] py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-slate-100 hover:text-amber-300 rounded-xl text-[11px] font-bold uppercase flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-slate-700/50 shadow-2xs"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Hình Ảnh Di Tích</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT ĐỊA CHỈ ĐỎ */}
      <RedAddressDetailModal
        site={selectedSiteForPopup}
        initialTab={modalInitialTab}
        onClose={() => setSelectedSiteForPopup(null)}
      />

      {/* MODAL THÊM ĐỊA CHỈ ĐỎ MỚI */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold uppercase text-red-950 flex items-center gap-2">
                <Plus className="w-5 h-5 text-red-700" />
                <span>Thêm Địa Chỉ Đỏ Mới</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSite} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Địa chỉ đỏ / Di tích *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nhập tên di tích..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phân loại</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    <option value="Di tích Lịch sử Cấp Thành phố">Di tích Lịch sử Cấp Thành phố</option>
                    <option value="Di tích Lịch sử Cấp Quốc gia">Di tích Lịch sử Cấp Quốc gia</option>
                    <option value="Địa chỉ truyền thống">Địa chỉ truyền thống</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Địa chỉ</label>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="Số nhà, tên đường..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tóm tắt bối cảnh / Tiểu sử</label>
                <textarea
                  rows={3}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Nhập tóm tắt tiểu sử hoặc bối cảnh..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ý nghĩa lịch sử & Giá trị truyền thống</label>
                <textarea
                  rows={3}
                  value={newHistory}
                  onChange={(e) => setNewHistory(e.target.value)}
                  placeholder="Nội dung ý nghĩa lịch sử chi tiết..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Link Ảnh đại diện</label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vĩ độ (Latitude)</label>
                  <input
                    type="text"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kinh độ (Longitude)</label>
                  <input
                    type="text"
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  Lưu Di Tích
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// Export alias for backward compatibility
export const RedSitesView = RedAddressesView;

import React, { useState } from 'react';
import { RedSite } from '../types';
import { Landmark, MapPin, Navigation, Video, Image as ImageIcon, X, ExternalLink, Play, Clock, Ticket, Search, Plus, Sparkles, ShieldCheck, RotateCcw } from 'lucide-react';
import { getGoogleMapsDirLink } from '../utils/helpers';

const GoogleDriveIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 87.3 78" fill="currentColor">
    <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z" fill="#0066DA"/>
    <path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5L43.65 25z" fill="#00AC47"/>
    <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 3.8-6.6c.8-1.4 1.2-2.95 1.2-4.5H55.95l7.55 13.1 10.05 4.05z" fill="#EA4335"/>
    <path d="M43.65 25L57.4 1.2c-1.35-.8-2.9-1.2-4.5-1.2H34.4c-1.6 0-3.15.4-4.5 1.2L43.65 25z" fill="#00832D"/>
    <path d="M55.95 53H27.5l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.9c1.6 0 3.15-.4 4.5-1.2L55.95 53z" fill="#2684FC"/>
    <path d="M73.55 25H43.65l13.75 23.8 16.15-27.95c-.8-1.4-1.95-2.5-3.3-3.3z" fill="#FFBA00"/>
  </svg>
);

// Helper to extract Google Drive info
export const parseGoogleDriveUrl = (url?: string) => {
  if (!url) return { isDrive: false, type: null, id: null };
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return { isDrive: true, type: 'file' as const, id: fileMatch[1] };
  }
  const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return { isDrive: true, type: 'folder' as const, id: folderMatch[1] };
  }
  if (url.includes('drive.google.com')) {
    return { isDrive: true, type: 'general' as const, id: null };
  }
  return { isDrive: false, type: null, id: null };
};

// Helper to format image URL (supports Google Drive share links)
export const formatImageUrl = (url?: string) => {
  if (!url) return 'https://images.unsplash.com/photo-1599386032032-4951d69123a8?auto=format&fit=crop&q=80&w=1000';
  const driveInfo = parseGoogleDriveUrl(url);
  if (driveInfo.isDrive && driveInfo.id && driveInfo.type === 'file') {
    return `https://lh3.googleusercontent.com/d/${driveInfo.id}`;
  }
  return url;
};

// Helper to extract embeddable Video URL (YouTube or Google Drive Video preview)
export const getEmbedVideoUrl = (url?: string) => {
  if (!url) return null;

  const driveInfo = parseGoogleDriveUrl(url);
  if (driveInfo.isDrive && driveInfo.id) {
    return `https://drive.google.com/file/d/${driveInfo.id}/preview`;
  }

  if (url.includes('youtube.com/embed/')) return url;
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : url;
  }
  if (url.includes('watch?v=')) {
    const id = url.split('watch?v=')[1]?.split('&')[0];
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : url;
  }
  return url;
};

interface RedSitesViewProps {
  redSitesList: RedSite[];
  onAddRedSite?: (newItem: RedSite) => void;
  onResetRedSites?: () => void;
}

export const RedSitesView: React.FC<RedSitesViewProps> = ({
  redSitesList,
  onAddRedSite,
  onResetRedSites,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  // Modals state
  const [selectedSiteForPopup, setSelectedSiteForPopup] = useState<RedSite | null>(null);
  const [activeTabInModal, setActiveTabInModal] = useState<'OVERVIEW' | 'VIDEO' | 'GALLERY'>('OVERVIEW');
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for new red site
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Di tích Lịch sử');
  const [newAddress, setNewAddress] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newHistory, setNewHistory] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newDriveUrl, setNewDriveUrl] = useState('');
  const [newLat, setNewLat] = useState('10.74825');
  const [newLng, setNewLng] = useState('106.63910');

  // Filter Categories
  const categories = [
    'ALL',
    'Di tích Lịch sử Cấp Thành phố',
    'Di tích Lịch sử Cấp Quốc gia',
    'Di tích Quốc gia Đặc biệt',
  ];

  const filteredSites = redSitesList.filter((site) => {
    const matchCat =
      selectedCategory === 'ALL' ||
      site.category === selectedCategory ||
      site.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      selectedCategory.toLowerCase().includes(site.category.toLowerCase());
    const matchSearch =
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const featuredSite = redSitesList.find((s) => s.isFeatured) || redSitesList[0];
  const isHeroVisible = Boolean(featuredSite && !searchQuery && selectedCategory === 'ALL');

  // Display all filtered sites in grid so none are hidden from the card list
  const displaySitesInGrid = filteredSites;

  const handleOpenPopup = (site: RedSite, defaultTab: 'OVERVIEW' | 'VIDEO' | 'GALLERY' = 'OVERVIEW') => {
    setSelectedSiteForPopup(site);
    setActiveTabInModal(defaultTab);
    setActiveImageIndex(0);
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
      videoUrl: newVideoUrl.trim(),
      driveUrl: newDriveUrl.trim(),
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
    setNewVideoUrl('');
    setNewDriveUrl('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 my-2 pb-12 px-2 sm:px-4">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-red-950 via-red-900 to-amber-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-amber-500/30 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Top Title & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/20 rounded-xl text-amber-300 border border-amber-400/30 shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-300 bg-red-950/80 px-2 py-0.5 rounded-md border border-amber-400/30">
                  Hành trình Lịch sử
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-amber-100 uppercase tracking-tight mt-0.5">
                ĐỊA CHỈ ĐỎ & DI TÍCH LỊCH SỬ
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onResetRedSites && (
              <button
                onClick={onResetRedSites}
                className="p-2 sm:px-3 sm:py-1.5 bg-red-950/80 hover:bg-red-900 text-amber-200 font-bold text-xs uppercase tracking-wider rounded-xl border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0"
                title="Khôi phục Di tích Mặc định"
              >
                <RotateCcw className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">Khôi phục</span>
              </button>
            )}
            {onAddRedSite && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-red-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Thêm Địa Chỉ Đỏ</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter and Search Toolbar */}
        <div className="mt-4 pt-3.5 border-t border-amber-500/20 flex flex-col gap-2.5">
          {/* Search Box */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-amber-200/70 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên địa danh, địa chỉ di tích..."
              className="w-full bg-red-950/70 text-amber-100 placeholder-amber-200/50 text-xs pl-9 pr-3 py-2 rounded-xl border border-amber-500/30 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Category Chips - 2x2 grid on mobile, flex row on tablet/desktop */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center gap-1.5 pt-0.5">
            {categories.map((cat) => {
              let label = 'Tất cả';
              let icon = '🏛️';
              if (cat === 'ALL') {
                label = 'Tất cả';
                icon = '🏛️';
              } else if (cat.includes('Thành phố')) {
                label = 'Cấp Thành phố';
                icon = '⭐';
              } else if (cat.includes('Quốc gia Đặc biệt')) {
                label = 'QG Đặc biệt';
                icon = '🏆';
              } else if (cat.includes('Quốc gia')) {
                label = 'Cấp Quốc gia';
                icon = '🚩';
              }

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 text-center ${
                    selectedCategory === cat
                      ? 'bg-amber-400 text-red-950 font-bold shadow-md'
                      : 'bg-red-950/60 text-amber-200 hover:bg-red-950/90 border border-amber-500/20'
                  }`}
                >
                  <span className="text-sm shrink-0">{icon}</span>
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* FEATURED HIGHLIGHT RED SITE */}
      {featuredSite && !searchQuery && selectedCategory === 'ALL' && (
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 grid grid-cols-1 md:grid-cols-12 group">
          <div className="md:col-span-5 relative h-56 md:h-auto overflow-hidden bg-slate-900 cursor-pointer" onClick={() => handleOpenPopup(featuredSite)}>
            <img
              src={formatImageUrl(featuredSite.imageUrl)}
              alt={featuredSite.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent md:hidden"></div>
            <div className="absolute top-3 left-3 bg-red-700 text-amber-300 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-lg shadow-md border border-amber-400/40 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
              <span>{featuredSite.category}</span>
            </div>
          </div>

          <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-red-800 font-bold">
                <MapPin className="w-4 h-4 shrink-0 text-red-600" />
                <span>{featuredSite.address}</span>
              </div>
              <h3 
                onClick={() => handleOpenPopup(featuredSite)}
                className="text-lg sm:text-xl font-black text-slate-900 uppercase leading-snug group-hover:text-red-800 transition-colors cursor-pointer"
              >
                {featuredSite.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed font-normal">
                {featuredSite.summary}
              </p>
            </div>

            {/* Quick Action Buttons for Featured Site */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleOpenPopup(featuredSite, 'OVERVIEW')}
                className="py-2 px-2.5 bg-red-800 hover:bg-red-900 text-white rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <Landmark className="w-3.5 h-3.5 text-amber-300" />
                <span>Xem Popup</span>
              </button>

              <a
                href={getGoogleMapsDirLink(featuredSite.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <Navigation className="w-3.5 h-3.5 fill-slate-950" />
                <span>Chỉ Đường</span>
              </a>

              <button
                onClick={() => handleOpenPopup(featuredSite, 'VIDEO')}
                className="py-2 px-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <Video className="w-3.5 h-3.5 text-blue-200" />
                <span>Xem Video</span>
              </button>

              <button
                onClick={() => handleOpenPopup(featuredSite, 'GALLERY')}
                className="py-2 px-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                <span>Hình Ảnh</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRID OF RED SITES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-red-700" />
            <span>{isHeroVisible ? 'Các Địa Chỉ Đỏ Khác' : 'Danh Sách Địa Chỉ Đỏ'} ({displaySitesInGrid.length})</span>
          </h3>
        </div>

        {displaySitesInGrid.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl text-center border border-slate-200 space-y-2">
            <Landmark className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">
              Không tìm thấy Địa chỉ đỏ nào phù hợp với từ khóa tìm kiếm.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="text-xs text-red-700 font-bold hover:underline"
            >
              Xem lại tất cả di tích
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displaySitesInGrid.map((site) => {
              const hasDriveLink = site.driveUrl || (site.videoUrl && parseGoogleDriveUrl(site.videoUrl).isDrive) || (site.imageUrl && parseGoogleDriveUrl(site.imageUrl).isDrive);

              return (
                <div
                  key={site.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  {/* Image Top */}
                  <div className="relative h-44 overflow-hidden bg-slate-900 cursor-pointer" onClick={() => handleOpenPopup(site)}>
                    <img
                      src={formatImageUrl(site.imageUrl)}
                      alt={site.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-red-900/90 text-amber-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border border-amber-400/30">
                      {site.category}
                    </div>

                    {hasDriveLink && (
                      <div className="absolute top-2.5 right-2.5 bg-blue-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border border-blue-300/40 flex items-center gap-1 shadow-md">
                        <GoogleDriveIcon className="w-3 h-3" />
                        <span>Drive</span>
                      </div>
                    )}

                    {site.videoUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPopup(site, 'VIDEO');
                        }}
                        className="absolute bottom-2.5 right-2.5 p-2 bg-red-600/90 hover:bg-red-700 text-white rounded-full shadow-lg border border-amber-300/40"
                        title="Xem Video tư liệu"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                      </button>
                    )}
                  </div>

                {/* Content */}
                <div className="p-4 flex-1 space-y-2">
                  <h4
                    onClick={() => handleOpenPopup(site)}
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

                {/* Card Action Buttons Bar */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2">
                  {/* Popup / Detail Button */}
                  <button
                    onClick={() => handleOpenPopup(site, 'OVERVIEW')}
                    className="min-h-[38px] py-2 px-2 bg-red-800 hover:bg-red-900 text-white rounded-xl text-[11px] font-bold uppercase flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all"
                  >
                    <Landmark className="w-3.5 h-3.5 text-amber-300" />
                    <span>Chi Tiết</span>
                  </button>

                  {/* Directions Button */}
                  <a
                    href={getGoogleMapsDirLink(site.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[38px] py-2 px-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[11px] font-bold uppercase flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Chỉ Đường</span>
                  </a>

                  {/* Watch Video Button */}
                  <button
                    onClick={() => handleOpenPopup(site, 'VIDEO')}
                    className="col-span-1 min-h-[36px] py-1.5 px-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-[11px] font-bold uppercase flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <Video className="w-3.5 h-3.5 text-blue-200" />
                    <span>Xem Video</span>
                  </button>

                  {/* View Photos Button */}
                  <button
                    onClick={() => handleOpenPopup(site, 'GALLERY')}
                    className="col-span-1 min-h-[36px] py-1.5 px-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold uppercase flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                    <span>Hình Ảnh</span>
                  </button>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* POPUP DETAIL & MEDIA MODAL */}
      {selectedSiteForPopup && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-amber-200">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-900 via-red-800 to-amber-900 text-white p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-400 text-red-950">
                    {selectedSiteForPopup.category}
                  </span>
                  {selectedSiteForPopup.khuPho && (
                    <span className="text-[10px] font-semibold text-amber-200">
                      • {selectedSiteForPopup.khuPho}
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-amber-100 uppercase tracking-tight">
                  {selectedSiteForPopup.name}
                </h3>
                <p className="text-xs text-amber-100/90 flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{selectedSiteForPopup.address}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedSiteForPopup(null)}
                className="p-1.5 text-amber-200 hover:text-white hover:bg-red-800 rounded-xl transition-colors"
                title="Đóng popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="bg-slate-100 p-1.5 border-b border-slate-200 grid grid-cols-3 gap-1 shrink-0">
              <button
                onClick={() => setActiveTabInModal('OVERVIEW')}
                className={`py-2 px-3 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all ${
                  activeTabInModal === 'OVERVIEW'
                    ? 'bg-red-800 text-amber-300 shadow-sm'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Landmark className="w-4 h-4" />
                <span>Lịch Sử & Chi Tiết</span>
              </button>

              <button
                onClick={() => setActiveTabInModal('VIDEO')}
                className={`py-2 px-3 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all ${
                  activeTabInModal === 'VIDEO'
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Video Tư Liệu</span>
              </button>

              <button
                onClick={() => setActiveTabInModal('GALLERY')}
                className={`py-2 px-3 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all ${
                  activeTabInModal === 'GALLERY'
                    ? 'bg-slate-800 text-amber-300 shadow-sm'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Hình Ảnh ({selectedSiteForPopup.galleryImages?.length || 1})</span>
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* TAB 1: OVERVIEW & HISTORY */}
              {activeTabInModal === 'OVERVIEW' && (
                <div className="space-y-4">
                  {/* Banner Image */}
                  <div className="rounded-xl overflow-hidden h-52 sm:h-64 bg-slate-900 relative shadow-md">
                    <img
                      src={formatImageUrl(selectedSiteForPopup.imageUrl)}
                      alt={selectedSiteForPopup.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Google Drive Link Box if available */}
                  {(selectedSiteForPopup.driveUrl || parseGoogleDriveUrl(selectedSiteForPopup.videoUrl).isDrive || parseGoogleDriveUrl(selectedSiteForPopup.imageUrl).isDrive) && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
                          <GoogleDriveIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Kho Tư Liệu Google Drive Chính Thức</p>
                          <p className="text-[11px] text-slate-600">Xem video, hình ảnh chất lượng cao lưu trữ tại Google Drive</p>
                        </div>
                      </div>
                      <a
                        href={selectedSiteForPopup.driveUrl || selectedSiteForPopup.videoUrl || selectedSiteForPopup.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs active:scale-95 transition-all"
                      >
                        <span>Truy cập Drive</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {/* Opening Hours & Ticket info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-amber-50/80 p-3 rounded-xl border border-amber-200/80">
                    {selectedSiteForPopup.openHours && (
                      <div className="flex items-center gap-2 text-amber-950 font-semibold">
                        <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Giờ mở cửa: <strong>{selectedSiteForPopup.openHours}</strong></span>
                      </div>
                    )}
                    {selectedSiteForPopup.ticketPrice && (
                      <div className="flex items-center gap-2 text-amber-950 font-semibold">
                        <Ticket className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Vé tham quan: <strong>{selectedSiteForPopup.ticketPrice}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Historical Description */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold uppercase text-red-950 border-b border-red-100 pb-1">
                      Ý NGHĨA LỊCH SỬ & GIÁ TRỊ TRUYỀN THỐNG
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                      {selectedSiteForPopup.detailedHistory || selectedSiteForPopup.summary}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: VIDEO PLAYER */}
              {activeTabInModal === 'VIDEO' && (
                <div className="space-y-4">
                  {selectedSiteForPopup.videoUrl || selectedSiteForPopup.driveUrl ? (
                    <div className="space-y-3">
                      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg border border-slate-800 relative">
                        {getEmbedVideoUrl(selectedSiteForPopup.videoUrl || selectedSiteForPopup.driveUrl) ? (
                          <iframe
                            src={getEmbedVideoUrl(selectedSiteForPopup.videoUrl || selectedSiteForPopup.driveUrl)!}
                            title={selectedSiteForPopup.name}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white">
                            <Video className="w-12 h-12 text-blue-400 mb-2 animate-bounce" />
                            <p className="text-sm font-bold mb-3">Xem Video Thước Phim Tư Liệu</p>
                            <a
                              href={selectedSiteForPopup.videoUrl || selectedSiteForPopup.driveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg"
                            >
                              <GoogleDriveIcon className="w-4 h-4" />
                              <span>Mở Video Trên Google Drive</span>
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span>Video tư liệu chính thức về di tích {selectedSiteForPopup.name}</span>
                        <a
                          href={selectedSiteForPopup.videoUrl || selectedSiteForPopup.driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 font-bold hover:underline flex items-center gap-1 shrink-0"
                        >
                          <GoogleDriveIcon className="w-3.5 h-3.5" />
                          <span>Mở trực tiếp liên kết Google Drive</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <Video className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="text-sm font-semibold text-slate-600">
                        Chưa có video tư liệu đính kèm cho Địa chỉ đỏ này.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PHOTO GALLERY */}
              {activeTabInModal === 'GALLERY' && (
                <div className="space-y-4">
                  {/* Large Display Photo */}
                  <div className="rounded-2xl overflow-hidden h-64 sm:h-80 bg-slate-900 shadow-md relative group">
                    <img
                      src={formatImageUrl(
                        selectedSiteForPopup.galleryImages?.[activeImageIndex] ||
                        selectedSiteForPopup.imageUrl
                      )}
                      alt={`${selectedSiteForPopup.name} ${activeImageIndex + 1}`}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Thumbnails list */}
                  {selectedSiteForPopup.galleryImages && selectedSiteForPopup.galleryImages.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {selectedSiteForPopup.galleryImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`h-16 rounded-xl overflow-hidden border-2 transition-all ${
                            activeImageIndex === idx
                              ? 'border-red-600 ring-2 ring-red-300 scale-95'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={formatImageUrl(img)} alt="thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Drive Storage Link for Photos */}
                  {(selectedSiteForPopup.driveUrl || parseGoogleDriveUrl(selectedSiteForPopup.imageUrl).isDrive) && (
                    <div className="pt-2 text-center">
                      <a
                        href={selectedSiteForPopup.driveUrl || selectedSiteForPopup.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                      >
                        <GoogleDriveIcon className="w-4 h-4" />
                        <span>Xem toàn bộ album ảnh đầy đủ trên Google Drive</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              {selectedSiteForPopup.driveUrl ? (
                <a
                  href={selectedSiteForPopup.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-2 active:scale-95 transition-all"
                >
                  <GoogleDriveIcon className="w-4 h-4" />
                  <span>KHO LƯU TRỮ GOOGLE DRIVE</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : <div></div>}

              <a
                href={getGoogleMapsDirLink(selectedSiteForPopup.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Navigation className="w-4 h-4 fill-slate-950" />
                <span>CHỈ ĐƯỜNG NGAY GOOGLE MAPS</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* ADD RED SITE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold uppercase text-red-950 flex items-center gap-2">
                <Plus className="w-5 h-5 text-red-700" />
                <span>Thêm Địa Chỉ Đỏ Mới</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
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
                    <option value="Di tích Lịch sử">Di tích Lịch sử</option>
                    <option value="Di tích Cấp Thành phố">Di tích Cấp Thành phố</option>
                    <option value="Di tích Lịch sử Cấp Quốc gia">Di tích Lịch sử Cấp Quốc gia</option>
                    <option value="Di tích Quốc gia Đặc biệt">Di tích Quốc gia Đặc biệt</option>
                    <option value="Nhà Truyền thống">Nhà Truyền thống</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Địa chỉ chính xác</label>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="Phường Bình Tiên, TP.HCM..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả tóm tắt ý nghĩa</label>
                <textarea
                  rows={2}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Tóm tắt giá trị lịch sử..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lịch sử chi tiết</label>
                <textarea
                  rows={3}
                  value={newHistory}
                  onChange={(e) => setNewHistory(e.target.value)}
                  placeholder="Chi tiết lịch sử di tích..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Link Ảnh (URL / Google Drive)</label>
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Link Video (YouTube / Google Drive)</label>
                  <input
                    type="url"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Link Kho Tư Liệu Google Drive (Thư mục / Tệp)</label>
                <input
                  type="url"
                  value={newDriveUrl}
                  onChange={(e) => setNewDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl shadow-md"
                >
                  Lưu Địa Chỉ Đỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

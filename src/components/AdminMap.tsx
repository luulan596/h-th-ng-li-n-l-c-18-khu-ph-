import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Headquarters, HeadquartersType, RedSite } from '../types';
import { Navigation, MapPin, Landmark } from 'lucide-react';
import { getGoogleMapsDirLink } from '../utils/helpers';

interface AdminMapProps {
  headquartersList: Headquarters[];
  redSitesList?: RedSite[];
  selectedKhuPhoFilter?: string;
  onUpdateHeadquarters?: (updatedList: Headquarters[]) => void;
  webAppUrl?: string;
}

export const AdminMap: React.FC<AdminMapProps> = ({
  headquartersList,
  redSitesList = [],
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const [selectedHq, setSelectedHq] = useState<Headquarters | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Convert red sites to Headquarters-compatible structure for the map if RED_SITES or ALL
  const redSiteHqs: Headquarters[] = redSitesList.map((site) => ({
    id: site.id,
    tenTruSo: `🚩 ${site.name}`,
    loaiTruSo: 'ubnd',
    diaChi: site.address,
    soDienThoai: '',
    gioLamViec: site.openHours || 'Tất cả các ngày trong tuần',
    canBoPhuTrach: site.category,
    chucVuCanBo: 'Di tích Lịch sử',
    toaDo: site.toaDo,
    moTaChucNang: site.summary,
  }));

  // Combined or filtered list based on category
  const filteredList = (() => {
    if (selectedCategory === 'ALL') return [...headquartersList, ...redSiteHqs];
    if (selectedCategory === 'GOVERNMENT') return headquartersList.filter((hq) => ['ubnd', 'mat_tran', 'cong_an', 'quan_su', 'y_te'].includes(hq.loaiTruSo));
    if (selectedCategory === 'KHU_PHO') return headquartersList.filter((hq) => hq.loaiTruSo === 'khu_pho');
    if (selectedCategory === 'RED_SITES') return redSiteHqs;
    return headquartersList.filter((hq) => hq.loaiTruSo === selectedCategory);
  })();

  // Helper to create custom SVG L.divIcon for Leaflet
  const createCustomIcon = (type: HeadquartersType, isSelected: boolean, isRedSite: boolean = false) => {
    let bgColor = 'bg-red-600';
    let borderColor = 'border-amber-300';
    let iconHtml = '🏛️';

    if (isRedSite) {
      bgColor = 'bg-amber-600';
      borderColor = 'border-red-400';
      iconHtml = '🚩';
    } else {
      switch (type) {
        case 'ubnd':
          bgColor = 'bg-red-600';
          borderColor = 'border-amber-300';
          iconHtml = '🏛️';
          break;
        case 'mat_tran':
          bgColor = 'bg-red-700';
          borderColor = 'border-amber-400';
          iconHtml = `<img src="/mat_tran_logo.svg" alt="Mặt trận Tổ quốc Việt Nam" class="w-full h-full object-contain p-0.5 rounded-full" referrerPolicy="no-referrer" />`;
          break;
        case 'cong_an':
          bgColor = 'bg-blue-600';
          borderColor = 'border-amber-300';
          iconHtml = '🛡️';
          break;
        case 'quan_su':
          bgColor = 'bg-emerald-600';
          borderColor = 'border-amber-300';
          iconHtml = '🎖️';
          break;
        case 'y_te':
          bgColor = 'bg-sky-600';
          borderColor = 'border-red-400';
          iconHtml = '🏥';
          break;
        case 'khu_pho':
          bgColor = 'bg-red-600';
          borderColor = 'border-amber-300';
          iconHtml = '📍';
          break;
      }
    }

    const animClass = isSelected ? 'animate-selected-jump z-50' : 'animate-pin-jump hover:scale-110';
    const ringClass = isSelected ? 'ring-2 sm:ring-4 ring-amber-400' : '';

    const html = `
      <div class="relative group cursor-pointer ${animClass}">
        <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full ${bgColor} border-2 ${borderColor} ${ringClass} shadow-md flex items-center justify-center text-sm sm:text-base text-white overflow-hidden">
          ${iconHtml}
        </div>
        <div class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 ${bgColor} rotate-45 border-r border-b ${borderColor}"></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-leaflet-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [10.7490, 106.6525], // Centered in District 6, HCMC
        zoom: 16,
        zoomControl: true,
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker: L.Marker) => marker.remove());
    markersRef.current = {};

    // Add markers for filtered headquarters & red sites
    filteredList.forEach((hq) => {
      const isSelected = selectedHq?.id === hq.id;
      const isRedSite = hq.tenTruSo.startsWith('🚩');
      const icon = createCustomIcon(hq.loaiTruSo, isSelected, isRedSite);

      const marker = L.marker([hq.toaDo.lat, hq.toaDo.lng], { icon }).addTo(map);

      marker.on('click', () => {
        setSelectedHq(hq);
        map.flyTo([hq.toaDo.lat, hq.toaDo.lng], 17, { duration: 0.8 });
      });

      markersRef.current[hq.id] = marker;
    });

    return () => {
      // Cleanup on unmount handled gracefully
    };
  }, [filteredList, selectedHq?.id]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden my-5">
      
      {/* Map Header - Government Red & Gold Theme */}
      <div className="bg-red-900 px-3 py-2 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b-2 border-amber-500 overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
          <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300">
              ĐỊA ĐIỂM CÁC TRỤ SỞ & ĐỊA CHỈ ĐỎ
            </h2>
            <p className="text-[10px] sm:text-[11px] text-red-100/90 font-medium hidden md:block">
              Nhấn vào biểu tượng địa điểm trên bản đồ để xem chi tiết địa chỉ và chỉ đường Google Maps
            </p>
          </div>
        </div>

        {/* Category Filters - Compact single horizontal row */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar py-0.5 shrink-0">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-bold transition-all shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-amber-400 text-red-950 shadow-sm'
                : 'bg-red-950/80 hover:bg-red-800 text-red-100 border border-red-800/80'
            }`}
          >
            Tất cả ({headquartersList.length + redSitesList.length})
          </button>
          <button
            onClick={() => setSelectedCategory('GOVERNMENT')}
            className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-bold transition-all shrink-0 ${
              selectedCategory === 'GOVERNMENT'
                ? 'bg-amber-400 text-red-950 shadow-sm'
                : 'bg-red-950/80 hover:bg-red-800 text-red-100 border border-red-800/80'
            }`}
          >
            🏛️ Cơ quan Phường
          </button>
          <button
            onClick={() => setSelectedCategory('KHU_PHO')}
            className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-bold transition-all shrink-0 ${
              selectedCategory === 'KHU_PHO'
                ? 'bg-amber-400 text-red-950 shadow-sm'
                : 'bg-red-950/80 hover:bg-red-800 text-red-100 border border-red-800/80'
            }`}
          >
            📍 Trụ sở Khu phố
          </button>
          <button
            onClick={() => setSelectedCategory('RED_SITES')}
            className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
              selectedCategory === 'RED_SITES'
                ? 'bg-amber-400 text-red-950 shadow-sm'
                : 'bg-red-950/80 hover:bg-red-800 text-red-100 border border-red-800/80'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-amber-300" />
            <span>Địa chỉ đỏ ({redSitesList.length})</span>
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative w-full h-[480px] sm:h-[560px]">
        
        {/* Interactive Leaflet Map Stage */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Selected Headquarters Detail Card Overlay on Map */}
        {selectedHq && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-4 sm:right-auto sm:max-w-md z-20 bg-white rounded-xl p-3.5 sm:p-4 shadow-2xl border border-amber-200 animate-slide-up">
            
            {/* Top Badge & Close button matching the screenshot */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-block px-2.5 py-1 rounded font-bold uppercase text-[11px] sm:text-xs bg-red-900 text-amber-300 tracking-wide shadow-xs">
                {selectedHq.tenTruSo}
              </span>
              <button
                onClick={() => setSelectedHq(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 hover:bg-slate-100 rounded transition-colors"
                title="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Address Row */}
            <div className="flex items-start gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 pb-2 mb-3 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{selectedHq.diaChi}</span>
            </div>

            {/* Main Action Button - Directions Only */}
            <div className="pt-1">
              <a
                href={getGoogleMapsDirLink(selectedHq.diaChi)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[46px] py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
              >
                <Navigation className="w-4 h-4 fill-slate-950" />
                <span>CHỈ ĐƯỜNG ĐẾN VỊ TRÍ</span>
              </a>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};



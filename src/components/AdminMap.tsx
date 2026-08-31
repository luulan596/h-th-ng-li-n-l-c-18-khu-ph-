import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Headquarters, RedSite } from '../types';
import { Navigation, MapPin, Phone, User, Landmark, ChevronDown } from 'lucide-react';
import { formatPhoneNumber } from '../utils/helpers';

interface AdminMapProps {
  headquartersList: Headquarters[];
  redSitesList: RedSite[];
  selectedKhuPhoFilter: string | null;
}

export const AdminMap: React.FC<AdminMapProps> = ({ 
  headquartersList, 
  redSitesList,
  selectedKhuPhoFilter
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const [selectedHq, setSelectedHq] = useState<Headquarters | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Convert red sites to Headquarters-compatible structure
  const redSiteHqs: Headquarters[] = redSitesList.map((site) => ({
    id: site.id,
    tenTruSo: `🚩 ${site.name}`,
    loaiTruSo: 'RED_SITE' as any,
    diaChi: site.address,
    soDienThoai: '',
    gioLamViec: site.openHours || 'Tất cả các ngày trong tuần',
    canBoPhuTrach: site.category || 'Ban Quản lý Di tích',
    chucVuCanBo: 'Phụ trách',
    toaDo: site.toaDo,
    moTaChucNang: site.summary,
  }));

  // Counts based on actual Supabase data structure
  const govCount = headquartersList.filter((hq) => hq.loaiTruSo === 'CO_QUAN').length;
  const kpCount = headquartersList.filter((hq) => hq.loaiTruSo === 'khu_pho').length;
  const totalCount = govCount + kpCount + redSitesList.length;

  // Filtered list
  const filteredList = (() => {
    if (selectedCategory === 'ALL') return [...headquartersList, ...redSiteHqs];
    if (selectedCategory === 'GOVERNMENT') return headquartersList.filter((hq) => hq.loaiTruSo === 'CO_QUAN');
    if (selectedCategory === 'KHU_PHO') return headquartersList.filter((hq) => hq.loaiTruSo === 'khu_pho');
    if (selectedCategory === 'RED_SITES') return redSiteHqs;
    return headquartersList.filter((hq) => hq.loaiTruSo === selectedCategory);
  })();

  // Original Custom Icons
  const createCustomIcon = (hq: Headquarters, isSelected: boolean) => {
    const isRedSite = hq.loaiTruSo as any === 'RED_SITE';
    let bgColor = 'bg-red-600';
    let borderColor = 'border-amber-300';
    let iconHtml = '🏛️';

    if (isRedSite) {
      bgColor = 'bg-amber-600';
      borderColor = 'border-red-300';
      iconHtml = '<span class="text-base">🚩</span>';
    } else {
      switch (hq.loaiTruSo) {
        case 'CO_QUAN':
          bgColor = 'bg-blue-600';
          borderColor = 'border-amber-300';
          iconHtml = '<span class="text-base">🏛️</span>';
          break;
        case 'khu_pho': {
          bgColor = 'bg-red-700';
          borderColor = 'border-amber-400';
          const match = hq.tenTruSo.match(/\d+/) || hq.khuPhoThuocVong?.match(/\d+/);
          const kpNum = match ? match[0] : '';
          iconHtml = `
            <div class="flex flex-col items-center justify-center leading-none text-white select-none">
              <span class="text-[8px] font-black tracking-tighter text-amber-300 uppercase">KP</span>
              <span class="text-[11px] sm:text-xs font-black -mt-0.5">${kpNum}</span>
            </div>
          `;
          break;
        }
      }
    }

    const animClass = isSelected ? 'animate-selected-jump z-50 scale-125' : 'animate-pin-jump hover:scale-110';
    const ringClass = isSelected ? 'ring-3 sm:ring-4 ring-amber-400 shadow-xl' : 'shadow-md';

    const html = `
      <div class="relative group cursor-pointer ${animClass}">
        <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full ${bgColor} border-2 ${borderColor} ${ringClass} flex items-center justify-center text-white overflow-hidden transition-transform">
          ${iconHtml}
        </div>
        <div class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 ${bgColor} rotate-45 border-r border-b ${borderColor}"></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-leaflet-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [10.7490, 106.6500],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      setTimeout(() => map.invalidateSize(), 500);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    
    // Clear existing markers
    Object.values(markersRef.current).forEach((marker: L.Marker) => marker.remove());
    markersRef.current = {};

    const bounds = L.latLngBounds([]);

    filteredList.forEach((hq) => {
      const isSelected = selectedHq?.id === hq.id;
      const icon = createCustomIcon(hq, isSelected);

      const marker = L.marker([hq.toaDo.lat, hq.toaDo.lng], { icon }).addTo(map);

      marker.on('click', () => {
        setSelectedHq(hq);
        map.flyTo([hq.toaDo.lat, hq.toaDo.lng], 17, { duration: 0.6 });
      });

      bounds.extend([hq.toaDo.lat, hq.toaDo.lng]);
      markersRef.current[hq.id] = marker;
    });

    if (bounds.isValid() && filteredList.length > 0 && !selectedHq) {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
    }

    map.invalidateSize();
  }, [filteredList, selectedHq?.id]);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedKhuPhoFilter || selectedKhuPhoFilter === 'ALL') return;
    
    const hq = headquartersList.find(h => 
      h.loaiTruSo === 'khu_pho' && 
      (h.khuPhoThuocVong === selectedKhuPhoFilter || h.tenTruSo.includes(selectedKhuPhoFilter))
    );
    
    if (hq) {
      setSelectedHq(hq);
      mapInstanceRef.current.flyTo([hq.toaDo.lat, hq.toaDo.lng], 17, { duration: 1 });
    }
  }, [selectedKhuPhoFilter]);

  useEffect(() => {
    if (!mapContainerRef.current || !mapInstanceRef.current) return;
    const observer = new ResizeObserver(() => mapInstanceRef.current?.invalidateSize());
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden my-3">
      
      {/* Original Header */}
      <div className="bg-red-900 px-3 py-2.5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b-2 border-amber-500 overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
          <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300">
              BẢN ĐỒ TRỤ SỞ & ĐỊA CHỈ ĐỎ
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedHq(null);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center ${
              selectedCategory === 'ALL'
                ? 'bg-amber-400 text-red-950 shadow-sm'
                : 'bg-red-950/80 hover:bg-red-800 text-red-100 border border-red-800/80'
            }`}
          >
            Tất cả ({totalCount})
          </button>
          <button
            onClick={() => {
              setSelectedCategory('GOVERNMENT');
              setSelectedHq(null);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
              selectedCategory === 'GOVERNMENT'
                ? 'bg-amber-400 text-red-950 shadow-sm'
                : 'bg-red-950/80 hover:bg-red-800 text-red-100 border border-red-800/80'
            }`}
          >
            <span>🏛️</span>
            <span>Cơ quan Phường ({govCount})</span>
          </button>
          <button
            onClick={() => {
              setSelectedCategory('KHU_PHO');
              setSelectedHq(null);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
              selectedCategory === 'KHU_PHO'
                ? 'bg-amber-400 text-red-950 shadow-sm'
                : 'bg-red-950/80 hover:bg-red-800 text-red-100 border border-red-800/80'
            }`}
          >
            <span>📍</span>
            <span>Trụ sở Khu phố ({kpCount})</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${selectedCategory === 'KHU_PHO' ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => {
              setSelectedCategory('RED_SITES');
              setSelectedHq(null);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
              selectedCategory === 'RED_SITES'
                ? 'bg-amber-400 text-red-950 shadow-sm'
                : 'bg-red-950/80 hover:bg-red-800 text-red-100 border border-red-800/80'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>Địa chỉ đỏ ({redSitesList.length})</span>
          </button>
        </div>
      </div>

      {/* KP Selector */}
      {selectedCategory === 'KHU_PHO' && (
        <div className="bg-red-800/95 px-3 py-2.5 border-b border-amber-500/30 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="relative">
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'ALL') {
                  setSelectedHq(null);
                  const kpMarkers = headquartersList.filter(h => h.loaiTruSo === 'khu_pho');
                  if (kpMarkers.length > 0) {
                    const bounds = L.latLngBounds(kpMarkers.map(h => [h.toaDo.lat, h.toaDo.lng]));
                    mapInstanceRef.current?.fitBounds(bounds, { padding: [40, 40] });
                  }
                } else {
                  const num = parseInt(val);
                  const hq = headquartersList.find(h => 
                    h.loaiTruSo === 'khu_pho' && 
                    (h.tenTruSo.includes(`Khu phố ${num}`) || h.khuPhoThuocVong === `Khu phố ${num}`)
                  );
                  if (hq) {
                    setSelectedHq(hq);
                    mapInstanceRef.current?.flyTo([hq.toaDo.lat, hq.toaDo.lng], 18, { duration: 1 });
                  }
                }
              }}
              value={selectedHq?.khuPhoThuocVong?.replace('Khu phố ', '') || selectedHq?.tenTruSo?.replace('Trụ sở Khu phố ', '') || 'ALL'}
              className="w-full bg-red-950 border border-amber-500/30 text-amber-50 text-xs font-bold rounded-lg py-2.5 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer shadow-sm"
            >
              <option value="ALL">Tất cả 18 Khu phố</option>
              {Array.from({ length: 18 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>Khu phố {num}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-amber-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Main Map Container */}
      <div className="relative w-full h-[480px] sm:h-[580px]">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Detail Card */}
        {selectedHq && (
          <div className="absolute bottom-4 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-[320px] z-20 bg-white rounded-xl p-2.5 sm:p-3 shadow-2xl border border-amber-300 animate-slide-up">
            
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="inline-block px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-red-900 text-amber-300 tracking-wide shadow-xs truncate max-w-[200px]">
                {selectedHq.tenTruSo}
              </span>
              <button
                onClick={() => setSelectedHq(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1 hover:bg-slate-100 rounded transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-1 text-[11px] font-semibold text-slate-700 pb-1.5 mb-1.5 border-b border-slate-100">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{selectedHq.diaChi}</span>
              </div>
              {selectedHq.khuPhoThuocVong && (
                <div className="flex items-center gap-1.5 ml-5 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                  <span>{selectedHq.khuPhoThuocVong}</span>
                </div>
              )}
            </div>

            {selectedHq.canBoPhuTrach && (
              <div className="flex flex-col gap-1 text-[11px] text-slate-600 pb-2 mb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">
                    <strong className="text-slate-800">{selectedHq.canBoPhuTrach}</strong>
                    {selectedHq.chucVuCanBo ? ` (${selectedHq.chucVuCanBo})` : ''}
                  </span>
                </div>
                {selectedHq.soDienThoai && (
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="flex items-center gap-1.5 font-bold text-slate-700">
                      <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                      {formatPhoneNumber(selectedHq.soDienThoai)}
                    </span>
                    <a
                      href={`tel:${selectedHq.soDienThoai}`}
                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-xs transition-all active:scale-95"
                    >
                      <Phone className="w-2.5 h-2.5" />
                      <span>Gọi</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="pt-0.5">
              <button
                onClick={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedHq.toaDo.lat},${selectedHq.toaDo.lng}`;
                  window.open(url, '_blank');
                }}
                className="w-full min-h-[36px] py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
              >
                <Navigation className="w-3.5 h-3.5 fill-slate-950" />
                <span>CHỈ ĐƯỜNG ĐẾN VỊ TRÍ</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

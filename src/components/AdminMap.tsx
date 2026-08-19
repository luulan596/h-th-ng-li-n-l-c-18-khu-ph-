import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Headquarters, HeadquartersType, RedSite } from '../types';
import { Navigation, MapPin, Landmark, Phone, Clock, User, Info, X } from 'lucide-react';
import { getGoogleMapsDirLink } from '../utils/helpers';

interface AdminMapProps {
  headquartersList: Headquarters[];
  redSitesList?: RedSite[];
  selectedKhuPhoFilter?: string;
  onUpdateHeadquarters?: (updatedList: Headquarters[]) => void;
  webAppUrl?: string;
}

// Data wrapper structure to unify Headquarters and RedSite for map rendering
interface MapLocationItem {
  id: string;
  isRedSite: boolean;
  rawHeadquarters?: Headquarters;
  rawRedSite?: RedSite;
  title: string;
  shortLabel: string;
  popupHeaderTitle: string;
  category: string;
  khuPho?: string;
  address: string;
  phone?: string;
  hours?: string;
  officerName?: string;
  officerRole?: string;
  summary?: string;
  ticketPrice?: string;
  toaDo: {
    lat: number;
    lng: number;
  };
  loaiDiem?: string;
  loaiTruSo?: HeadquartersType;
}

export const AdminMap: React.FC<AdminMapProps> = ({
  headquartersList,
  redSitesList = [],
  selectedKhuPhoFilter = 'ALL',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const [selectedLocation, setSelectedLocation] = useState<MapLocationItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Helper to extract short badge label (KP1..KP18, UBND, MTTQ, CA, QS, YT)
  const getHqShortLabel = (hq: Headquarters): string => {
    if (hq.loaiDiem === 'CO_QUAN') {
      const idUpper = (hq.id || '').toUpperCase();
      if (idUpper.includes('UBND')) return 'UBND';
      if (idUpper.includes('MTTQ')) return 'MTTQ';
      if (idUpper.includes('CA') || idUpper.includes('CONG_AN')) return 'CA';
      if (idUpper.includes('QS') || idUpper.includes('QUAN_SU')) return 'QS';
      if (idUpper.includes('YT') || idUpper.includes('Y_TE')) return 'YT';
      return hq.id || 'CƠ QUAN';
    }

    // Extract KP number from khuPho, khuPhoThuocVong, id, or tenTruSo
    const source = hq.khuPho || hq.khuPhoThuocVong || hq.id || hq.tenTruSo;
    const match = source.match(/(?:KP|Khu\s*phố)\s*0*(\d+)/i);
    if (match && match[1]) {
      return `KP${parseInt(match[1], 10)}`;
    }

    if (hq.loaiTruSo && hq.loaiTruSo !== 'khu_pho') {
      switch (hq.loaiTruSo) {
        case 'ubnd': return 'UBND';
        case 'mat_tran': return 'MTTQ';
        case 'cong_an': return 'CA';
        case 'quan_su': return 'QS';
        case 'y_te': return 'YT';
      }
    }

    return 'KP';
  };

  // Map Headquarters data records to unified MapLocationItem
  const hqItems: MapLocationItem[] = useMemo(() => {
    return headquartersList.map((hq) => {
      const isKp = hq.loaiDiem === 'KHU_PHO' || hq.loaiTruSo === 'khu_pho' || (!hq.loaiDiem && (hq.khuPho || hq.khuPhoThuocVong || hq.id.startsWith('KP')));
      const shortLabel = getHqShortLabel(hq);
      
      let popupHeaderTitle = 'CƠ QUAN PHƯỜNG';
      if (isKp) {
        const kpNum = shortLabel.replace('KP', '');
        popupHeaderTitle = `TRỤ SỞ KHU PHỐ ${kpNum}`.trim();
      } else if (shortLabel === 'UBND') {
        popupHeaderTitle = 'CƠ QUAN PHƯỜNG - UBND';
      } else if (shortLabel === 'MTTQ') {
        popupHeaderTitle = 'CƠ QUAN PHƯỜNG - MTTQ';
      } else if (shortLabel === 'CA') {
        popupHeaderTitle = 'CƠ QUAN PHƯỜNG - CÔNG AN';
      } else if (shortLabel === 'QS') {
        popupHeaderTitle = 'CƠ QUAN PHƯỜNG - QUÂN SỰ';
      } else if (shortLabel === 'YT') {
        popupHeaderTitle = 'CƠ QUAN PHƯỜNG - Y TẾ';
      }

      return {
        id: hq.id,
        isRedSite: false,
        rawHeadquarters: hq,
        title: hq.tenTruSo,
        shortLabel,
        popupHeaderTitle,
        category: isKp ? 'Khu phố' : 'Cơ quan Phường',
        khuPho: hq.khuPho || hq.khuPhoThuocVong,
        address: hq.diaChi,
        phone: hq.soDienThoai ? String(hq.soDienThoai).trim() : '',
        hours: hq.gioLamViec,
        officerName: hq.canBoPhuTrach,
        officerRole: hq.chucVuCanBo,
        summary: hq.moTaChucNang,
        toaDo: hq.toaDo,
        loaiDiem: hq.loaiDiem,
        loaiTruSo: hq.loaiTruSo,
      };
    });
  }, [headquartersList]);

  // Map RedSite records to unified MapLocationItem
  const redSiteItems: MapLocationItem[] = useMemo(() => {
    return redSitesList.map((site) => ({
      id: site.id,
      isRedSite: true,
      rawRedSite: site,
      title: site.name,
      shortLabel: '⭐',
      popupHeaderTitle: `ĐỊA CHỈ ĐỎ - ${site.category || 'DI TÍCH LỊCH SỬ'}`,
      category: site.category || 'Di tích Lịch sử',
      khuPho: site.khuPho,
      address: site.address,
      hours: site.openHours || 'Tất cả các ngày trong tuần',
      ticketPrice: site.ticketPrice || 'Miễn phí',
      summary: site.summary || site.detailedHistory,
      toaDo: site.toaDo,
    }));
  }, [redSitesList]);

  // Combine Headquarters and RedSites
  const allLocationItems = useMemo(() => [...hqItems, ...redSiteItems], [hqItems, redSiteItems]);

  // Filter location items by global Khu phố filter AND category filter
  const filteredList = useMemo(() => {
    return allLocationItems.filter((item) => {
      // 1. Filter by Khu phố filter if active
      if (selectedKhuPhoFilter && selectedKhuPhoFilter !== 'ALL') {
        const kpMatch = item.khuPho === selectedKhuPhoFilter ||
          item.title.toLowerCase().includes(selectedKhuPhoFilter.toLowerCase()) ||
          item.shortLabel.toLowerCase() === selectedKhuPhoFilter.replace('Khu phố ', 'KP').toLowerCase();
        if (!kpMatch && !item.isRedSite && item.loaiDiem !== 'KHU_PHO' && item.loaiTruSo !== 'khu_pho') {
          // Administrative HQs remain visible when searching unless strictly KP specific
        } else if (!kpMatch) {
          return false;
        }
      }

      // 2. Filter by Category tab inside map view
      if (selectedCategory === 'ALL') return true;
      if (selectedCategory === 'GOVERNMENT') return !item.isRedSite && (item.loaiDiem === 'CO_QUAN' || (item.loaiTruSo && item.loaiTruSo !== 'khu_pho'));
      if (selectedCategory === 'KHU_PHO') return !item.isRedSite && (item.loaiDiem === 'KHU_PHO' || item.loaiTruSo === 'khu_pho');
      if (selectedCategory === 'RED_SITES') return item.isRedSite;
      return true;
    });
  }, [allLocationItems, selectedKhuPhoFilter, selectedCategory]);

  // Handle marker overlap (e.g. KP12 & KP14 at 10.739932, 106.637962; KP13 & KP15 at 10.744097, 106.638407)
  // Calculate tiny rendering offsets so markers sharing exact lat,lng appear side-by-side without obscuring each other.
  const renderLocations = useMemo(() => {
    const coordGroups: { [key: string]: MapLocationItem[] } = {};
    filteredList.forEach((item) => {
      const key = `${item.toaDo.lat.toFixed(6)},${item.toaDo.lng.toFixed(6)}`;
      if (!coordGroups[key]) coordGroups[key] = [];
      coordGroups[key].push(item);
    });

    return filteredList.map((item) => {
      const key = `${item.toaDo.lat.toFixed(6)},${item.toaDo.lng.toFixed(6)}`;
      const group = coordGroups[key];
      if (group.length <= 1) {
        return { item, renderLat: item.toaDo.lat, renderLng: item.toaDo.lng };
      }

      const index = group.indexOf(item);
      // Micro offset (~15-20 meters shift on map stage for display only)
      const angle = (index / group.length) * 2 * Math.PI - Math.PI / 2;
      const offsetDist = 0.00016;
      const renderLat = item.toaDo.lat + Math.sin(angle) * offsetDist * 0.8;
      const renderLng = item.toaDo.lng + Math.cos(angle) * offsetDist;

      return { item, renderLat, renderLng };
    });
  }, [filteredList]);

  // Create Leaflet Custom DivIcon for map markers
  const createCustomMarkerIcon = (item: MapLocationItem, isSelected: boolean) => {
    const animClass = isSelected ? 'animate-bounce scale-110 z-[1000]' : 'hover:scale-115 transition-transform cursor-pointer z-10';
    const ringClass = isSelected ? 'ring-4 ring-amber-400 shadow-2xl scale-105' : 'shadow-md';

    if (item.isRedSite) {
      // ĐỊA CHỈ ĐỎ MARKER: Distinct Amber/Gold badge with Red border & Star ⭐
      const html = `
        <div class="relative group cursor-pointer flex flex-col items-center ${animClass}">
          <div class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-red-950 border-2 border-red-700 ${ringClass} font-extrabold text-xs shadow-lg whitespace-nowrap transition-all">
            <span class="text-sm">⭐</span>
            <span class="tracking-tight text-[11px] font-black uppercase text-red-950">ĐỊA CHỈ ĐỎ</span>
          </div>
          <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-red-700 -mt-[1px]"></div>
        </div>
      `;

      return L.divIcon({
        html,
        className: 'custom-leaflet-marker-redsite',
        iconSize: [110, 36],
        iconAnchor: [55, 36],
        popupAnchor: [0, -36],
      });
    } else {
      // TRỤ SỞ KHU PHỐ & CƠ QUAN MARKER: Clear short label (KP1..KP18, UBND, MTTQ, etc.)
      let bgColor = 'bg-red-700';
      let borderColor = 'border-amber-300';
      let icon = '🏠';

      if (item.loaiDiem === 'CO_QUAN' || item.loaiTruSo !== 'khu_pho') {
        if (item.shortLabel === 'UBND') {
          bgColor = 'bg-red-800';
          borderColor = 'border-amber-400';
          icon = '🏛️';
        } else if (item.shortLabel === 'MTTQ') {
          bgColor = 'bg-red-900';
          borderColor = 'border-amber-400';
          icon = '🔰';
        } else if (item.shortLabel === 'CA') {
          bgColor = 'bg-blue-700';
          borderColor = 'border-amber-300';
          icon = '🛡️';
        } else if (item.shortLabel === 'QS') {
          bgColor = 'bg-emerald-700';
          borderColor = 'border-amber-300';
          icon = '🎖️';
        } else if (item.shortLabel === 'YT') {
          bgColor = 'bg-sky-700';
          borderColor = 'border-amber-300';
          icon = '🏥';
        }
      }

      const html = `
        <div class="relative group cursor-pointer flex flex-col items-center ${animClass}">
          <div class="flex items-center gap-1 px-2.5 py-1 rounded-full ${bgColor} text-white border-2 ${borderColor} ${ringClass} font-black text-xs shadow-lg whitespace-nowrap transition-all">
            <span class="text-xs">${icon}</span>
            <span class="tracking-wide text-[11px] font-bold text-amber-200">${item.shortLabel}</span>
          </div>
          <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-amber-400 -mt-[1px]"></div>
        </div>
      `;

      return L.divIcon({
        html,
        className: 'custom-leaflet-marker-hq',
        iconSize: [80, 36],
        iconAnchor: [40, 36],
        popupAnchor: [0, -36],
      });
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map if not created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [10.7460, 106.6435], // Centered in Phường Bình Tiên, District 6
        zoom: 15,
        zoomControl: true,
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Dismiss popup when user taps on empty map area
      map.on('click', () => {
        setSelectedLocation(null);
      });

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing map markers
    Object.values(markersRef.current).forEach((marker: L.Marker) => marker.remove());
    markersRef.current = {};

    // Render markers with display offsets for overlapping coordinates
    renderLocations.forEach(({ item, renderLat, renderLng }) => {
      const isSelected = selectedLocation?.id === item.id;
      const icon = createCustomMarkerIcon(item, isSelected);

      const marker = L.marker([renderLat, renderLng], { icon }).addTo(map);

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedLocation(item);
        map.flyTo([renderLat, renderLng], 17, { duration: 0.8 });
      });

      markersRef.current[item.id] = marker;
    });
  }, [renderLocations, selectedLocation?.id]);

  // Construct Google Maps direction URL with exact real coordinates lat,lng
  const getDirectionUrl = (item: MapLocationItem) => {
    if (item.toaDo && item.toaDo.lat && item.toaDo.lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${item.toaDo.lat},${item.toaDo.lng}`;
    }
    return getGoogleMapsDirLink(item.address);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden my-4">
      
      {/* Header bar - Red & Gold theme */}
      <div className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 px-4 py-3 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b-2 border-amber-500 shadow-sm">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="p-2 bg-amber-400/20 rounded-xl border border-amber-400/40">
            <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <span>BẢN ĐỒ KHU PHỐ & ĐỊA CHỈ ĐỎ</span>
            </h2>
            <p className="text-[11px] text-red-100/90 font-medium">
              Chạm vào marker để xem thông tin chi tiết và chỉ đường
            </p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar py-0.5 shrink-0">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-amber-400 text-red-950 shadow-md ring-2 ring-amber-300'
                : 'bg-red-950/90 hover:bg-red-800 text-red-100 border border-red-800'
            }`}
          >
            Tất cả ({allLocationItems.length})
          </button>
          <button
            onClick={() => setSelectedCategory('KHU_PHO')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
              selectedCategory === 'KHU_PHO'
                ? 'bg-amber-400 text-red-950 shadow-md ring-2 ring-amber-300'
                : 'bg-red-950/90 hover:bg-red-800 text-red-100 border border-red-800'
            }`}
          >
            <span>🏠 Trụ sở Khu phố</span>
          </button>
          <button
            onClick={() => setSelectedCategory('GOVERNMENT')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
              selectedCategory === 'GOVERNMENT'
                ? 'bg-amber-400 text-red-950 shadow-md ring-2 ring-amber-300'
                : 'bg-red-950/90 hover:bg-red-800 text-red-100 border border-red-800'
            }`}
          >
            <span>🏛️ Cơ quan Phường</span>
          </button>
          <button
            onClick={() => setSelectedCategory('RED_SITES')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
              selectedCategory === 'RED_SITES'
                ? 'bg-amber-400 text-red-950 shadow-md ring-2 ring-amber-300'
                : 'bg-red-950/90 hover:bg-red-800 text-red-100 border border-red-800'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-amber-300" />
            <span>Địa chỉ đỏ ({redSitesList.length})</span>
          </button>
        </div>
      </div>

      {/* Main Map Area Container */}
      <div className="relative w-full h-[520px] sm:h-[600px] bg-slate-100">
        
        {/* Interactive Leaflet Map Stage */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Compact Responsive Map Legend Overlay (Top Left) */}
        <div className="absolute top-3 left-3 z-20 bg-slate-950/85 backdrop-blur-md text-white border border-amber-500/50 rounded-xl px-3 py-2 shadow-xl max-w-[240px] text-[11px] space-y-1">
          <div className="font-extrabold uppercase text-amber-400 tracking-wider text-[10px] pb-1 border-b border-white/10 flex items-center justify-between">
            <span>CHÚ GIẢI BẢN ĐỒ</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span className="px-1.5 py-0.5 rounded bg-red-700 border border-amber-300 text-amber-200 font-bold text-[10px]">🏠 KP1..18</span>
            <span className="truncate font-medium">Trụ sở Khu phố</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span className="px-1.5 py-0.5 rounded bg-red-900 border border-amber-300 text-amber-200 font-bold text-[10px]">🏛️ Cơ quan</span>
            <span className="truncate font-medium">Cơ quan Phường</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-red-950 border border-red-700 font-black text-[10px]">⭐ ĐIỂM ĐỎ</span>
            <span className="truncate font-medium">Địa chỉ đỏ / Di tích</span>
          </div>
        </div>

        {/* Floating Tapped Location Card Popup (Bottom Center / Mobile Responsive) */}
        {selectedLocation && (
          <div className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-md z-30 bg-white rounded-2xl p-4 shadow-2xl border-2 border-amber-400 animate-slide-up transition-all">
            
            {/* Card Header & Close Button */}
            <div className="flex items-start justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
              <div className="space-y-1">
                <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider ${
                  selectedLocation.isRedSite 
                    ? 'bg-amber-500 text-red-950 border border-red-700 shadow-xs' 
                    : 'bg-red-900 text-amber-300 border border-amber-400 shadow-xs'
                }`}>
                  {selectedLocation.popupHeaderTitle}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                  {selectedLocation.title}
                </h3>
              </div>
              
              {/* Close Button X */}
              <button
                onClick={() => setSelectedLocation(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                title="Đóng cửa sổ"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Information Grid */}
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 mb-4 max-h-[220px] overflow-y-auto pr-1">
              
              {/* Address Row */}
              {selectedLocation.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Địa chỉ: </span>
                    <span>{selectedLocation.address}</span>
                  </div>
                </div>
              )}

              {/* Khu phố (if available) */}
              {selectedLocation.khuPho && (
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Khu vực: </span>
                    <span className="font-bold text-red-900">{selectedLocation.khuPho}</span>
                  </div>
                </div>
              )}

              {/* Phone Row (Only shown if soDienThoai has data) */}
              {selectedLocation.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Số điện thoại: </span>
                    <span className="font-mono font-bold text-emerald-800">{selectedLocation.phone}</span>
                  </div>
                </div>
              )}

              {/* Officer / Contact Person (for HQs if available) */}
              {selectedLocation.officerName && (
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Phụ trách: </span>
                    <span className="font-bold text-slate-900">{selectedLocation.officerName}</span>
                    {selectedLocation.officerRole && (
                      <span className="text-slate-500 text-xs block font-medium">({selectedLocation.officerRole})</span>
                    )}
                  </div>
                </div>
              )}

              {/* Working Hours / Open Hours */}
              {selectedLocation.hours && (
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Giờ hoạt động: </span>
                    <span className="text-slate-600">{selectedLocation.hours}</span>
                  </div>
                </div>
              )}

              {/* Summary / History description (for Red Sites or HQs if available) */}
              {selectedLocation.summary && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 mt-2 leading-relaxed">
                  <p className="line-clamp-4 font-normal">{selectedLocation.summary}</p>
                </div>
              )}

            </div>

            {/* Action Buttons: Directions & Call */}
            <div className="flex items-center gap-2 pt-1">
              
              {/* Directions Button */}
              <a
                href={getDirectionUrl(selectedLocation)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-[46px] py-2.5 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
              >
                <Navigation className="w-4.5 h-4.5 fill-slate-950 shrink-0" />
                <span>CHỈ ĐƯỜNG BẢN ĐỒ</span>
              </a>

              {/* Direct Phone Call Button (Only shown if phone number is present) */}
              {selectedLocation.phone && (
                <a
                  href={`tel:${selectedLocation.phone}`}
                  className="min-h-[46px] py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all shrink-0"
                  title={`Gọi ${selectedLocation.phone}`}
                >
                  <Phone className="w-4 h-4 fill-white" />
                  <span className="hidden sm:inline">GỌI</span>
                </a>
              )}

            </div>

          </div>
        )}

      </div>

    </div>
  );
};





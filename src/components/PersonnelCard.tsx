import React, { useState } from 'react';
import { Phone, MapPin, Award, Shield, Copy, Check, MessageCircle, AlertTriangle, Calendar, User, BadgeCheck } from 'lucide-react';
import { Personnel } from '../types';
import { isBanThuongTruc, isChuyenVien, isKeyLeader, isDeputyLeader, isPartyOfficial, formatPhoneNumber, getTelLink, getZaloLink, getCombinedRole } from '../utils/helpers';

interface PersonnelCardProps {
  personnel: Personnel;
  onSelectPerson: (person: Personnel) => void;
  onEditPerson?: (person: Personnel) => void;
}

export const PersonnelCard: React.FC<PersonnelCardProps> = ({
  personnel,
  onSelectPerson,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const isBTT = isBanThuongTruc(personnel);
  const isCV = isChuyenVien(personnel);
  const isLeader = isKeyLeader(personnel);
  const isDeputy = isDeputyLeader(personnel);
  const isParty = isPartyOfficial(personnel);

  // Extract phone numbers with multi-phone support
  const phoneList: string[] = React.useMemo(() => {
    const rawPhone = String(personnel.soDienThoai || personnel.phones?.[0] || '');
    if (!rawPhone) return [];
    
    return rawPhone
      .split(/[\n\r,;/]+|\\n/)
      .map(p => p.trim())
      .filter(p => p.length >= 8);
  }, [personnel.soDienThoai, personnel.phones]);

  // Gender & Birth Year
  const gender = String(personnel.gender || (personnel.namSinhNam ? 'Nam' : personnel.namSinhNu ? 'Nữ' : ''));
  const birthYear = String(personnel.birthYear || personnel.namSinhNam || personnel.namSinhNu || '');

  const handleCopyPhone = (e: React.MouseEvent, phone: string, index: number) => {
    e.stopPropagation();
    if (phone) {
      navigator.clipboard.writeText(phone);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  // Border & background scheme - Official Red & Gold Government Styling
  const cardBorderClass = isBTT
    ? 'border-l-4 border-amber-500 bg-gradient-to-r from-red-50 via-amber-50/70 to-white ring-1 ring-amber-400/50 shadow-xs'
    : isCV
    ? 'border-l-4 border-indigo-400 bg-gradient-to-r from-indigo-50/60 via-white to-slate-50/40 shadow-xs border-indigo-200'
    : isLeader
    ? 'border-l-4 border-amber-500 bg-gradient-to-r from-amber-50/80 via-white to-red-50/30 shadow-xs border-amber-200/80'
    : isDeputy
    ? 'border-l-4 border-red-700 bg-gradient-to-r from-red-50/60 via-white to-amber-50/30 shadow-xs border-red-200/60'
    : isParty
    ? 'border-l-4 border-red-800 bg-gradient-to-r from-red-50/70 to-white shadow-xs border-red-200'
    : 'border-l-4 border-red-600 bg-white hover:bg-red-50/20';

  const avatarBgClass = isBTT
    ? 'bg-gradient-to-br from-red-700 to-amber-600 text-amber-200 border border-amber-300 shadow-xs'
    : isCV
    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-2xs'
    : isLeader
    ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-red-950 border border-amber-400 shadow-xs'
    : isDeputy
    ? 'bg-gradient-to-br from-red-700 to-red-800 text-amber-300 border border-red-300 shadow-xs'
    : isParty
    ? 'bg-red-800 text-amber-300 border border-amber-400/40 shadow-xs'
    : 'bg-red-50 text-red-800 border border-red-200';

  const formattedRole = () => {
    return getCombinedRole(personnel);
  };

  const roleTextClass = isBTT
    ? 'text-[11.5px] font-bold text-red-950 tracking-tight'
    : isCV
    ? 'text-[11px] font-bold text-indigo-900 tracking-tight'
    : isLeader
    ? 'text-[11px] font-bold text-amber-900 tracking-tight'
    : isDeputy
    ? 'text-[11px] font-bold text-red-900 tracking-tight'
    : isParty
    ? 'text-[10.5px] font-bold text-red-800 tracking-tight'
    : 'text-[10.5px] font-medium text-slate-700 tracking-tight';

  return (
    <div
      className={`rounded-xl shadow-xs hover:shadow-md border-t border-r border-b border-slate-200 transition-all duration-150 flex flex-col justify-between overflow-hidden ${cardBorderClass}`}
    >
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
        
        {/* Top Header Row: Avatar, Name, Role */}
        <div>
          <div className="flex items-start gap-2.5 min-w-0">
            {/* Avatar Circle */}
            <div className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full font-bold text-xs shadow-2xs ${avatarBgClass}`}>
              {isBTT ? '⭐' : isCV ? <BadgeCheck className="w-4 h-4 text-indigo-600" /> : isLeader ? '👑' : isDeputy ? '🎖️' : isParty ? '🏛️' : '👤'}
            </div>

            <div className="min-w-0 flex-1">
              {/* Personnel Name */}
              <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate tracking-tight leading-tight">
                {personnel.hoTen}
              </h3>
              
              {/* Role Title (e.g. Phó Chủ tịch UBMTTQVN phường - Chủ tịch Hội LHPN phường) */}
              <p className={`${roleTextClass} truncate mt-0.5`} title={formattedRole()}>
                {formattedRole()}
              </p>
            </div>
          </div>

          {/* Badges and Address Rows for Khu pho personnel (kept clean for Ban Thuong truc) */}
          {!isBTT && (
            <>
              {/* Badges Row: Khu phố, Chức vụ kiêm nhiệm, Cấp ủy, Thông tin cá nhân */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                {isCV ? (
                  <span className="text-[9.5px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200 uppercase tracking-wider shadow-2xs flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                    Cơ quan Mặt trận
                  </span>
                ) : (
                  personnel.khuPho && (
                    <span className="text-[9.5px] font-black px-2 py-0.5 bg-red-900 text-amber-300 rounded-md border border-amber-500/40 uppercase tracking-wider shadow-2xs">
                      {personnel.khuPho}
                    </span>
                  )
                )}

                {/* For Trưởng ban (isLeader): keep only Khu phố badge. For others: show additional tags */}
                {!isLeader && (
                  <>
                    {isParty ? (
                      <span className="text-[9.5px] font-bold px-2 py-0.5 bg-red-100 text-red-900 rounded-md border border-red-300 uppercase tracking-wider flex items-center gap-1">
                        <Shield className="w-3 h-3 text-red-700 shrink-0" />
                        Cấp ủy Chi bộ
                      </span>
                    ) : (
                      <>
                        {gender && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                            {gender} {birthYear ? `• ${birthYear}` : ''}
                          </span>
                        )}
                        {personnel.chucDanhKhac && (
                          <span className="text-[9.5px] font-bold px-2 py-0.5 bg-amber-100 text-amber-950 rounded-md border border-amber-300 flex items-center gap-1 truncate max-w-[210px] shadow-2xs">
                            <Award className="w-3 h-3 text-amber-700 shrink-0" />
                            <span className="truncate">{personnel.chucDanhKhac}</span>
                          </span>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Address & Warning Row for non-leader and non-party members */}
              {!isLeader && !isParty && personnel.diaChi && (
                <div className="mt-2 space-y-1">
                  <div className="text-[11px] text-slate-700 font-medium flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span className="truncate">{personnel.diaChi}</span>
                  </div>

                  {personnel.dataWarning && (
                    <div className="text-[10px] text-amber-900 bg-amber-100/80 border border-amber-300 rounded px-1.5 py-0.5 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                      <span className="truncate">{personnel.dataWarning}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Footer Bar with Phone Controls */}
      <div className="px-3 py-2 bg-slate-50/95 border-t border-slate-200 flex flex-col gap-2">
        {phoneList.length === 0 ? (
          <div className="flex items-center justify-between text-xs text-slate-400 italic">
            <span>Chưa cập nhật SĐT</span>
            <button
              onClick={() => onSelectPerson(personnel)}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-red-900 border border-red-200 rounded-md text-[10px] font-bold not-italic"
            >
              Chi tiết
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {phoneList.map((phone, idx) => (
              <div key={idx} className="flex items-center justify-between gap-1.5">
                <a
                  href={getTelLink(phone)}
                  className="flex items-center gap-1 min-w-0 text-left hover:text-red-700 transition-colors group"
                  title={`Bấm để gọi điện cho ${personnel.hoTen}`}
                >
                  <Phone className="w-3 h-3 text-red-600 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="text-xs font-bold text-slate-900 font-mono tracking-tight truncate group-hover:text-red-700">
                    {formatPhoneNumber(phone)}
                  </span>
                </a>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={getTelLink(phone)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-2xs transition-all active:scale-95"
                    title={`Gọi ${phone}`}
                  >
                    <Phone className="w-3 h-3 fill-white" />
                    <span>GỌI</span>
                  </a>

                  <button
                    onClick={(e) => handleCopyPhone(e, phone, idx)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-0.5 shadow-2xs transition-all active:scale-95 ${
                      copiedIndex === idx
                        ? 'bg-emerald-800 text-white'
                        : 'bg-red-800 hover:bg-red-900 text-amber-100 border border-red-900'
                    }`}
                    title="Sao chép số điện thoại"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>ĐÃ COPY</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-amber-200" />
                        <span>COPY</span>
                      </>
                    )}
                  </button>

                  <a
                    href={getZaloLink(phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-[10px] font-bold flex items-center justify-center shadow-2xs transition-colors"
                    title="Chat Zalo"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>

                  {idx === 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPerson(personnel);
                      }}
                      className="p-1.5 bg-white hover:bg-red-50 text-red-900 border border-red-200 rounded-lg text-[10px] font-bold flex items-center justify-center shadow-2xs transition-colors ml-0.5"
                      title="Xem chi tiết"
                    >
                      <User className="w-3.5 h-3.5 text-red-700" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { Phone, MapPin, Award, Shield, User, Copy, Check, Share2, MessageCircle } from 'lucide-react';
import { Personnel } from '../types';
import { isKeyLeader, isDeputyLeader, isPartyOfficial, formatPhoneNumber, getTelLink } from '../utils/helpers';

interface PersonnelCardProps {
  personnel: Personnel;
  onSelectPerson: (person: Personnel) => void;
  onEditPerson?: (person: Personnel) => void;
}

export const PersonnelCard: React.FC<PersonnelCardProps> = ({
  personnel,
  onSelectPerson,
}) => {
  const [copied, setCopied] = useState(false);

  const isLeader = isKeyLeader(personnel);
  const isDeputy = isDeputyLeader(personnel);
  const isParty = isPartyOfficial(personnel);

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (personnel.soDienThoai) {
      navigator.clipboard.writeText(personnel.soDienThoai);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareContact = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `${personnel.hoTen} (${personnel.chucDanhMatTran || 'Thành viên'} - ${personnel.khuPho}): SĐT ${personnel.soDienThoai}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Cán bộ ${personnel.hoTen}`,
          text: shareText,
        });
      } catch {
        navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Geometric balance border-l-4 color scheme
  const cardBorderClass = isLeader
    ? 'border-l-4 border-amber-500 bg-amber-50/80'
    : isDeputy
    ? 'border-l-4 border-slate-400 bg-slate-50'
    : isParty
    ? 'border-l-4 border-red-600 bg-red-50/80'
    : 'border-l-4 border-indigo-400 bg-white';

  const avatarBgClass = isLeader
    ? 'bg-amber-100 text-amber-700'
    : isDeputy
    ? 'bg-slate-200 text-slate-600'
    : isParty
    ? 'bg-red-100 text-red-700'
    : 'bg-indigo-50 text-indigo-700';

  const roleTextClass = isLeader
    ? 'text-[10px] font-bold text-amber-800 uppercase tracking-wider'
    : isDeputy
    ? 'text-[10px] font-bold text-slate-500 uppercase tracking-wider'
    : isParty
    ? 'text-[10px] font-bold text-red-700 uppercase tracking-wider'
    : 'text-[10px] font-bold text-indigo-700 uppercase tracking-wider';

  const callBtnClass = isLeader
    ? 'bg-amber-500 hover:bg-amber-600 text-white'
    : isDeputy
    ? 'bg-slate-700 hover:bg-slate-800 text-white'
    : isParty
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-indigo-600 hover:bg-indigo-700 text-white';

  return (
    <div
      className={`rounded-lg shadow-2xs hover:shadow-sm border-t border-r border-b border-slate-200 transition-all duration-150 flex flex-col justify-between overflow-hidden ${cardBorderClass}`}
    >
      <div className="p-3 flex-1 flex flex-col justify-between">
        
        {/* Top Header Row: Avatar, Name, Role */}
        <div>
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar Circle */}
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-xs shadow-2xs ${avatarBgClass}`}>
              {isLeader ? '👑' : isDeputy ? '⭐' : isParty ? '🏛️' : '👤'}
            </div>

            <div className="min-w-0 flex-1">
              {/* Personnel Name */}
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate tracking-tight leading-tight">
                {personnel.hoTen}
              </h3>
              
              {/* Role Title */}
              <p className={`${roleTextClass} truncate`}>
                {personnel.chucDanhMatTran || 'Thành viên'}
              </p>
            </div>
          </div>

          {/* Badges Row: Khu phố, Cấp ủy, Chức danh khác */}
          <div className="flex flex-wrap items-center gap-1 mt-2">
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 uppercase tracking-wider">
              {personnel.khuPho}
            </span>
            {isParty && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-800 rounded border border-red-200 uppercase tracking-wider">
                Cấp ủy
              </span>
            )}
            {personnel.chucDanhKhac && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 bg-amber-50 text-amber-900 rounded border border-amber-200 flex items-center gap-1 truncate max-w-[180px]">
                <Award className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                <span className="truncate">{personnel.chucDanhKhac}</span>
              </span>
            )}
          </div>
        </div>

        {/* Residence Address */}
        <div className="mt-2">
          <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{personnel.diaChi}</span>
          </div>
        </div>

      </div>

      {/* Footer Bar */}
      <div className="px-3 py-1.5 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-between gap-1.5">
        <a
          href={getTelLink(personnel.soDienThoai)}
          className="flex items-center gap-1 min-w-0 text-left hover:text-indigo-600 transition-colors group"
          title={`Bấm để gọi điện cho ${personnel.hoTen}`}
        >
          <span className="text-xs font-bold text-slate-800 font-mono tracking-tight truncate group-hover:text-indigo-600">
            {formatPhoneNumber(personnel.soDienThoai) || 'Chưa có số'}
          </span>
        </a>

        <div className="flex items-center gap-1 shrink-0">
          <a
            href={getTelLink(personnel.soDienThoai)}
            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
            title={`Bấm để gọi điện ngay`}
          >
            <Phone className="w-2.5 h-2.5 fill-white" />
            <span>GỌI</span>
          </a>

          <button
            onClick={handleCopyPhone}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 shadow-2xs transition-colors ${
              copied
                ? 'bg-emerald-800 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
            title="Sao chép số điện thoại"
          >
            {copied ? (
              <>
                <Check className="w-2.5 h-2.5 stroke-[3]" />
                <span>ĐÃ COPY</span>
              </>
            ) : (
              <>
                <Copy className="w-2.5 h-2.5" />
                <span>COPY</span>
              </>
            )}
          </button>

          <button
            onClick={() => onSelectPerson(personnel)}
            className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold flex items-center gap-0.5 shadow-2xs transition-colors"
            title="Xem chi tiết & tùy chọn liên hệ"
          >
            <MessageCircle className="w-2.5 h-2.5 text-indigo-600" />
            <span className="hidden sm:inline">XEM</span>
          </button>
        </div>
      </div>

    </div>
  );
};



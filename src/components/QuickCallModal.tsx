import React, { useState } from 'react';
import { Phone, MessageCircle, Copy, MapPin, X, Check, Shield, Award, Share2, AlertTriangle, User } from 'lucide-react';
import { Personnel } from '../types';
import { isBanThuongTruc, isChuyenVien, isKeyLeader, isDeputyLeader, isPartyOfficial, formatPhoneNumber, getTelLink, getZaloLink, getCombinedRole } from '../utils/helpers';

interface QuickCallModalProps {
  personnel: Personnel | null;
  onClose: () => void;
  onNavigateToMap?: (khuPho: string) => void;
}

export const QuickCallModal: React.FC<QuickCallModalProps> = ({ personnel, onClose }) => {
  const [copiedPhoneIndex, setCopiedPhoneIndex] = useState<number | null>(null);

  if (!personnel) return null;

  const phoneList: string[] = personnel.phones && personnel.phones.length > 0
    ? personnel.phones
    : personnel.soDienThoai
    ? personnel.soDienThoai.split(/[\/\n,]+/).map(s => s.trim()).filter(Boolean)
    : [];

  const gender = personnel.gender || (personnel.namSinhNam ? 'Nam' : personnel.namSinhNu ? 'Nữ' : '');
  const birthYear = personnel.birthYear || personnel.namSinhNam || personnel.namSinhNu || '';

  const handleCopyPhone = (phone: string, idx: number) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneIndex(idx);
    setTimeout(() => setCopiedPhoneIndex(null), 2000);
  };

  const handleShareContact = async () => {
    const text = `${personnel.hoTen} (${personnel.chucDanhMatTran || 'Thành viên'} - ${personnel.khuPho}): ${
      phoneList.length > 0 ? phoneList.join(', ') : 'Chưa có số'
    }`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Cán bộ ${personnel.hoTen}`,
          text: text,
        });
      } catch {
        navigator.clipboard.writeText(text);
        setCopiedPhoneIndex(0);
        setTimeout(() => setCopiedPhoneIndex(null), 2000);
      }
    } else {
      navigator.clipboard.writeText(text);
      setCopiedPhoneIndex(0);
      setTimeout(() => setCopiedPhoneIndex(null), 2000);
    }
  };

  const isBTT = isBanThuongTruc(personnel);
  const isCV = isChuyenVien(personnel);
  const isLeader = isKeyLeader(personnel);
  const isDeputy = isDeputyLeader(personnel);
  const isParty = isPartyOfficial(personnel);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-slide-up">
        
        {/* Header with Red & Gold Government styling */}
        <div className="relative p-5 text-white bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-b-2 border-amber-500">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2 ${
              isBTT
                ? 'bg-gradient-to-br from-red-700 to-amber-600 border-amber-300 text-amber-200 shadow-lg'
                : isCV
                ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-300 text-white shadow-lg'
                : isLeader 
                ? 'bg-amber-500 border-amber-300 text-red-950 shadow-lg' 
                : isDeputy 
                ? 'bg-gradient-to-br from-red-700 to-red-800 border-red-300 text-amber-300 shadow-md' 
                : 'bg-red-900 border-amber-500/50 text-amber-200'
            }`}>
              {isBTT ? '⭐' : isCV ? '💼' : isLeader ? '👑' : isDeputy ? '🎖️' : isParty ? '🏛️' : '👤'}
            </div>

            <div>
              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider mb-1 bg-amber-400 text-red-950 border border-amber-300 shadow-2xs">
                {isBTT ? 'Ban Thường trực Phường' : isCV ? 'Cơ quan Mặt trận' : personnel.khuPho}
              </span>
              <h3 className="text-lg font-black text-white leading-snug">
                {personnel.hoTen}
              </h3>
              <p className="text-xs text-amber-200 font-bold tracking-tight mt-0.5">
                {getCombinedRole(personnel)}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Detailed Info Tags */}
          <div className="bg-red-50/50 p-3.5 rounded-xl border border-red-200/80 space-y-2">
            {isParty ? (
              <div className="flex items-center gap-2 text-xs">
                <Shield className="w-4 h-4 text-red-700 shrink-0" />
                <span className="font-bold text-red-900 bg-red-100 border border-red-300 px-2 py-0.5 rounded uppercase tracking-wider text-[10px]">
                  Cấp ủy Chi bộ
                </span>
              </div>
            ) : (
              <>
                {(gender || birthYear) && (
                  <div className="flex items-center gap-2 text-xs">
                    <User className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-slate-600 font-medium">Năm sinh & Giới tính: </span>
                    <span className="font-bold text-slate-900">
                      {gender ? `${gender}` : ''} {birthYear ? `(Sinh năm ${birthYear})` : ''}
                    </span>
                  </div>
                )}

                {personnel.chucDanhKhac && (
                  <div className="flex items-start gap-2 text-xs">
                    <Award className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-600 font-medium">Chức danh kiêm nhiệm: </span>
                      <span className="font-bold text-amber-950">{personnel.chucDanhKhac}</span>
                    </div>
                  </div>
                )}

                {personnel.diaChi && (
                  <div className="flex items-start gap-2 text-xs text-slate-700 pt-1.5 border-t border-red-100">
                    <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-600 font-medium">Địa chỉ cư trú: </span>
                      <span className="font-semibold text-slate-900">{personnel.diaChi}</span>
                    </div>
                  </div>
                )}

                {personnel.dataWarning && (
                  <div className="flex items-start gap-2 text-xs text-amber-900 bg-amber-100/90 p-2 rounded-lg border border-amber-300 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>{personnel.dataWarning}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Phone Numbers Display */}
          {phoneList.length === 0 ? (
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 italic">Chưa cập nhật số điện thoại cho cán bộ này.</p>
            </div>
          ) : (
            phoneList.map((phone, idx) => (
              <div key={idx} className="bg-gradient-to-r from-red-50/70 via-white to-amber-50/40 border border-red-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-red-900 font-black uppercase tracking-widest flex items-center gap-1">
                    <Phone className="w-3 h-3 text-red-600" />
                    <span>{phoneList.length > 1 ? `Số điện thoại ${idx + 1}` : 'Số điện thoại liên hệ'}</span>
                  </p>
                  <button
                    onClick={() => handleCopyPhone(phone, idx)}
                    className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg transition-all shadow-2xs ${
                      copiedPhoneIndex === idx
                        ? 'bg-emerald-700 text-white'
                        : 'bg-red-800 hover:bg-red-900 text-amber-100 border border-red-900'
                    }`}
                  >
                    {copiedPhoneIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" /> Đã chép
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-amber-300" /> Sao chép
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xl font-black text-slate-900 font-mono tracking-wider">
                  {formatPhoneNumber(phone)}
                </p>

                {/* Call & Zalo for this specific number */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={getTelLink(phone)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5 fill-white" />
                    <span>GỌI ĐIỆN</span>
                  </a>

                  <a
                    href={getZaloLink(phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    <span>NHẮN ZALO</span>
                  </a>
                </div>
              </div>
            ))
          )}

          {/* Share Contact Button */}
          <button
            onClick={handleShareContact}
            className="w-full flex items-center justify-center gap-2 py-3 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-98"
          >
            <Share2 className="w-4 h-4 text-slate-950" />
            <span>CHIA SẺ THÔNG TIN LIÊN HỆ</span>
          </button>

        </div>

      </div>
    </div>
  );
};

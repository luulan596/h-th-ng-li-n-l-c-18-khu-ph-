import React, { useState } from 'react';
import { Phone, MessageCircle, Copy, MapPin, X, Check, Shield, Award, AlertTriangle, User } from 'lucide-react';
import { Personnel } from '../types';
import { isKeyLeader, isDeputyLeader, isPartyOfficial, formatPhoneNumber, getTelLink, getZaloLink } from '../utils/helpers';

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

  const isLeader = isKeyLeader(personnel);
  const isDeputy = isDeputyLeader(personnel);
  const isParty = isPartyOfficial(personnel);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-slide-up">
        
        {/* Header */}
        <div className="relative bg-indigo-950 p-5 text-white border-b border-indigo-900">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2 ${
              isLeader 
                ? 'bg-amber-500 border-amber-300 text-white shadow-lg' 
                : isDeputy 
                ? 'bg-slate-700 border-slate-500 text-white' 
                : 'bg-indigo-900 border-indigo-700 text-indigo-200'
            }`}>
              {isLeader ? '👑' : isDeputy ? '⭐' : isParty ? '🏛️' : '👤'}
            </div>

            <div>
              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wider mb-1">
                {personnel.khuPho}
              </span>
              <h3 className="text-lg font-bold text-white leading-snug">
                {personnel.hoTen}
              </h3>
              <p className="text-xs text-indigo-200 font-medium mt-0.5">
                {personnel.chucDanhMatTran || 'Thành viên'} • Ban CT Mặt trận
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Detailed Info Tags */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            {(gender || birthYear) && (
              <div className="flex items-center gap-2 text-xs">
                <User className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-slate-500 font-medium">Năm sinh & Giới tính: </span>
                <span className="font-bold text-slate-800">
                  {gender ? `${gender}` : ''} {birthYear ? `(Sinh năm ${birthYear})` : ''}
                </span>
              </div>
            )}

            {personnel.chucDanhKhac && (
              <div className="flex items-start gap-2 text-xs">
                <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 font-medium">Chức danh kiêm nhiệm: </span>
                  <span className="font-semibold text-slate-800">{personnel.chucDanhKhac}</span>
                </div>
              </div>
            )}

            {isParty && (
              <div className="flex items-start gap-2 text-xs">
                <Shield className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded uppercase tracking-wider text-[10px]">
                  Đại diện Cấp ủy Chi bộ Khu phố
                </span>
              </div>
            )}

            <div className="flex items-start gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 font-medium">Địa chỉ cư trú: </span>
                <span className="font-medium text-slate-800">{personnel.diaChi || 'Chưa cập nhật'}</span>
              </div>
            </div>

            {personnel.dataWarning && (
              <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{personnel.dataWarning}</span>
              </div>
            )}
          </div>

          {/* Phone Numbers Display */}
          {phoneList.length === 0 ? (
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 italic">Chưa cập nhật số điện thoại cho cán bộ này.</p>
            </div>
          ) : (
            phoneList.map((phone, idx) => (
              <div key={idx} className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-widest">
                    {phoneList.length > 1 ? `Số điện thoại ${idx + 1}` : 'Số điện thoại liên hệ'}
                  </p>
                  <button
                    onClick={() => handleCopyPhone(phone, idx)}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded transition-all ${
                      copiedPhoneIndex === idx
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {copiedPhoneIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" /> Đã chép
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Sao chép
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xl font-black text-indigo-950 font-mono tracking-wider">
                  {formatPhoneNumber(phone)}
                </p>

                {/* Call & Zalo for this specific number */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={getTelLink(phone)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5 fill-white" />
                    <span>GỌI ĐIỆN</span>
                  </a>

                  <a
                    href={getZaloLink(phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    <span>NHẮN ZALO</span>
                  </a>
                </div>
              </div>
            ))
          )}

        </div>

      </div>
    </div>
  );
};

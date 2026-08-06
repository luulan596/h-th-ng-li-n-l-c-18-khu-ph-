import React, { useState } from 'react';
import { Phone, MessageCircle, Send, Copy, MapPin, X, Check, Shield, Award, User, Share2 } from 'lucide-react';
import { Personnel } from '../types';
import { isKeyLeader, isDeputyLeader, isPartyOfficial, formatPhoneNumber, getTelLink, getZaloLink, getSmsLink } from '../utils/helpers';

interface QuickCallModalProps {
  personnel: Personnel | null;
  onClose: () => void;
  onNavigateToMap?: (khuPho: string) => void;
}

export const QuickCallModal: React.FC<QuickCallModalProps> = ({ personnel, onClose, onNavigateToMap }) => {
  const [copied, setCopied] = useState(false);

  if (!personnel) return null;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(personnel.soDienThoai);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareContact = async () => {
    const text = `${personnel.hoTen} (${personnel.chucDanhMatTran || 'Thành viên'} - ${personnel.khuPho}): SĐT ${personnel.soDienThoai}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Cán bộ ${personnel.hoTen}`,
          text: text,
        });
      } catch {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isLeader = isKeyLeader(personnel);
  const isDeputy = isDeputyLeader(personnel);
  const isParty = isPartyOfficial(personnel);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-slide-up">
        
        {/* Header Header with Indigo Government styling */}
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
                {personnel.chucDanhMatTran} • Ban CT Mặt trận
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          
          {/* Detailed Role Tags */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            {personnel.chucDanhKhac && (
              <div className="flex items-start gap-2 text-xs">
                <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 font-medium">Chức danh đoàn thể: </span>
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
                <span className="text-slate-500 font-medium">Cư trú: </span>
                <span className="font-medium text-slate-800">{personnel.diaChi}</span>
              </div>
            </div>
          </div>

          {/* Large Phone Number Display & Quick Copy */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 text-center relative">
            <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-widest">Số điện thoại liên hệ</p>
            <p className="text-2xl font-black text-indigo-950 font-mono my-1 tracking-wider">
              {formatPhoneNumber(personnel.soDienThoai)}
            </p>
            <button
              onClick={handleCopyPhone}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Đã sao chép!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Sao chép số điện thoại
                </>
              )}
            </button>
          </div>

          {/* Quick Action Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Primary Direct Phone Call Button */}
            <a
              href={getTelLink(personnel.soDienThoai)}
              className="flex items-center justify-center gap-2 py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 col-span-2"
            >
              <Phone className="w-4 h-4 fill-white" />
              <span>GỌI ĐIỆN NGAY ({formatPhoneNumber(personnel.soDienThoai)})</span>
            </a>

            {/* Copy SĐT Button */}
            <button
              onClick={handleCopyPhone}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all active:scale-95 ${
                copied
                  ? 'bg-emerald-800 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'ĐÃ COPY' : 'COPY SĐT'}</span>
            </button>

            {/* Zalo Quick Chat Button */}
            <a
              href={getZaloLink(personnel.soDienThoai)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>NHẮN ZALO</span>
            </a>

            {/* Share Contact Button */}
            <button
              onClick={handleShareContact}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors col-span-2"
            >
              <Share2 className="w-4 h-4" />
              <span>CHIA SẺ THÔNG TIN LIÊN HỆ</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};


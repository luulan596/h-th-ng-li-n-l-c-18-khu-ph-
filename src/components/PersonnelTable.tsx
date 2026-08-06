import React, { useState } from 'react';
import { Phone, MapPin, Award, Shield, User, MessageCircle, Copy, Check } from 'lucide-react';
import { Personnel } from '../types';
import { isKeyLeader, isDeputyLeader, isPartyOfficial, formatPhoneNumber, getTelLink } from '../utils/helpers';

interface PersonnelTableProps {
  personnelList: Personnel[];
  onSelectPerson: (person: Personnel) => void;
}

export const PersonnelTable: React.FC<PersonnelTableProps> = ({
  personnelList,
  onSelectPerson,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyPhone = (id: string, phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (phone) {
      navigator.clipboard.writeText(phone);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-indigo-950 text-white font-bold uppercase tracking-widest text-[10px] border-b border-indigo-900">
              <th className="py-3 px-3 text-center w-12">STT</th>
              <th className="py-3 px-3">Họ và tên</th>
              <th className="py-3 px-2 text-center w-20">Năm sinh</th>
              <th className="py-3 px-3">Chức danh Mặt trận</th>
              <th className="py-3 px-3">Chức danh kiêm nhiệm</th>
              <th className="py-3 px-3">Địa chỉ cư trú</th>
              <th className="py-3 px-3">Khu phố</th>
              <th className="py-3 px-3 text-center">Số điện thoại</th>
              <th className="py-3 px-3 text-center w-28">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {personnelList.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  Không tìm thấy nhân sự phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              personnelList.map((p) => {
                const isLeader = isKeyLeader(p);
                const isDeputy = isDeputyLeader(p);
                const isParty = isPartyOfficial(p);
                const isCopied = copiedId === p.id;

                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      isLeader
                        ? 'bg-amber-50/70 hover:bg-amber-100/80 border-l-4 border-amber-500'
                        : isDeputy
                        ? 'bg-slate-50 hover:bg-slate-100 border-l-4 border-slate-400'
                        : isParty
                        ? 'bg-red-50/70 hover:bg-red-100/80 border-l-4 border-red-600'
                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    {/* STT */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                      {p.stt}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-sm text-slate-900">
                        {p.hoTen}
                      </div>
                      {isParty && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded uppercase tracking-wider mt-0.5">
                          Chi bộ Khu phố
                        </span>
                      )}
                    </td>

                    {/* Year of birth */}
                    <td className="py-3 px-2 text-center text-slate-500 font-mono text-[11px]">
                      {p.namSinhNam ? `Nam ${p.namSinhNam}` : p.namSinhNu ? `Nữ ${p.namSinhNu}` : '-'}
                    </td>

                    {/* Front Role */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isLeader
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : isDeputy
                            ? 'bg-slate-700 text-white shadow-2xs'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}
                      >
                        {isLeader && <span>👑</span>}
                        {isDeputy && <span>⭐</span>}
                        {p.chucDanhMatTran || 'Thành viên'}
                      </span>
                    </td>

                    {/* Other Roles */}
                    <td className="py-3 px-3 text-slate-700 font-medium max-w-xs">
                      {p.chucDanhKhac ? (
                        <div className="flex items-start gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{p.chucDanhKhac}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    {/* Address */}
                    <td className="py-3 px-3 text-slate-600 max-w-xs">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{p.diaChi}</span>
                      </div>
                    </td>

                    {/* Khu phố */}
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold border border-indigo-100 uppercase">
                        {p.khuPho}
                      </span>
                    </td>

                    {/* Phone Number with Direct Calling */}
                    <td className="py-3 px-3 text-center">
                      <a
                        href={getTelLink(p.soDienThoai)}
                        className="inline-flex items-center gap-1 font-mono font-bold text-indigo-700 hover:text-indigo-900 hover:underline px-2 py-1 rounded transition-colors"
                        title="Bấm để gọi điện ngay"
                      >
                        <Phone className="w-3 h-3 fill-indigo-600 text-indigo-600" />
                        <span>{formatPhoneNumber(p.soDienThoai)}</span>
                      </a>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <a
                          href={getTelLink(p.soDienThoai)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] uppercase shadow-2xs transition-colors flex items-center justify-center gap-1"
                          title="Gọi điện ngay"
                        >
                          <Phone className="w-3 h-3 fill-white" /> Gọi
                        </a>
                        <button
                          onClick={(e) => handleCopyPhone(p.id, p.soDienThoai, e)}
                          className={`p-1.5 rounded text-[10px] font-bold uppercase shadow-2xs transition-colors ${
                            isCopied ? 'bg-emerald-800 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                          title="Sao chép SĐT"
                        >
                          {isCopied ? <Check className="w-3 h-3 stroke-[3]" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => onSelectPerson(p)}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-bold text-[10px] uppercase shadow-2xs transition-colors flex items-center justify-center gap-1"
                          title="Chi tiết"
                        >
                          <MessageCircle className="w-3 h-3 text-indigo-600" /> Chi tiết
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};



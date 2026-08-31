import React, { useState } from 'react';
import { Phone, MapPin, Award, MessageCircle, Copy, Check, AlertTriangle } from 'lucide-react';
import { Personnel } from '../types';
import { isBanThuongTruc, isKeyLeader, isDeputyLeader, isPartyOfficial, formatPhoneNumber, getTelLink } from '../utils/helpers';

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
            <tr className="bg-red-950 text-white font-bold uppercase tracking-widest text-[10px] border-b-2 border-amber-500">
              <th className="py-3 px-3 text-center w-12 text-amber-300">STT</th>
              <th className="py-3 px-3">Họ và tên</th>
              <th className="py-3 px-2 text-center w-24">Năm sinh & Giới tính</th>
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
                const isBTT = isBanThuongTruc(p);
                const isLeader = isKeyLeader(p);
                const isDeputy = isDeputyLeader(p);
                const isParty = isPartyOfficial(p);
                const isCopied = copiedId === p.id;

                const gender = p.gender || (p.namSinhNam ? 'Nam' : p.namSinhNu ? 'Nữ' : '');
                const birthYear = p.birthYear || p.namSinhNam || p.namSinhNu || '';

                const phoneList: string[] = p.phones && p.phones.length > 0
                  ? p.phones
                  : p.soDienThoai
                  ? p.soDienThoai.split(/[\/\n,]+/).map(s => s.trim()).filter(Boolean)
                  : [];

                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      isBTT
                        ? 'bg-gradient-to-r from-red-50/80 via-amber-50/70 to-white hover:bg-amber-100 border-l-4 border-amber-500'
                        : isLeader
                        ? 'bg-amber-50/80 hover:bg-amber-100/90 border-l-4 border-amber-500'
                        : isDeputy
                        ? 'bg-red-50/60 hover:bg-red-100/70 border-l-4 border-red-700'
                        : isParty
                        ? 'bg-red-50/80 hover:bg-red-100/90 border-l-4 border-red-800'
                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    {/* STT */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                      {p.stt}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-3">
                      <div className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                        {isBTT ? (
                          <span className="text-amber-600">⭐</span>
                        ) : isLeader ? (
                          <span className="text-amber-600">👑</span>
                        ) : isDeputy ? (
                          <span className="text-red-700">🎖️</span>
                        ) : null}
                        <span>{p.hoTen}</span>
                      </div>
                      {isParty && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-red-900 bg-red-100 px-1.5 py-0.5 rounded border border-red-200 uppercase tracking-wider mt-0.5">
                          {isBTT ? 'Đảng ủy viên' : 'Chi bộ Khu phố'}
                        </span>
                      )}
                    </td>

                    {/* Year of birth & Gender */}
                    <td className="py-3 px-2 text-center text-slate-700 font-semibold text-[11px]">
                      {gender ? (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {gender} {birthYear ? `• ${birthYear}` : ''}
                        </span>
                      ) : birthYear ? (
                        <span>{birthYear}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Front Role */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10.5px] font-bold tracking-tight ${
                          isBTT
                            ? 'bg-gradient-to-r from-red-800 to-amber-600 text-amber-200 border border-amber-400 shadow-2xs'
                            : isLeader
                            ? 'bg-amber-500 text-red-950 border border-amber-400 shadow-2xs'
                            : isDeputy
                            ? 'bg-red-800 text-amber-200 border border-red-900 shadow-2xs'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                      >
                        {isBTT ? <span>⭐</span> : isLeader ? <span>👑</span> : isDeputy ? <span>🎖️</span> : null}
                        {p.chucDanhMatTran?.toUpperCase() === 'TRƯỞNG BAN' 
                          ? 'Trưởng ban' 
                          : p.chucDanhMatTran?.toUpperCase() === 'PHÓ TRƯỞNG BAN' 
                          ? 'Phó Trưởng ban' 
                          : (p.chucDanhMatTran || 'Thành viên')}
                      </span>
                    </td>

                    {/* Other Roles */}
                    <td className="py-3 px-3 text-slate-800 font-medium max-w-xs">
                      {p.chucDanhKhac ? (
                        <div className="flex items-start gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <span className="text-[11px] font-semibold">{p.chucDanhKhac}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    {/* Address */}
                    <td className="py-3 px-3 text-slate-700 max-w-xs">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                        <span className="text-[11px]">{p.diaChi || 'Chưa cập nhật'}</span>
                      </div>
                    </td>

                    {/* Khu phố */}
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {isBTT ? (
                        <span className="px-2 py-0.5 bg-red-900 text-amber-300 rounded text-[10px] font-black uppercase tracking-wider border border-amber-500/40">
                          Ban Thường trực
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-900 text-amber-300 rounded text-[10px] font-bold uppercase border border-amber-500/40">
                          {p.khuPho}
                        </span>
                      )}
                    </td>

                    {/* Phone Number with Direct Calling */}
                    <td className="py-3 px-3 text-center">
                      {phoneList.length === 0 ? (
                        <span className="text-slate-400 italic text-[11px]">Chưa cập nhật</span>
                      ) : (
                        <div className="flex flex-col gap-1 items-center">
                          {phoneList.map((ph, i) => (
                            <a
                              key={i}
                              href={getTelLink(ph)}
                              className="inline-flex items-center gap-1 font-mono font-bold text-slate-900 hover:text-red-700 hover:underline px-1.5 py-0.5 rounded transition-colors text-xs"
                              title={`Bấm để gọi ${ph}`}
                            >
                              <Phone className="w-3 h-3 text-red-600" />
                              <span>{formatPhoneNumber(ph)}</span>
                            </a>
                          ))}
                          {p.dataWarning && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 font-semibold" title={p.dataWarning}>
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-700" /> 9 chữ số
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {phoneList.length > 0 ? (
                          <>
                            <a
                              href={getTelLink(phoneList[0])}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-[10px] uppercase shadow-2xs transition-all flex items-center justify-center gap-1"
                              title="Gọi điện ngay"
                            >
                              <Phone className="w-3 h-3 fill-white" /> Gọi
                            </a>
                            <button
                              onClick={(e) => handleCopyPhone(p.id, phoneList[0], e)}
                              className={`p-1.5 rounded-lg text-[10px] font-black uppercase shadow-2xs transition-all ${
                                isCopied ? 'bg-emerald-800 text-white' : 'bg-red-800 hover:bg-red-900 text-amber-200 border border-red-900'
                              }`}
                              title="Sao chép SĐT"
                            >
                              {isCopied ? <Check className="w-3 h-3 stroke-[3]" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </>
                        ) : null}
                        <button
                          onClick={() => onSelectPerson(p)}
                          className="px-2 py-1 bg-white hover:bg-red-50 text-red-900 border border-red-200 rounded-lg font-bold text-[10px] uppercase shadow-2xs transition-colors flex items-center justify-center gap-1"
                          title="Chi tiết"
                        >
                          <MessageCircle className="w-3 h-3 text-red-700" /> Chi tiết
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

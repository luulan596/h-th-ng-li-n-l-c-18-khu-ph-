/**
 * ==============================================================================
 * MÀN HÌNH TAB 5: TỔNG QUAN & THỐNG KÊ (OVERVIEW VIEW)
 * ==============================================================================
 * Bảng điều khiển phân tích số liệu tổng hợp về nhân sự Mặt trận 18 Khu phố:
 * - Cơ cấu chức danh (Thường trực, Trưởng ban, Phó ban, Thành viên)
 * - Cơ cấu độ tuổi và giới tính (Tỷ lệ Nam/Nữ, nhóm tuổi)
 * - Tỷ lệ Đảng viên / Đại diện Cấp ủy Chi bộ
 * - Cơ cấu tổ chức đoàn thể kiêm nhiệm (Phụ nữ, Cựu chiến binh, Đoàn Thanh niên,...)
 * - Danh sách tiến độ kiện toàn 18 Khu phố
 */

import React, { useMemo } from 'react';
import { Personnel, Headquarters, RedSite } from '../types';
import { isBanThuongTruc, isKeyLeader, isDeputyLeader, isPartyOfficial } from '../utils/helpers';
import { 
  Users, 
  Award, 
  Shield, 
  UserCheck, 
  Star, 
  Landmark, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  MapPin
} from 'lucide-react';

interface OverviewViewProps {
  personnelList: Personnel[];
  headquartersList: Headquarters[];
  redSitesList: RedSite[];
  onSelectKhuPho?: (kp: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  personnelList,
  headquartersList,
  redSitesList,
  onSelectKhuPho,
}) => {
  // Thống kê chức danh
  const stats = useMemo(() => {
    // 1. Xác định tập dữ liệu thống kê (143 cán bộ Khu phố)
    const targetList = personnelList.filter(item => {
      // Loại bỏ 11 người đầu (dựa theo id <= 11 hoặc có khu_pho)
      const idNum = parseInt(String(item.id || '').replace(/\D/g, ''), 10);
      return (idNum > 11 || (!isNaN(idNum) && idNum > 11)) && Boolean(item.khuPho || (item as any).khu_pho);
    });

    const targetTotal = targetList.length || 143;

    const btt = personnelList.filter(isBanThuongTruc).length;
    const truongBan = targetList.filter(isKeyLeader).length;
    const phoBan = targetList.filter(isDeputyLeader).length;
    const capUy = targetList.filter(isPartyOfficial).length;
    const thanhVien = targetTotal - truongBan - phoBan;

    // 2. Tính CƠ CẤU GIỚI TÍNH
    const namCount = targetList.filter(p => {
      const g = String((p as any).gioi_tinh || (p as any).gioiTinh || p.gender || '').trim().toLowerCase();
      return g === 'nam';
    }).length;
    const nuCount = targetTotal - namCount;

    // 3. Tính CƠ CẤU ĐỘ TUỔI
    const currentYear = 2026;
    let ageUnder40 = 0;
    let age40to50 = 0;
    let age50to60 = 0;
    let ageOver60 = 0;

    targetList.forEach(p => {
      const birthYearVal = (p as any).nam_sinh || (p as any).namSinh || p.namSinhNam || p.namSinhNu;
      const birthYear = parseInt(String(birthYearVal || ''), 10);
      if (birthYear && birthYear > 1900) {
        const age = currentYear - birthYear;
        if (age < 40) ageUnder40++;
        else if (age <= 50) age40to50++;
        else if (age <= 60) age50to60++;
        else ageOver60++;
      }
    });

    // Thống kê đoàn thể kiêm nhiệm
    let phuNuCount = 0;
    let ccbCount = 0;
    let doanTnCount = 0;
    let nctCount = 0;
    let ctdCount = 0;

    targetList.forEach((p) => {
      const r = (p.chucDanhKhac || '').toLowerCase();
      if (r.includes('phụ nữ')) phuNuCount++;
      if (r.includes('cựu chiến binh')) ccbCount++;
      if (r.includes('đoàn') || r.includes('thanh niên')) doanTnCount++;
      if (r.includes('người cao tuổi')) nctCount++;
      if (r.includes('chữ thập đỏ')) ctdCount++;
    });

    return {
      total: targetTotal,
      btt,
      truongBan,
      phoBan,
      thanhVien,
      capUy,
      namCount,
      nuCount,
      ageGroups: { ageUnder40, age40to50, age50to60, ageOver60 },
      doanThe: { phuNuCount, ccbCount, doanTnCount, nctCount, ctdCount },
    };
  }, [personnelList]);

  return (
    <div className="space-y-6 pb-12">
      {/* Banner Tiêu đề Tổng quan */}
      <div className="bg-gradient-to-r from-red-950 via-red-900 to-amber-900 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-amber-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-400/40">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>BÁO CÁO SỐ LIỆU TỔNG HỢP</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-sans uppercase tracking-tight text-amber-200">
              BẢNG ĐIỀU HÀNH & THỐNG KÊ NHÂN SỰ MẶT TRẬN
            </h2>
            <p className="text-xs sm:text-sm text-red-100/90 mt-1 max-w-2xl">
              Tổng hợp cơ cấu nhân sự Ban Thường trực UB.MTTQ Việt Nam Phường và Ban Công tác Mặt trận 18 Khu phố phục vụ công tác lãnh đạo, chỉ đạo và báo cáo định kỳ.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-red-950/60 p-3 rounded-xl border border-amber-400/20 shrink-0">
            <div className="text-center px-3 border-r border-red-800">
              <span className="text-2xl font-black text-amber-300">{stats.total}</span>
              <p className="text-[10px] text-red-200 uppercase font-bold">Cán bộ</p>
            </div>
            <div className="text-center px-3 border-r border-red-800">
              <span className="text-2xl font-black text-white">18</span>
              <p className="text-[10px] text-red-200 uppercase font-bold">Khu phố</p>
            </div>
            <div className="text-center px-2">
              <span className="text-2xl font-black text-emerald-400">23</span>
              <p className="text-[10px] text-red-200 uppercase font-bold">Trụ sở</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Thẻ chỉ số chính (KPI Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Thường trực Phường</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-900 mt-2">{stats.btt} cán bộ</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Chủ tịch & 4 Phó Chủ tịch UB.MTTQ VN phường</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Trưởng ban 18 KP</span>
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-800 flex items-center justify-center">
              <Award className="w-4 h-4 text-red-700" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-900 mt-2">{stats.truongBan} / 18 cán bộ</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-red-700 h-full rounded-full" 
              style={{ width: `${Math.min((stats.truongBan / 18) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Phó Trưởng ban 18 KP</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-red-700" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-900 mt-2">{stats.phoBan} cán bộ</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">18 Phó Trưởng ban cơ sở</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Cấp ủy Chi bộ</span>
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-800 flex items-center justify-center">
              <Shield className="w-4 h-4 text-red-700" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-900 mt-2">{stats.capUy} cán bộ</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Tỷ lệ: {Math.round((stats.capUy / (stats.total || 1)) * 100)}% trên tổng số cán bộ thực tế</p>
        </div>
      </div>

      {/* Cơ cấu Giới tính & Độ tuổi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Khối Giới tính */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-red-700" />
              <h3 className="text-sm font-bold text-slate-900 uppercase">Cơ cấu Giới tính</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Tổng số: {stats.total}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200/80">
              <div className="text-xs font-bold text-blue-900 uppercase text-center">Nam giới</div>
              <div className="text-2xl font-black text-blue-950 mt-1 text-center">{stats.namCount}</div>
              <div className="text-[11px] text-blue-700 font-semibold mt-0.5 text-center">
                {Math.round((stats.namCount / (stats.total || 1)) * 100)}%
              </div>
            </div>

            <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200/80">
              <div className="text-xs font-bold text-rose-900 uppercase text-center">Nữ giới</div>
              <div className="text-2xl font-black text-rose-950 mt-1 text-center">{stats.nuCount}</div>
              <div className="text-[11px] text-rose-700 font-semibold mt-0.5 text-center">
                {Math.round((stats.nuCount / (stats.total || 1)) * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* Khối Độ tuổi */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900 uppercase">Cơ cấu Độ tuổi</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Biểu đồ nhóm tuổi</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {[
              { label: 'Dưới 40 tuổi', count: stats.ageGroups.ageUnder40, color: 'bg-emerald-500' },
              { label: 'Từ 40 - 50 tuổi', count: stats.ageGroups.age40to50, color: 'bg-blue-500' },
              { label: 'Từ 51 - 60 tuổi', count: stats.ageGroups.age50to60, color: 'bg-amber-500' },
              { label: 'Trên 60 tuổi', count: stats.ageGroups.ageOver60, color: 'bg-red-500' },
            ].map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-600">{group.label}</span>
                  <span className="text-slate-900">{group.count} Đ/c ({Math.round((group.count / (stats.total || 1)) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`${group.color} h-full rounded-full`} 
                    style={{ width: `${(group.count / (stats.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Khối Đoàn thể kiêm nhiệm */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase">Kiêm nhiệm Đoàn thể Cơ sở</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Phối hợp liên tịch</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 uppercase">Phụ nữ</span>
            <span className="font-black text-red-900">{stats.doanThe.phuNuCount}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 uppercase">Cựu chiến binh</span>
            <span className="font-black text-red-900">{stats.doanThe.ccbCount}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 uppercase">Đoàn Thanh niên</span>
            <span className="font-black text-red-900">{stats.doanThe.doanTnCount}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 uppercase">NCT & CTĐ</span>
            <span className="font-black text-red-900">{stats.doanThe.nctCount + stats.doanThe.ctdCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

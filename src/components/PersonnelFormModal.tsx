import React, { useState, useEffect } from 'react';
import { X, Save, UserPlus, Shield, Award } from 'lucide-react';
import { Personnel } from '../types';

interface PersonnelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (person: Personnel) => void;
  editingPersonnel: Personnel | null;
  availableKhuPhoList: string[];
}

export const PersonnelFormModal: React.FC<PersonnelFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPersonnel,
  availableKhuPhoList,
}) => {
  const [formData, setFormData] = useState<Partial<Personnel>>({
    khuPho: 'Khu phố 1',
    hoTen: '',
    namSinhNam: '',
    namSinhNu: '',
    chucDanhMatTran: 'Thành viên',
    chucDanhKhac: '',
    diaChi: '',
    soDienThoai: '',
    isCapUy: false,
  });

  useEffect(() => {
    if (editingPersonnel) {
      setFormData(editingPersonnel);
    } else {
      setFormData({
        khuPho: 'Khu phố 1',
        hoTen: '',
        namSinhNam: '',
        namSinhNu: '',
        chucDanhMatTran: 'Thành viên',
        chucDanhKhac: '',
        diaChi: '',
        soDienThoai: '',
        isCapUy: false,
      });
    }
  }, [editingPersonnel, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hoTen || !formData.soDienThoai) {
      alert('Vui lòng nhập Họ tên và Số điện thoại!');
      return;
    }

    const newPersonnel: Personnel = {
      id: editingPersonnel ? editingPersonnel.id : `kp_${Date.now()}`,
      stt: editingPersonnel ? editingPersonnel.stt : Math.floor(Math.random() * 100) + 1,
      khuPho: formData.khuPho || 'Khu phố 1',
      hoTen: formData.hoTen || '',
      namSinhNam: formData.namSinhNam || '',
      namSinhNu: formData.namSinhNu || '',
      chucDanhMatTran: formData.chucDanhMatTran || 'Thành viên',
      chucDanhKhac: formData.chucDanhKhac || '',
      diaChi: formData.diaChi || '',
      soDienThoai: formData.soDienThoai || '',
      isCapUy: !!formData.isCapUy,
    };

    onSave(newPersonnel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-indigo-950 p-4 text-white flex items-center justify-between border-b border-indigo-900">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              {editingPersonnel ? 'CẬP NHẬT THÔNG TIN NHÂN SỰ' : 'THÊM NHÂN SỰ MỚI VÀO DANH BẠ'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded bg-white/10 text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs sm:text-sm">
          
          <div className="grid grid-cols-2 gap-3">
            {/* Khu Phố */}
            <div>
              <label className="block font-bold uppercase text-[10px] tracking-wider text-slate-700 mb-1">Khu phố (*)</label>
              <select
                value={formData.khuPho}
                onChange={(e) => setFormData({ ...formData, khuPho: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-none text-xs font-medium"
              >
                {availableKhuPhoList.map((kp) => (
                  <option key={kp} value={kp}>{kp}</option>
                ))}
              </select>
            </div>

            {/* Chức danh Mặt Trận */}
            <div>
              <label className="block font-bold uppercase text-[10px] tracking-wider text-slate-700 mb-1">Chức danh Mặt trận (*)</label>
              <select
                value={formData.chucDanhMatTran}
                onChange={(e) => setFormData({ ...formData, chucDanhMatTran: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-none text-xs font-bold"
              >
                <option value="Trưởng ban">👑 Trưởng ban</option>
                <option value="Phó Trưởng ban">⭐ Phó Trưởng ban</option>
                <option value="Thành viên">Thành viên</option>
              </select>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block font-bold uppercase text-[10px] tracking-wider text-slate-700 mb-1">Họ và tên (*)</label>
            <input
              type="text"
              required
              value={formData.hoTen}
              onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
              placeholder="VD: Nguyễn Văn An"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-none text-xs font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Year of Birth - Male */}
            <div>
              <label className="block font-bold uppercase text-[10px] tracking-wider text-slate-700 mb-1">Năm sinh (Nam)</label>
              <input
                type="number"
                value={formData.namSinhNam || ''}
                onChange={(e) => setFormData({ ...formData, namSinhNam: e.target.value })}
                placeholder="VD: 1968"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-none text-xs"
              />
            </div>

            {/* Year of Birth - Female */}
            <div>
              <label className="block font-bold uppercase text-[10px] tracking-wider text-slate-700 mb-1">Năm sinh (Nữ)</label>
              <input
                type="number"
                value={formData.namSinhNu || ''}
                onChange={(e) => setFormData({ ...formData, namSinhNu: e.target.value })}
                placeholder="VD: 1970"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block font-bold uppercase text-[10px] tracking-wider text-slate-700 mb-1">Số điện thoại (*)</label>
            <input
              type="tel"
              required
              value={formData.soDienThoai}
              onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
              placeholder="VD: 0908808419"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs focus:border-indigo-600 focus:outline-none"
            />
          </div>

          {/* Other Roles */}
          <div>
            <label className="block font-bold uppercase text-[10px] tracking-wider text-slate-700 mb-1">Các chức danh kiêm nhiệm khác</label>
            <input
              type="text"
              value={formData.chucDanhKhac}
              onChange={(e) => setFormData({ ...formData, chucDanhKhac: e.target.value })}
              placeholder="VD: Chi hội Trưởng Chi hội Cựu chiến binh / Bí thư Chi đoàn..."
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-none text-xs"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block font-bold uppercase text-[10px] tracking-wider text-slate-700 mb-1">Địa chỉ cư trú</label>
            <input
              type="text"
              value={formData.diaChi}
              onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
              placeholder="VD: 1378/39 Võ Văn Kiệt"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-none text-xs"
            />
          </div>

          {/* Is Cap Uy Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isCapUy"
              checked={formData.isCapUy}
              onChange={(e) => setFormData({ ...formData, isCapUy: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
            />
            <label htmlFor="isCapUy" className="font-bold text-red-700 text-xs flex items-center gap-1 cursor-pointer">
              <span>🏛️</span> Là Đại diện Cấp ủy Chi bộ Khu phố
            </label>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold uppercase"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 shadow"
            >
              <Save className="w-4 h-4" />
              <span>{editingPersonnel ? 'Lưu thay đổi' : 'Thêm vào danh bạ'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

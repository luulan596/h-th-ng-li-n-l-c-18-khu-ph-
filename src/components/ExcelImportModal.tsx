import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, X, Download, RefreshCw, Trash2, ArrowRight, AlertTriangle, Users } from 'lucide-react';
import { Personnel } from '../types';
import { removeVietnameseTones, isKeyLeader, isDeputyLeader } from '../utils/helpers';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newPersonnel: Personnel[], mode: 'replace' | 'append') => void;
  onResetToDefault: () => void;
  currentCount: number;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  onResetToDefault,
  currentCount,
}) => {
  const [parsedData, setParsedData] = useState<Personnel[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process raw 2D array of rows from Excel/CSV
  const processRawRows = (rows: any[][], name: string) => {
    try {
      if (!rows || rows.length < 2) {
        setErrorMessage('File Excel không có đủ dữ liệu (cần ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu).');
        return;
      }

      // Find header row (the first row with string text matching keywords)
      let headerRowIndex = -1;
      for (let r = 0; r < Math.min(rows.length, 10); r++) {
        const rowStr = rows[r].map((c) => String(c || '').toLowerCase()).join(' ');
        if (
          rowStr.includes('họ') ||
          rowStr.includes('ten') ||
          rowStr.includes('tên') ||
          rowStr.includes('khu phố') ||
          rowStr.includes('khu pho') ||
          rowStr.includes('điện thoại') ||
          rowStr.includes('sđt') ||
          rowStr.includes('sdt')
        ) {
          headerRowIndex = r;
          break;
        }
      }

      if (headerRowIndex === -1) {
        headerRowIndex = 0; // Default to row 0 if not found
      }

      const headers = rows[headerRowIndex].map((h) => removeVietnameseTones(String(h || '')).toLowerCase().trim());

      // Helper to find column index
      const findColIdx = (keywords: string[]): number => {
        return headers.findIndex((h) => keywords.some((kw) => h.includes(kw)));
      };

      const sttIdx = findColIdx(['stt', 'so tt', 'tt']);
      const hoTenIdx = findColIdx(['ho va ten', 'ho ten', 'ho & ten', 'ten', 'can bo']);
      const sdtIdx = findColIdx(['so dien thoai', 'dien thoai', 'sdt', 'so dt', 'phone', 'lien he']);
      const khuPhoIdx = findColIdx(['khu pho', 'kp', 'to dan pho', 'don vi']);
      const chucDanhIdx = findColIdx(['chuc danh mat tran', 'chuc danh', 'chuc vu mat tran', 'nhiem vu']);
      const chucDanhKhacIdx = findColIdx(['chuc danh kiem nhiem', 'kiem nhiem', 'chuc danh khac', 'doan the', 'to chuc', 'chuc vu khac']);
      const capUyIdx = findColIdx(['cap uy', 'dang vien', 'chi uy', 'la cap uy']);
      const diaChiIdx = findColIdx(['dia chi cu tru', 'dia chi', 'noi o', 'dia chi nha', 'cu tru']);
      const namSinhNamIdx = findColIdx(['nam sinh nam', 'sinh nam nam', 'nam sinh']);
      const namSinhNuIdx = findColIdx(['nam sinh nu', 'sinh nam nu', 'sinh nu']);

      if (hoTenIdx === -1) {
        setErrorMessage('Không tìm thấy cột Họ và Tên trong file. Vui lòng kiểm tra lại dòng tiêu đề (Header).');
        return;
      }

      const result: Personnel[] = [];
      let currentKhuPho = 'Khu phố 1';

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const rawName = String(row[hoTenIdx] || '').trim();
        if (!rawName) continue;

        // Skip category divider rows (e.g. "KHU PHỐ 1", "I. KHU PHỐ 2")
        const normalizedName = removeVietnameseTones(rawName).toUpperCase();
        if (
          normalizedName.startsWith('KHU PHO') ||
          normalizedName.startsWith('BAN CONG TAC') ||
          normalizedName.startsWith('DANH SACH')
        ) {
          const kpMatch = rawName.match(/\d+/);
          if (kpMatch) {
            currentKhuPho = `Khu phố ${kpMatch[0]}`;
          }
          continue;
        }

        // 1. Get Khu Pho
        let rowKhuPho = khuPhoIdx !== -1 ? String(row[khuPhoIdx] || '').trim() : '';
        if (!rowKhuPho) {
          rowKhuPho = currentKhuPho;
        } else {
          // Standardize Khu phố format (e.g. "1" -> "Khu phố 1", "KP1" -> "Khu phố 1")
          const numMatch = rowKhuPho.match(/\d+/);
          if (numMatch) {
            rowKhuPho = `Khu phố ${numMatch[0]}`;
            currentKhuPho = rowKhuPho;
          }
        }

        // 2. Gender & BirthYear determination
        const rawNam = namSinhNamIdx !== -1 ? String(row[namSinhNamIdx] || '').trim() : '';
        const rawNu = namSinhNuIdx !== -1 ? String(row[namSinhNuIdx] || '').trim() : '';

        let gender: 'Nam' | 'Nữ' | '' = '';
        let birthYear = '';

        if (rawNam) {
          gender = 'Nam';
          birthYear = rawNam;
        } else if (rawNu) {
          gender = 'Nữ';
          birthYear = rawNu;
        }

        // 3. Phone Number parsing (Must be string, support multi-phone, handle 9-digit warning, handle empty)
        let rawPhone = sdtIdx !== -1 ? String(row[sdtIdx] || '').trim() : '';
        let phones: string[] = [];
        let dataWarning: string | undefined = undefined;

        if (rawPhone) {
          // Check if multiple phone numbers exist in cell
          const parts = rawPhone.split(/[\/\n,;]+/).map((s) => s.trim()).filter(Boolean);
          
          if (parts.length > 1) {
            phones = parts.map((p) => {
              const digits = p.replace(/\D/g, '');
              return digits.length === 9 && !digits.startsWith('0') ? '0' + digits : digits || p;
            });
            rawPhone = phones.join(' / ');
          } else {
            const single = parts[0] || rawPhone;
            const digits = single.replace(/\D/g, '');
            
            // Check 9 digits special case (e.g. Trần Thanh Lâm - KP2 with 784322394)
            if (digits.length === 9 && !digits.startsWith('0')) {
              dataWarning = 'Số điện thoại nguồn chỉ có 9 chữ số, cần kiểm tra số 0 đầu.';
              rawPhone = digits;
              phones = [digits];
            } else if (digits) {
              rawPhone = digits;
              phones = [digits];
            }
          }
        }

        // 4. Cap uy check
        let isCapUy = false;
        const chucDanhKhac = chucDanhKhacIdx !== -1 ? String(row[chucDanhKhacIdx] || '').trim() : '';
        const cdKhacNorm = removeVietnameseTones(chucDanhKhac).toLowerCase();
        if (
          cdKhacNorm.includes('chi uy') ||
          cdKhacNorm.includes('cap uy') ||
          cdKhacNorm.includes('bi thu') ||
          cdKhacNorm.includes('pho bi thu')
        ) {
          isCapUy = true;
        }

        if (capUyIdx !== -1) {
          const capUyVal = removeVietnameseTones(String(row[capUyIdx] || '')).toLowerCase();
          if (
            capUyVal.includes('co') ||
            capUyVal.includes('chi uy') ||
            capUyVal.includes('bi thu') ||
            capUyVal.includes('x') ||
            capUyVal === '1'
          ) {
            isCapUy = true;
          }
        }

        const person: Personnel = {
          id: `excel-kp-${currentKhuPho.replace(/\D/g, '') || '1'}-${i}-${Math.random().toString(36).substr(2, 6)}`,
          stt: sttIdx !== -1 && !isNaN(Number(row[sttIdx])) ? Number(row[sttIdx]) : result.length + 1,
          hoTen: rawName,
          khuPho: rowKhuPho || '',
          soDienThoai: rawPhone,
          phones: phones.length > 0 ? phones : undefined,
          chucDanhMatTran: chucDanhIdx !== -1 ? String(row[chucDanhIdx] || '').trim() : 'Thành viên',
          chucDanhKhac: chucDanhKhac,
          diaChi: diaChiIdx !== -1 ? String(row[diaChiIdx] || '').trim() : '',
          isCapUy: isCapUy,
          gender: gender,
          birthYear: birthYear,
          namSinhNam: rawNam || undefined,
          namSinhNu: rawNu || undefined,
          dataWarning: dataWarning,
        };

        result.push(person);
      }

      if (result.length === 0) {
        setErrorMessage('Không đọc được dòng dữ liệu hợp lệ nào từ file. Vui lòng kiểm tra lại nội dung file Excel.');
        return;
      }

      setParsedData(result);
      setFileName(name);
      setErrorMessage('');
    } catch (err: any) {
      console.error('Lỗi khi phân tích file Excel:', err);
      setErrorMessage(`Lỗi xử lý file: ${err.message || 'Không thể đọc định dạng'}`);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    setIsLoading(true);
    setErrorMessage('');

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Find sheet 'thông tin liên hệ' or fallback to first sheet
        let targetSheetName = workbook.SheetNames[0];
        for (const sName of workbook.SheetNames) {
          const norm = removeVietnameseTones(sName).toLowerCase().trim();
          if (norm.includes('thong tin') || norm.includes('lien he') || norm.includes('danh ba')) {
            targetSheetName = sName;
            break;
          }
        }

        const worksheet = workbook.Sheets[targetSheetName];
        const jsonSheet = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        processRawRows(jsonSheet, file.name);
      } catch (err: any) {
        console.error('Lỗi đọc file Excel:', err);
        setErrorMessage('Không thể đọc file Excel. Vui lòng kiểm tra định dạng .xlsx, .xls hoặc .csv.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (parsedData.length === 0) return;
    onImport(parsedData, importMode);
    onClose();
  };

  // Calculate parsed stats
  const distinctKP = new Set(parsedData.map((p) => p.khuPho)).size;
  const truongBanCount = parsedData.filter(isKeyLeader).length;
  const phoBanCount = parsedData.filter(isDeputyLeader).length;
  const thanhVienCount = parsedData.length - truongBanCount - phoBanCount;
  const namCount = parsedData.filter((p) => p.gender === 'Nam' || Boolean(p.namSinhNam)).length;
  const nuCount = parsedData.filter((p) => p.gender === 'Nữ' || Boolean(p.namSinhNu)).length;
  const noPhoneCount = parsedData.filter((p) => !p.soDienThoai).length;
  const warningsCount = parsedData.filter((p) => Boolean(p.dataWarning)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-emerald-900 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-700/80 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base font-bold">Nhập danh bạ từ File Excel / CSV</h3>
              <p className="text-xs text-emerald-200">Tự động nhận diện 18 Khu phố, chức danh, giới tính và số điện thoại</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* File Upload Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              parsedData.length > 0
                ? 'border-emerald-400 bg-emerald-50/40'
                : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
            
            <div className="flex flex-col items-center justify-center gap-2">
              <UploadCloud className={`w-10 h-10 ${parsedData.length > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div className="text-sm font-semibold text-slate-700">
                {isLoading ? (
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang đọc dữ liệu...
                  </span>
                ) : fileName ? (
                  <span className="text-emerald-800 font-bold">{fileName}</span>
                ) : (
                  <>
                    <span>Kéo thả file Excel (.xlsx, .xls) hoặc CSV vào đây</span>
                    <p className="text-xs font-normal text-slate-500 mt-0.5">hoặc bấm để duyệt file từ máy tính</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Validation & Statistics Breakdown */}
          {parsedData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kết quả phân tích ({parsedData.length} cán bộ)
                </span>
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng nạp vào WebApp
                </span>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Tổng số</div>
                  <div className="text-sm font-black text-slate-900">{parsedData.length}</div>
                </div>
                <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                  <div className="text-indigo-700 text-[10px] uppercase font-bold">Khu phố</div>
                  <div className="text-sm font-black text-indigo-900">{distinctKP}</div>
                </div>
                <div className="bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <div className="text-amber-700 text-[10px] uppercase font-bold">Trưởng ban</div>
                  <div className="text-sm font-black text-amber-900">{truongBanCount}</div>
                </div>
                <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                  <div className="text-slate-700 text-[10px] uppercase font-bold">Phó ban</div>
                  <div className="text-sm font-black text-slate-900">{phoBanCount}</div>
                </div>
                <div className="bg-sky-50 p-2 rounded-lg border border-sky-100">
                  <div className="text-sky-700 text-[10px] uppercase font-bold">Nam / Nữ</div>
                  <div className="text-xs font-bold text-sky-900">{namCount} / {nuCount}</div>
                </div>
                <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                  <div className="text-emerald-700 text-[10px] uppercase font-bold">Thành viên</div>
                  <div className="text-sm font-black text-emerald-900">{thanhVienCount}</div>
                </div>
              </div>

              {/* Special Warnings if any */}
              {(noPhoneCount > 0 || warningsCount > 0) && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                  {noPhoneCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Có <strong>{noPhoneCount}</strong> cán bộ chưa có số điện thoại (hiển thị "Chưa cập nhật").</span>
                    </div>
                  )}
                  {warningsCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Có <strong>{warningsCount}</strong> cán bộ có số điện thoại nguồn 9 chữ số (đã gắn ghi chú cảnh báo).</span>
                    </div>
                  )}
                </div>
              )}

              {/* Import Mode Selection */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                  Chế độ cập nhật
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    onClick={() => setImportMode('replace')}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold">Thay thế toàn bộ ({parsedData.length} cán bộ)</div>
                      <div className="text-[11px] text-slate-500">Xóa dữ liệu cũ, chỉ giữ danh sách mới từ file Excel.</div>
                    </div>
                  </label>

                  <label
                    onClick={() => setImportMode('append')}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      importMode === 'append'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold">Bổ sung vào danh sách</div>
                      <div className="text-[11px] text-slate-500">Giữ {currentCount} cán bộ hiện tại và thêm cán bộ mới.</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="p-2">Họ và tên</th>
                      <th className="p-2">Khu phố</th>
                      <th className="p-2">Chức danh</th>
                      <th className="p-2">Năm sinh</th>
                      <th className="p-2">SĐT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.slice(0, 8).map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-medium text-slate-900">{p.hoTen}</td>
                        <td className="p-2 text-slate-600">{p.khuPho}</td>
                        <td className="p-2 text-slate-600">{p.chucDanhMatTran}</td>
                        <td className="p-2 text-slate-600">{p.gender} {p.birthYear}</td>
                        <td className="p-2 font-mono text-slate-800">{p.soDienThoai || <span className="text-slate-400 italic">Chưa có</span>}</td>
                      </tr>
                    ))}
                    {parsedData.length > 8 && (
                      <tr>
                        <td colSpan={5} className="p-2 text-center text-slate-400 italic text-[11px]">
                          ... và {parsedData.length - 8} cán bộ khác
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={onResetToDefault}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
            title="Khôi phục danh sách mặc định"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Khôi phục mẫu gốc</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Đóng
            </button>

            <button
              onClick={handleConfirmImport}
              disabled={parsedData.length === 0}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all ${
                parsedData.length > 0
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-95'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Cập nhật vào ứng dụng ({parsedData.length})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

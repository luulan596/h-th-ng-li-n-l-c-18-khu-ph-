import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, RefreshCw, X, ShieldAlert, CheckCircle2, FileSpreadsheet, Code, Play } from 'lucide-react';
import { SyncStatus } from '../types';
import { GOOGLE_APPS_SCRIPT_SAMPLE_CODE } from '../data/initialData';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: SyncStatus;
  onSaveUrl: (url: string) => void;
  onSyncNow: () => Promise<void>;
  onPushAll?: () => Promise<void>;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  isOpen,
  onClose,
  syncStatus,
  onSaveUrl,
  onSyncNow,
  onPushAll,
}) => {
  const [urlInput, setUrlInput] = useState(syncStatus.webAppUrl || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedHeaders, setCopiedHeaders] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [pushingAll, setPushingAll] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_SAMPLE_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyHeaders = () => {
    const headers = "STT\tHọ và tên\tNăm sinh Nam\tNăm sinh Nữ\tChức danh dự kiến trong Ban CT Mặt trận\tCác chức danh dự kiến khác\tĐịa chỉ thực tế cư trú\tSố điện thoại\tKhu phố";
    navigator.clipboard.writeText(headers);
    setCopiedHeaders(true);
    setTimeout(() => setCopiedHeaders(false), 2000);
  };

  const handleTestAndSave = async () => {
    if (!urlInput.trim()) {
      setTestResult({ success: false, message: 'Vui lòng nhập đường dẫn Web App URL của Google Apps Script' });
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    try {
      const res = await fetch(urlInput.trim(), { method: 'GET' });
      const data = await res.json();
      if (data && (data.status === 'success' || Array.isArray(data.data))) {
        setTestResult({
          success: true,
          message: `Kết nối thành công! Đã tìm thấy ${data.total || data.data?.length || 0} dòng dữ liệu từ Google Sheet.`,
        });
        onSaveUrl(urlInput.trim());
      } else {
        setTestResult({
          success: false,
          message: 'Phản hồi từ Google Apps Script không đúng định dạng JSON kỳ vọng.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Không thể truy cập Web App URL. Hãy đảm bảo bạn chọn "Anyone" (Bất kỳ ai) khi Deploy Apps Script.',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header Header */}
        <div className="bg-indigo-950 p-4 text-white flex items-center justify-between border-b border-indigo-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-white rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">KẾT NỐI GOOGLE SHEET VÀ APPS SCRIPT</h3>
              <p className="text-xs text-indigo-200">
                Lưu trữ & đồng bộ dữ liệu trực tiếp với file Google Sheet của cơ quan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800 text-xs sm:text-sm">
          
          {/* Section 1: Enter Web App URL */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-indigo-950 text-amber-400 flex items-center justify-center text-xs font-bold">1</span>
              Nhập Google Apps Script Web App URL
            </h4>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:border-indigo-600 focus:outline-none"
              />
              <button
                onClick={handleTestAndSave}
                disabled={testingConnection}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow shrink-0"
              >
                {testingConnection ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                <span>Kiểm tra & Lưu</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg flex items-start gap-2 text-xs font-medium ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-50 text-rose-900 border border-rose-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Section 2: Instructions & Template Headers */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-indigo-950 text-amber-400 flex items-center justify-center text-xs font-bold">2</span>
              Hướng dẫn thiết lập Google Sheet & Apps Script trong 3 bước:
            </h4>

            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 font-medium bg-amber-50/60 p-4 rounded-xl border border-amber-200">
              <li>
                <strong>Tạo Google Sheet mới</strong> và copy tiêu đề cột bằng cách nhấn nút dưới đây, sau đó dán vào Dòng 1 của Sheet:
                <div className="mt-2">
                  <button
                    onClick={handleCopyHeaders}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wider rounded-lg text-xs inline-flex items-center gap-1.5 shadow-sm"
                  >
                    {copiedHeaders ? <Check className="w-3.5 h-3.5" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                    <span>{copiedHeaders ? 'Đã copy Tiêu đề Cột!' : 'Copy Tiêu đề Cột chuẩn Google Sheet'}</span>
                  </button>
                </div>
              </li>

              <li className="pt-2">
                Trên Google Sheet, chọn menu <strong>Tiện ích mở rộng (Extensions) &gt; Apps Script</strong>, dán toàn bộ đoạn mã bên dưới vào file <code>Code.gs</code>.
              </li>

              <li className="pt-2">
                Nhấn <strong>Deploy (Triển khai) &gt; New deployment (Triển khai mới)</strong>:
                <ul className="list-disc list-inside ml-4 mt-1 text-[11px] text-slate-600 space-y-0.5">
                  <li>Chọn loại: <strong>Web App</strong></li>
                  <li>Execute as: <strong>Me (Tôi)</strong></li>
                  <li>Who has access: <strong>Anyone (Bất kỳ ai)</strong> ⭐ <em>(Quan trọng để web app gọi điện & tra cứu dữ liệu không bị lỗi CORS)</em></li>
                </ul>
              </li>
            </ol>
          </div>

          {/* Section 3: Copyable Code.gs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-4 h-4 text-indigo-600" /> Mã nguồn Google Apps Script (Code.gs)
              </h4>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1 bg-indigo-950 hover:bg-indigo-900 text-amber-300 font-bold uppercase text-[10px] tracking-wider rounded inline-flex items-center gap-1"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Đã sao chép mã!' : 'Sao chép mã Apps Script'}</span>
              </button>
            </div>

            <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] max-h-48 overflow-y-auto border border-slate-800">
              <pre>{GOOGLE_APPS_SCRIPT_SAMPLE_CODE}</pre>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Trạng thái hiện tại: <strong className={syncStatus.isConnected ? 'text-emerald-700' : 'text-amber-700'}>
              {syncStatus.isConnected ? 'Đang dùng dữ liệu từ Google Sheet' : 'Đang dùng dữ liệu mặc định (18 Khu phố)'}
            </strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold uppercase"
            >
              Đóng
            </button>
            {syncStatus.isConnected && (
              <>
                {onPushAll && (
                  <button
                    onClick={async () => {
                      setPushingAll(true);
                      await onPushAll();
                      setPushingAll(false);
                      onClose();
                    }}
                    disabled={pushingAll}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow"
                    title="Ghi đè toàn bộ danh sách hiện tại lên Google Sheet"
                  >
                    {pushingAll ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                    <span>{pushingAll ? 'Đang đẩy...' : 'Khởi tạo dữ liệu lên Sheet'}</span>
                  </button>
                )}
                <button
                  onClick={async () => {
                    await onSyncNow();
                    onClose();
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tải từ Sheet</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

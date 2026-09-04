/**
 * ==============================================================================
 * TẦNG DỮ LIỆU (DATA ACCESS LAYER) - DOCUMENT SERVICE
 * ==============================================================================
 * Quản lý danh sách Văn bản & Hướng dẫn công tác Mặt trận.
 * Kết nối Supabase (bảng `documents`) với kho Google Drive chính thức.
 * Hỗ trợ bộ nhớ đệm (localStorage) an toàn khi offline hoặc chưa tạo bảng.
 */

import { getSupabase } from './supabaseClient';

export const OFFICIAL_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1EnGDeaHHViCFUFAwYAksB9FeQ6TT9c3K?usp=sharing';

/**
 * Trích xuất URL tải xuống trực tiếp từ Google Drive (nếu là link file) hoặc trả về link Drive
 */
export function getGoogleDriveDownloadUrl(url?: string): string {
  if (!url) return OFFICIAL_DRIVE_FOLDER_URL;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url;
}

export interface OfficialDocument {
  id: string;
  code: string;
  title: string;
  issueDate: string; // release_date / issue_date (YYYY-MM-DD hoặc DD/MM/YYYY)
  agency: string;
  summary: string;
  category: string;
  driveUrl?: string; // download_url / file_url / drive_url (Google Drive link)
  highlights?: string[];
  isNew?: boolean;
  created_at?: string;
}

export const INITIAL_DOCUMENTS: OfficialDocument[] = [
  {
    id: 'doc-new-1',
    code: 'Kế hoạch số 12/KH-MTTQ',
    title: 'Kế hoạch tổ chức Ngày hội Đại đoàn kết toàn dân tộc ở 18 Khu phố năm 2026',
    issueDate: '02/09/2026',
    agency: 'Ban Thường trực UB.MTTQ VN Phường Bình Tiên',
    summary: 'Kế hoạch phát động cao điểm thi đua và tổ chức Ngày hội Đại đoàn kết gắn với bữa cơm ấm tình đoàn kết tại địa bàn dân cư.',
    category: 'Phong trào',
    driveUrl: OFFICIAL_DRIVE_FOLDER_URL,
    isNew: true,
    highlights: [
      'Tổ chức trang trọng, tiết kiệm, thực chất và thu hút đông đảo nhân dân 18 khu phố',
      'Biểu dương các gia đình văn hóa, người tốt việc tốt và gương điển hình Mặt trận cơ sở',
      'Tổ chức bữa cơm đại đoàn kết và các trò chơi dân gian gắn kết tình làng nghĩa xóm'
    ]
  },
  {
    id: 'doc-3',
    code: 'Hướng dẫn số 01/HD-MTTQ',
    title: 'Quy trình kiện toàn Trưởng, Phó Ban Công tác Mặt trận Khu phố nhiệm kỳ 2024 - 2029',
    issueDate: '15/01/2025',
    agency: 'Ban Thường trực UB.MTTQ VN Phường Bình Tiên',
    summary: 'Hướng dẫn tiêu chuẩn nhân sự, quy trình hiệp thương giới thiệu và chuẩn y nhân sự Ban CTMT 18 Khu phố.',
    category: 'Hướng dẫn nghiệp vụ',
    driveUrl: OFFICIAL_DRIVE_FOLDER_URL,
    isNew: true,
    highlights: [
      'Tiêu chuẩn: Cán bộ có uy tín, nhiệt tình, có tinh thần trách nhiệm cao với cộng đồng',
      'Quy trình 3 bước: Chi bộ giới thiệu -> Hiệp thương khu phố -> Thường trực Phường chuẩn y',
      'Bảo đảm tỷ lệ cấp ủy chi bộ tham gia lãnh đạo công tác Mặt trận cơ sở'
    ]
  },
  {
    id: 'doc-1',
    code: 'Luật số 10/2022/QH15',
    title: 'Luật Thực hiện Dân chủ ở cơ sở năm 2022',
    issueDate: '10/11/2022',
    agency: 'Quốc hội nước CHXHCN Việt Nam',
    summary: 'Quy định nội dung, cách thức thực hiện dân chủ ở cơ sở, quyền và nghĩa vụ của công dân, trách nhiệm của Ban Công tác Mặt trận.',
    category: 'Luật pháp',
    driveUrl: OFFICIAL_DRIVE_FOLDER_URL,
    isNew: false,
    highlights: [
      'Công khai, minh bạch các khoản đóng góp tự nguyện của nhân dân',
      'Nhân dân bàn và quyết định trực tiếp các công trình phúc lợi cộng đồng',
      'Phát huy vai trò của Ban Thanh tra nhân dân và Ban Giám sát đầu tư của cộng đồng'
    ]
  },
  {
    id: 'doc-2',
    code: 'Điều lệ MTTQ VN (Khóa IX)',
    title: 'Điều lệ Mặt trận Tổ quốc Việt Nam',
    issueDate: '20/09/2019',
    agency: 'Đại hội Đại biểu Toàn quốc MTTQ Việt Nam',
    summary: 'Xác định vị trí, vai trò, nguyên tắc hiệp thương dân chủ và tổ chức của Ban Công tác Mặt trận ở khu phố.',
    category: 'Điều lệ',
    driveUrl: OFFICIAL_DRIVE_FOLDER_URL,
    isNew: false,
    highlights: [
      'Ban Công tác Mặt trận do Ban Thường trực UB.MTTQ cấp xã ra quyết định thành lập',
      'Cơ cấu gồm Trưởng ban, Phó Trưởng ban và đại diện các chi hội đoàn thể khu phố',
      'Phối hợp với Trưởng khu phố tổ chức các cuộc vận động, phong trào thi đua yêu nước'
    ]
  },
  {
    id: 'doc-4',
    code: 'Thông tri số 25/TT-MTTW-BTT',
    title: 'Hướng dẫn tổ chức Ngày hội Đại đoàn kết toàn dân tộc ở khu dân cư',
    issueDate: '10/08/2023',
    agency: 'Ủy ban Trung ương MTTQ Việt Nam',
    summary: 'Quy định chi tiết khung chương trình phần Lễ và phần Hội nhân dịp kỷ niệm Ngày Truyền thống MTTQ Việt Nam (18/11 hàng năm).',
    category: 'Thông tri',
    driveUrl: OFFICIAL_DRIVE_FOLDER_URL,
    isNew: false,
    highlights: [
      'Tổ chức trang trọng, tiết kiệm, thực chất và thu hút đông đảo nhân dân',
      'Đánh giá kết quả 01 năm thực hiện các phong trào thi đua yêu nước ở khu dân cư',
      'Tặng quà cho các hộ gia đình chính sách, hộ cận nghèo và các hoàn cảnh khó khăn'
    ]
  },
  {
    id: 'doc-5',
    code: 'Mẫu 01/BB-CTMT',
    title: 'Biên bản Hội nghị hiệp thương Ban Công tác Mặt trận Khu phố nhiệm kỳ 2024 - 2029',
    issueDate: '18/01/2025',
    agency: 'Ban Thường trực UB.MTTQ VN Phường Bình Tiên',
    summary: 'Mẫu biên bản chuẩn phục vụ công tác hiệp thương, bầu chọn và kiện toàn nhân sự Ban Công tác Mặt trận 18 Khu phố.',
    category: 'Biểu mẫu',
    driveUrl: OFFICIAL_DRIVE_FOLDER_URL,
    isNew: false,
    highlights: [
      'Ghi nhận đầy đủ thành phần tham dự, ý kiến đóng góp và tỷ lệ biểu quyết tín nhiệm',
      'Đính kèm danh sách trích ngang nhân sự được hiệp thương giới thiệu'
    ]
  },
  {
    id: 'doc-6',
    code: 'Nghị quyết số 98/2023/QH15',
    title: 'Nghị quyết số 98/2023/QH15 về thí điểm một số cơ chế, chính sách đặc thù phát triển TP. Hồ Chí Minh',
    issueDate: '24/06/2023',
    agency: 'Quốc hội nước CHXHCN Việt Nam',
    summary: 'Nghị quyết của Quốc hội về cơ chế chính sách đặc thù, phân cấp quản lý và vai trò giám sát, phản biện xã hội của Mặt trận Tổ quốc.',
    category: 'Luật & Nghị quyết',
    driveUrl: OFFICIAL_DRIVE_FOLDER_URL,
    isNew: false,
    highlights: [
      'Tăng cường giám sát của MTTQ trong thực hiện các chính sách an sinh và dự án trọng điểm',
      'Phát huy quyền làm chủ của nhân dân và vai trò phản biện xã hội ở cơ sở'
    ]
  },
  {
    id: 'doc-7',
    code: 'Mẫu 02/PH-KDC',
    title: 'Phiếu lấy ý kiến sự hài lòng của người dân về kết quả xây dựng đô thị văn minh',
    issueDate: '05/03/2025',
    agency: 'Ban Thường trực UB.MTTQ VN Phường Bình Tiên',
    summary: 'Biểu mẫu phát cho các hộ gia đình tại 18 khu phố nhằm khảo sát mức độ hài lòng về môi trường và an ninh trật tự.',
    category: 'Biểu mẫu',
    driveUrl: OFFICIAL_DRIVE_FOLDER_URL,
    isNew: true,
    highlights: [
      'Bao gồm các tiêu chí đánh giá mức độ hài lòng của nhân dân',
      'Phương thức tổng hợp kết quả công khai, minh bạch'
    ]
  }
];

export const OFFICIAL_DOCUMENTS = INITIAL_DOCUMENTS;

const LOCAL_DOCS_KEY = 'mttq_documents_v2026';

/**
 * Lấy danh sách văn bản từ cache cục bộ
 */
export function getLocalDocuments(): OfficialDocument[] {
  try {
    const raw = localStorage.getItem(LOCAL_DOCS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[DocService] Lỗi đọc localStorage:', e);
  }
  return INITIAL_DOCUMENTS;
}

/**
 * Lưu danh sách văn bản vào cache cục bộ
 */
export function setLocalDocuments(docs: OfficialDocument[]): void {
  try {
    localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(docs));
  } catch (e) {
    console.warn('[DocService] Lỗi ghi localStorage:', e);
  }
}

/**
 * Tải danh sách văn bản từ Supabase (bảng documents), tự động đồng bộ cache
 */
export async function fetchDocuments(): Promise<OfficialDocument[]> {
  const localList = getLocalDocuments();
  const supabase = getSupabase();

  if (!supabase) {
    return localList;
  }

  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[DocService] Supabase query documents error (dùng local cache):', error.message);
      return localList;
    }

    if (data && data.length > 0) {
      const formatted: OfficialDocument[] = data.map((item: any) => ({
        id: String(item.id || `doc-${Date.now()}`),
        code: item.code || item.so_hieu || '',
        title: item.title || item.tieu_de || 'Văn bản',
        issueDate: item.release_date || item.issue_date || item.ngay_ban_hanh || item.issueDate || '',
        agency: item.agency || item.co_quan || 'Ban Thường trực UB.MTTQ VN Phường Bình Tiên',
        summary: item.summary || item.trich_yeu || item.noi_dung || '',
        category: item.category || item.danh_muc || 'Văn bản',
        driveUrl: item.download_url || item.file_url || item.drive_url || item.driveUrl || OFFICIAL_DRIVE_FOLDER_URL,
        highlights: Array.isArray(item.highlights) ? item.highlights : [],
        isNew: Boolean(item.is_new ?? item.isNew),
        created_at: item.created_at
      }));

      // Hợp nhất dữ liệu mới nhất với cache
      setLocalDocuments(formatted);
      return formatted;
    }

    return localList;
  } catch (err) {
    console.warn('[DocService] Ngoại lệ khi fetch documents từ Supabase:', err);
    return localList;
  }
}

/**
 * Lưu văn bản mới vào Supabase (bảng documents) và cập nhật cache cục bộ
 */
export async function saveDocument(docInput: {
  title: string;
  code?: string;
  issueDate: string;
  agency?: string;
  summary: string;
  category: string;
  driveUrl?: string;
}): Promise<{ success: boolean; data?: OfficialDocument; message: string }> {
  const newDoc: OfficialDocument = {
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    code: docInput.code?.trim() || 'VB-MTTQ',
    title: docInput.title.trim(),
    issueDate: docInput.issueDate.trim(),
    agency: docInput.agency?.trim() || 'Ban Thường trực UB.MTTQ VN Phường Bình Tiên',
    summary: docInput.summary.trim(),
    category: docInput.category.trim() || 'Văn bản',
    driveUrl: docInput.driveUrl?.trim() || OFFICIAL_DRIVE_FOLDER_URL,
    isNew: true,
    created_at: new Date().toISOString()
  };

  // 1. Cập nhật ngay vào local cache để phản hồi tức thì
  const currentLocal = getLocalDocuments();
  const updatedLocal = [newDoc, ...currentLocal.filter(d => d.id !== newDoc.id)];
  setLocalDocuments(updatedLocal);

  // 2. Thử ghi vào Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      // 1. Chuẩn hóa payload metadata văn bản thuần túy (< 0.5 KB, không blob/base64)
      // Thử insert theo chuẩn release_date, download_url
      const payloadReleaseDate: any = {
        title: newDoc.title,
        release_date: newDoc.issueDate,
        summary: newDoc.summary,
        category: newDoc.category,
        download_url: newDoc.driveUrl,
        code: newDoc.code,
        agency: newDoc.agency,
        is_new: true,
        created_at: newDoc.created_at
      };

      let res = await supabase
        .from('documents')
        .insert([payloadReleaseDate])
        .select()
        .single();

      // Nếu lỗi do tên cột không khớp, tự động fallback sang issue_date / drive_url
      if (res.error) {
        const payloadIssueDate: any = {
          title: newDoc.title,
          code: newDoc.code,
          issue_date: newDoc.issueDate,
          agency: newDoc.agency,
          summary: newDoc.summary,
          category: newDoc.category,
          drive_url: newDoc.driveUrl,
          is_new: true,
          created_at: newDoc.created_at
        };

        res = await supabase
          .from('documents')
          .insert([payloadIssueDate])
          .select()
          .single();
      }

      if (!res.error && res.data) {
        newDoc.id = String(res.data.id || newDoc.id);
        const refreshed = [newDoc, ...currentLocal.filter(d => d.id !== newDoc.id)];
        setLocalDocuments(refreshed);
        return {
          success: true,
          data: newDoc,
          message: 'Đã lưu văn bản lên máy chủ Supabase thành công!'
        };
      } else if (res.error) {
        console.warn('[DocService] Lỗi insert documents trên Supabase:', res.error.message);
      }
    } catch (err) {
      console.warn('[DocService] Ngoại lệ khi insert documents vào Supabase:', err);
    }
  }

  return {
    success: true,
    data: newDoc,
    message: 'Đã lưu văn bản vào hệ thống thành công!'
  };
}

/**
 * Xóa văn bản (dành cho Admin)
 */
export async function deleteDocument(docId: string): Promise<{ success: boolean; message: string }> {
  const currentLocal = getLocalDocuments();
  const updated = currentLocal.filter(d => d.id !== docId);
  setLocalDocuments(updated);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('documents').delete().eq('id', docId);
    } catch (err) {
      console.warn('[DocService] Lỗi khi xóa document trên Supabase:', err);
    }
  }

  return {
    success: true,
    message: 'Đã xóa văn bản thành công'
  };
}

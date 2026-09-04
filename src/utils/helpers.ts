import { Personnel } from '../types';

export function removeVietnameseTones(input: any): string {
  const str = String(input || '');
  if (!str) return '';
  let result = str;
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  result = result.replace(/đ/g, 'd');
  result = result.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  result = result.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  result = result.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  result = result.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  result = result.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  result = result.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  result = result.replace(/Đ/g, 'D');
  return result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function isChuyenVien(p: Personnel): boolean {
  if (!p) return false;
  const cd = removeVietnameseTones(p.chucDanhMatTran || '').toLowerCase().trim();
  const cdk = removeVietnameseTones(p.chucDanhKhac || '').toLowerCase().trim();
  const id = String(p.id || '').toLowerCase();
  
  if (id.startsWith('cv-')) return true;
  return cd.includes('chuyen vien') || cdk.includes('chuyen vien');
}

export function isBanThuongTruc(p: Personnel): boolean {
  if (isChuyenVien(p)) return false;
  if (String(p.khuPho || '') === 'Ban Thường trực' || String(p.id || '').startsWith('btt-')) return true;
  const cd = removeVietnameseTones(p.chucDanhMatTran || '').toLowerCase();
  return cd.includes('chu tich') || cd.includes('thuong truc');
}

export function isKeyLeader(p: Personnel): boolean {
  if (isBanThuongTruc(p) || isChuyenVien(p)) return false;
  const cd = removeVietnameseTones(p.chucDanhMatTran || '').trim().toLowerCase();
  const isTruong = cd === 'truong ban' || cd === 'tb' || cd === 'truong ban ctmt' || cd.startsWith('truong ban') || (cd.startsWith('truong') && !cd.includes('chi hoi'));
  const isPho = cd.includes('pho') || cd.includes('p.') || cd.startsWith('p ');
  return isTruong && !isPho;
}

export function isDeputyLeader(p: Personnel): boolean {
  if (isBanThuongTruc(p) || isChuyenVien(p)) return false;
  const cd = removeVietnameseTones(p.chucDanhMatTran || '').trim().toLowerCase();
  return (
    cd.includes('pho') ||
    cd.includes('p.') ||
    cd.startsWith('p ')
  );
}

export function isPartyOfficial(p: Personnel): boolean {
  if (isBanThuongTruc(p) || isChuyenVien(p)) return false;
  if (isKeyLeader(p)) return false;
  if (isDeputyLeader(p)) return false;

  const cdk = removeVietnameseTones(p.chucDanhKhac || '').toLowerCase();
  const cd = removeVietnameseTones(p.chucDanhMatTran || '').toLowerCase();

  // Exclude Youth Union (Chi đoàn Thanh niên)
  if (cdk.includes('chi doan') || cdk.includes('thanh nien') || cd.includes('chi doan')) {
    return false;
  }

  if (p.isCapUy === true) return true;

  const combined = `${cd} ${cdk}`;
  return (
    combined.includes('dai dien cap uy') ||
    combined.includes('cap uy') ||
    combined.includes('chi uy') ||
    combined.includes('chi bo') ||
    combined.includes('dang uy') ||
    combined.includes('bi thu')
  );
}

export function isThanhVien(p: Personnel): boolean {
  if (isBanThuongTruc(p) || isChuyenVien(p)) return false;
  return !isKeyLeader(p) && !isDeputyLeader(p) && !isPartyOfficial(p);
}

export function formatPhoneNumber(phoneInput: any): string {
  const phone = String(phoneInput || '');
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function getZaloLink(phoneInput: any): string {
  const phone = String(phoneInput || '');
  const cleaned = phone.replace(/\D/g, '');
  return `https://zalo.me/${cleaned}`;
}

export function getTelLink(phoneInput: any): string {
  const phone = String(phoneInput || '');
  const cleaned = phone.replace(/\D/g, '');
  return `tel:${cleaned}`;
}

export function getSmsLink(phoneInput: any): string {
  const phone = String(phoneInput || '');
  const cleaned = phone.replace(/\D/g, '');
  return `sms:${cleaned}`;
}

export function getGoogleMapsDirLink(addressInput: any): string {
  const address = String(addressInput || '');
  const fullAddress = address.includes('Phường Bình Tiên')
    ? (address.includes('TP.') || address.includes('Hồ Chí Minh') || address.includes('TP.HCM') ? address : `${address}, TP. Hồ Chí Minh`)
    : `${address}, Phường Bình Tiên, TP. Hồ Chí Minh`;
  const encodedAddress = encodeURIComponent(fullAddress);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
}

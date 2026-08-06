import { Personnel } from '../types';

export function removeVietnameseTones(str: string): string {
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

export function isKeyLeader(p: Personnel): boolean {
  const cd = removeVietnameseTones(p.chucDanhMatTran || '').toLowerCase();
  const cdk = removeVietnameseTones(p.chucDanhKhac || '').toLowerCase();
  const isTruong = cd.includes('truong') || cd.includes('tb') || cdk.includes('truong ban');
  const isPho = cd.includes('pho') || cd.includes('p.') || cd.startsWith('p ');
  return isTruong && !isPho;
}

export function isDeputyLeader(p: Personnel): boolean {
  const cd = removeVietnameseTones(p.chucDanhMatTran || '').toLowerCase();
  const cdk = removeVietnameseTones(p.chucDanhKhac || '').toLowerCase();
  return cd.includes('pho') || cd.includes('p.') || cd.startsWith('p ') || cdk.includes('pho ban') || cdk.includes('pho truong ban');
}

export function isPartyOfficial(p: Personnel): boolean {
  if (p.isCapUy === true) return true;
  const cd = removeVietnameseTones(p.chucDanhMatTran || '').toLowerCase();
  const cdk = removeVietnameseTones(p.chucDanhKhac || '').toLowerCase();
  const combined = `${cd} ${cdk}`;
  return (
    combined.includes('cap uy') ||
    combined.includes('chi uy') ||
    combined.includes('bi thu') ||
    combined.includes('pho bi thu')
  );
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function getZaloLink(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  return `https://zalo.me/${cleaned}`;
}

export function getTelLink(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  return `tel:${cleaned}`;
}

export function getSmsLink(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  return `sms:${cleaned}`;
}

export function getGoogleMapsDirLink(address: string): string {
  const fullAddress = address.includes('Phường Bình Tiên')
    ? (address.includes('TP.') || address.includes('Hồ Chí Minh') || address.includes('TP.HCM') ? address : `${address}, TP. Hồ Chí Minh`)
    : `${address}, Phường Bình Tiên, TP. Hồ Chí Minh`;
  const encodedAddress = encodeURIComponent(fullAddress);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
}

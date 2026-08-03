import { isSafeReturnUrl } from './return-url.util';

describe('isSafeReturnUrl', () => {
  it('accepts an internal application path', () => {
    expect(isSafeReturnUrl('/app/home')).toBe(true);
    expect(isSafeReturnUrl('/app/shipments?tab=open')).toBe(true);
  });

  it('rejects a missing or empty value', () => {
    expect(isSafeReturnUrl(null)).toBe(false);
    expect(isSafeReturnUrl(undefined)).toBe(false);
    expect(isSafeReturnUrl('')).toBe(false);
    expect(isSafeReturnUrl('   ')).toBe(false);
  });

  it('rejects absolute URLs', () => {
    expect(isSafeReturnUrl('https://evil.example.com/phish')).toBe(false);
    expect(isSafeReturnUrl('http://evil.example.com')).toBe(false);
  });

  it('rejects protocol-relative URLs', () => {
    expect(isSafeReturnUrl('//evil.example.com')).toBe(false);
  });

  it('rejects backslash-based tricks', () => {
    expect(isSafeReturnUrl('/\\evil.example.com')).toBe(false);
    expect(isSafeReturnUrl('\\/evil.example.com')).toBe(false);
  });

  it('rejects javascript-like URLs', () => {
    expect(isSafeReturnUrl('javascript:alert(1)')).toBe(false);
  });
});

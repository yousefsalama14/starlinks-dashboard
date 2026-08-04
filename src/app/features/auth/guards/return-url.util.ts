/**
 * Only ever accept an internal, same-origin path. Rejects absolute URLs,
 * protocol-relative URLs (`//evil.com`), backslash tricks some browsers
 * normalize into protocol-relative URLs, and anything that doesn't resolve
 * to this app's own origin (which also rules out `javascript:`-style values,
 * since those never start with `/`).
 */
export function isSafeReturnUrl(url: string | null | undefined): url is string {
  if (!url) {
    return false;
  }
  const candidate = url.trim();
  if (candidate.length === 0) {
    return false;
  }
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return false;
  }

  try {
    return new URL(candidate, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}

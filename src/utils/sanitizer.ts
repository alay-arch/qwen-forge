/** Sanitizer — removes sensitive data from logs */

const SENSITIVE_PATTERNS = [
  { pattern: /(password["\s:=]+)([^\s"',}]+)/gi, replacement: '$1***' },
  { pattern: /(pass["\s:=]+)([^\s"',}]+)/gi, replacement: '$1***' },
  { pattern: /(pwd["\s:=]+)([^\s"',}]+)/gi, replacement: '$1***' },
  { pattern: /(token["\s:=]+)([^\s"',}]+)/gi, replacement: '$1***' },
  { pattern: /(api[_-]?key["\s:=]+)([^\s"',}]+)/gi, replacement: '$1***' },
  { pattern: /(secret["\s:=]+)([^\s"',}]+)/gi, replacement: '$1***' },
  { pattern: /(bearer\s+)([^\s"',}]+)/gi, replacement: '$1***' },
  { pattern: /(cookie["\s:=]+)([^\s"',}]+)/gi, replacement: '$1***' },
  { pattern: /(set-cookie["\s:=]+)([^\s"',}]+)/gi, replacement: '$1***' },
  { pattern: /(https?:\/\/[^\s]*\/(?:verify|activate|confirm)[^\s]*)/gi, replacement: '[VERIFICATION_LINK]' },
  { pattern: /(authorization["\s:=]+)([^\s"',}]+)/gi, replacement: '$1***' },
];

export function sanitize(text: string): string {
  let result = text;
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitize(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('password') || lowerKey.includes('secret') ||
          lowerKey.includes('token') || lowerKey.includes('cookie') ||
          lowerKey.includes('authorization')) {
        sanitized[key] = '***';
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    return sanitized;
  }
  return obj;
}

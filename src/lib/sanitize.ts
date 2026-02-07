/**
 * Basic HTML sanitizer to prevent XSS
 * Helper function to replace the missing shared/lib/sanitize
 */

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Basic sanitization: remove script tags and on* attributes
  // Note: For production use with user-generated content, 
  // we should use a library like isomorphic-dompurify
  return html
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
    .replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, "")
    .replace(/\son\w+="[^"]*"/g, "")
    .replace(/javascript:/gim, "");
}

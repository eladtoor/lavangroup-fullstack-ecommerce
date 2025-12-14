/**
 * Strip HTML tags from a string
 */
export const stripHtml = (html: string): string => {
  if (!html) return '';

  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  const textarea = typeof document !== 'undefined' ? document.createElement('textarea') : null;
  if (textarea) {
    textarea.innerHTML = text;
    return textarea.value;
  }

  // Fallback for server-side
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

/**
 * Truncate text to a specified length and add ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';

  const cleanText = stripHtml(text);

  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  return cleanText.substring(0, maxLength).trim() + '...';
};

/**
 * Clean and truncate description for product cards
 */
export const cleanDescription = (description: string | undefined, maxLength: number = 80): string => {
  if (!description) return '';
  return truncateText(description, maxLength);
};

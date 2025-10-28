/**
 * Clean and normalize text with special characters
 */
export const cleanText = (text) => {
  if (!text || typeof text !== "string") return text;

  return (
    text
      // Fix Windows-1252 to UTF-8 conversion issues
      .replace(/â€"/g, "–") // en-dash
      .replace(/â€"/g, "—") // em-dash
      .replace(/â€™/g, "'") // apostrophe
      .replace(/â€œ/g, '"') // left double quote
      .replace(/â€/g, '"') // right double quote
      .replace(/â€¦/g, "...") // ellipsis
      .replace(/Â /g, " ") // non-breaking space
      .replace(/Â/g, "") // stray Â
      .replace(/�/g, "–") // replacement character
      // Normalize various dashes
      .replace(/[\u2013\u2014]/g, "–") // en-dash, em-dash to standard dash
      // Remove zero-width characters
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
  );
};

/**
 * Recursively clean all strings in an object
 */
export const cleanObject = (obj) => {
  if (typeof obj === "string") {
    return cleanText(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, cleanObject(value)])
    );
  }
  return obj;
};

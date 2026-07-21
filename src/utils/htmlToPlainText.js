function stripHtmlTags(input) {
  const text = [];
  let tag = "";

  for (const char of input) {
    if (char === "<") {
      tag = char;
      continue;
    }

    if (tag) {
      tag += char;
      if (char === ">") {
        tag = "";
      }
      continue;
    }

    text.push(char);
  }

  return text.join("") + tag;
}

/**
 * Convert HTML-ish content to plain text with sensible line breaks.
 */
export function htmlToPlainText(input) {
  if (!input || typeof input !== "string") {
    return input;
  }

  return stripHtmlTags(
    input
      .replace(/<(?:br|hr)\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|div|li|h[1-6]|tr|blockquote)>/gi, "\n")
  )
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\r\n/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

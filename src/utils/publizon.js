// --- helpers ---
export const forceHttpsAndStripQa = (u) => {
  if (!u || typeof u !== "string" || !u.trim()) return null;
  const hasProto = /^(https?:)?\/\//i.test(u);
  const url = new URL(u, hasProto ? undefined : "https://x");

  // remove 'qa' labels in host
  url.hostname = url.hostname
    .split(".")
    .filter((l) => l.toLowerCase() !== "qa")
    .join(".");

  // force https
  url.protocol = "https:";
  return url.toString();
};

export const extFromUrl = (u) => {
  if (!u || typeof u !== "string") return null;
  try {
    const hasProto = /^(https?:)?\/\//i.test(u);
    const url = new URL(u, hasProto ? undefined : "https://x");
    const p = url.pathname || "";
    const i = p.lastIndexOf(".");
    if (i < 0) return null;
    return p.slice(i + 1).toLowerCase(); // fx 'epub', 'mp3'
  } catch {
    return null;
  }
};

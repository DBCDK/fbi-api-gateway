export function parseEnvironments(value = "[]") {
  try {
    const items = JSON.parse(value);
    if (!Array.isArray(items)) return [];
    return items.filter((item) => {
      try {
        const url = new URL(item.url);
        return typeof item.name === "string" && item.name.trim() &&
          ["http:", "https:"].includes(url.protocol) && !url.username &&
          !url.password && url.pathname === "/" && !url.search && !url.hash;
      } catch { return false; }
    }).map(({ name, url }) => ({ name, url: new URL(url).origin }));
  } catch { return []; }
}

export function localReturnTo(value) {
  if (typeof value !== "string" || !value.startsWith("/") ||
      value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return "/documentation";
  const url = new URL(value, "https://local.invalid");
  if (url.origin !== "https://local.invalid" || url.pathname.startsWith("/token/") ||
      url.pathname.startsWith("/api/")) return "/documentation";
  return url.pathname + url.search + url.hash;
}

export function environmentHref(origin, currentHref, credential) {
  const current = new URL(currentHref);
  const path = localReturnTo(current.pathname + current.search + current.hash);
  const target = new URL(path, origin);
  ["clientId", "agency", "profile"].forEach((key) => target.searchParams.delete(key));
  if (credential?.clientId) {
    ["clientId", "agency", "profile"].forEach((key) => {
      if (credential[key]) target.searchParams.set(key, credential[key]);
    });
  }
  return target.href;
}

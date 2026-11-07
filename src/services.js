import config from "./config";

function sanitizeUrl(value) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }
    url.username = "";
    url.password = "";
    url.hash = "";
    // Query values can contain credentials under arbitrary parameter names.
    for (const key of new Set(url.searchParams.keys())) {
      if (url.searchParams.getAll(key).some((value) => value !== "")) {
        url.searchParams.set(key, "[REDACTED]");
      }
    }
    return url.toString();
  } catch {
    // Never echo an invalid URL: it may still contain credentials.
    return null;
  }
}

export function getServices(datasources) {
  const teams = new Map();
  for (const name of Object.keys(datasources).sort((a, b) => a.localeCompare(b))) {
    const datasource = datasources[name];
    const urls = {};
    for (const field of ["url", "soap_url"]) {
      if (typeof datasource[field] === "string" && datasource[field]) {
        urls[field] = sanitizeUrl(datasource[field]);
      }
    }
    if (!Object.keys(urls).length) {
      continue;
    }
    const teamLabel = datasource.teamLabel || "unknown";
    const service = { name, urls };
    if ("enabled" in datasource || "disabled" in datasource) {
      service.enabled =
        ("enabled" in datasource ? Boolean(datasource.enabled) : true) &&
        !datasource.disabled;
    }
    if (!teams.has(teamLabel)) {
      teams.set(teamLabel, []);
    }
    teams.get(teamLabel).push(service);
  }
  return Object.fromEntries(
    [...teams.entries()].sort(([a], [b]) => a.localeCompare(b))
  );
}

export default function services(_req, res) {
  res.set("Cache-Control", "no-store");
  res.json(getServices(config.datasources));
}

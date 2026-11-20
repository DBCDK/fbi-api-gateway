import crypto from "crypto";
import ipaddr from "ipaddr.js";
import geoip from "geoip-lite";

// Address types that belong to real devices on the internet, as opposed to
// addresses that only exist inside a company or home network (or on the server itself).
// Names are ipaddr.js range types: "unicast" is regular public addresses,
// "6to4" and "teredo" are public IPv6 addresses tunneling IPv4 traffic.
const PUBLIC_RANGES = ["unicast", "6to4", "teredo"];

function parse(ip) {
  if (!ip || !ipaddr.isValid(ip)) {
    return null;
  }
  // Servers sometimes write a regular IPv4 address in IPv6 format (::ffff:1.2.3.4),
  // process() converts it back to plain IPv4, so both formats are treated the same
  return ipaddr.process(ip);
}

// Writes the address as one long uppercase hex string, e.g. 203.0.113.42 -> "CB00712A"
function toHex(addr) {
  return addr
    .toByteArray()
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/**
 * Checks if an ip belongs to a device on the public internet,
 * as opposed to an internal address (e.g. 10.x.x.x, 192.168.x.x or 127.0.0.1)
 * which only identifies a machine inside a private network.
 *
 * Technically: false for private, loopback, link-local, unique-local and reserved ranges.
 */
function isPublicIp(ip) {
  const addr = parse(ip);
  return !!addr && PUBLIC_RANGES.includes(addr.range());
}

/**
 * Finds the end user ip in a list of ips.
 *
 * When a request passes through proxies, load balancers or a client's own server
 * (e.g. a CMS calling us server-side), each step adds an ip to the list.
 * The first entry is the original sender, but internal network addresses
 * can appear along the way, so we pick the first one that is public.
 *
 * Technically: the list is the X-Forwarded-For chain (req.ips with "trust proxy" enabled).
 */
export function findPublicIp(ips = []) {
  return ips.find(isPublicIp) || null;
}

/**
 * Anonymizes an ip by hiding its last part, so it no longer points to a single
 * user, but to a larger area/network (thousands of addresses share the same result).
 * Keeping the first part still lets us group requests coming from the same network.
 *
 * Technically: IPv4 is masked to /20 (keeps 5 of 8 hex chars, hides 4096 addresses),
 * IPv6 is masked to /80 (keeps 20 of 32 hex chars).
 *
 * @example maskIp("203.0.113.42") // "CB007XXX"
 * @example maskIp("2001:db8:85a3::8a2e:370:7334") // "20010DB885A300000000XXXXXXXXXXXX"
 */
function maskIp(ip) {
  const addr = parse(ip);
  if (!addr) {
    return null;
  }
  const hex = toHex(addr);
  const keep = addr.kind() === "ipv4" ? 5 : 20;
  return hex.slice(0, keep) + "X".repeat(hex.length - keep);
}

/**
 * Anonymizes an ip (see maskIp) and turns it into an unreadable fingerprint.
 * The same network always gives the same fingerprint, so requests can still be grouped,
 * but the original network cannot be read from it.
 *
 * The salt is a secret mixed into the fingerprint. Without it, anyone could compute the
 * fingerprint of every possible masked ip (there are only ~1 million IPv4 networks)
 * and look up which network a fingerprint belongs to. Returns null if no salt is given.
 *
 * Technically: HMAC-SHA256 of the masked ip, with the salt as key.
 */
export function hashMaskedIp(ip, salt) {
  const masked = maskIp(ip);
  if (!masked || !salt) {
    return null;
  }
  return crypto.createHmac("sha256", salt).update(masked).digest("hex");
}

/**
 * Returns the country an ip is registered in, as a two letter code, e.g. "DK".
 * Returns null for internal or unknown ips.
 *
 * Technically: ISO 3166-1 alpha-2 code, looked up in the bundled geoip-lite database.
 */
export function getIpCountry(ip) {
  const addr = parse(ip);
  if (!addr) {
    return null;
  }
  return geoip.lookup(addr.toString())?.country || null;
}

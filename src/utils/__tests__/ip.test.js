import crypto from "crypto";
import { findPublicIp, getIpCountry, hashMaskedIp } from "../ip";

function expectedHash(masked, salt = "salt") {
  return crypto.createHmac("sha256", salt).update(masked).digest("hex");
}

describe("hashMaskedIp", () => {
  test("masks IPv4 to /20 before hashing", () => {
    expect(hashMaskedIp("203.0.113.42", "salt")).toBe(expectedHash("CB007XXX"));
  });

  test("masks IPv6 to /80 before hashing", () => {
    expect(hashMaskedIp("2001:db8:85a3::8a2e:370:7334", "salt")).toBe(
      expectedHash("20010DB885A300000000XXXXXXXXXXXX")
    );
  });

  test("treats IPv4-mapped IPv6 as IPv4", () => {
    expect(hashMaskedIp("::ffff:203.0.113.42", "salt")).toBe(
      expectedHash("CB007XXX")
    );
  });

  test("ips in the same /20 get the same hash", () => {
    expect(hashMaskedIp("203.0.112.0", "salt")).toBe(
      hashMaskedIp("203.0.127.255", "salt")
    );
    expect(hashMaskedIp("203.0.111.255", "salt")).not.toBe(
      hashMaskedIp("203.0.112.0", "salt")
    );
  });

  test("hash depends on salt", () => {
    expect(hashMaskedIp("203.0.113.42", "other-salt")).not.toBe(
      hashMaskedIp("203.0.113.42", "salt")
    );
  });

  test("returns null without salt or valid ip", () => {
    expect(hashMaskedIp("203.0.113.42", undefined)).toBeNull();
    expect(hashMaskedIp(null, "salt")).toBeNull();
    expect(hashMaskedIp("not-an-ip", "salt")).toBeNull();
  });
});

describe("findPublicIp", () => {
  test("returns first public ip in chain", () => {
    expect(findPublicIp(["10.0.0.1", "8.8.8.8", "1.1.1.1"])).toBe("8.8.8.8");
    expect(findPublicIp(["::ffff:8.8.8.8"])).toBe("::ffff:8.8.8.8");
    expect(findPublicIp(["2a00:1450:4001::1"])).toBe("2a00:1450:4001::1");
  });

  test("skips internal and invalid ips", () => {
    expect(
      findPublicIp([
        "10.0.0.1",
        "172.16.5.4",
        "192.168.1.1",
        "127.0.0.1",
        "::1",
        "fe80::1",
        "fd00::1",
        "::ffff:10.0.0.1",
        "not-an-ip",
      ])
    ).toBeNull();
  });

  test("handles missing list", () => {
    expect(findPublicIp(undefined)).toBeNull();
  });
});

describe("getIpCountry", () => {
  test("returns country code", () => {
    expect(getIpCountry("8.8.8.8")).toBe("US");
    expect(getIpCountry("::ffff:8.8.8.8")).toBe("US");
  });

  test("returns null for unknown or invalid ips", () => {
    expect(getIpCountry("10.0.0.1")).toBeNull();
    expect(getIpCountry(undefined)).toBeNull();
  });
});

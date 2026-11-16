import { environmentHref, localReturnTo, parseEnvironments } from "../environmentNavigation";

test("environment switch preserves page, query and anchor with the selected client", () => {
  const url = new URL(environmentHref("https://test.example", "https://prod.example/documentation?query=hello&clientId=old#section", { clientId: "new", agency: "123", profile: "test" }));
  expect(url.origin).toBe("https://test.example");
  expect(url.pathname).toBe("/documentation");
  expect(url.hash).toBe("#section");
  expect(url.searchParams.get("query")).toBe("hello");
  expect(url.searchParams.get("clientId")).toBe("new");
  expect(url.searchParams.get("agency")).toBe("123");
});
test("does not transfer a token route", () => {
  expect(environmentHref("https://test.example", "https://prod.example/token/secret", { token: "secret" })).toBe("https://test.example/documentation");
});
test.each(["https://evil.example", "//evil.example", "/\\evil.example"])("rejects unsafe return destination %s", (value) => {
  expect(localReturnTo(value)).toBe("/documentation");
});
test("accepts a local destination with query and anchor", () => {
  expect(localReturnTo("/documentation?query=x#section")).toBe("/documentation?query=x#section");
});
test("accepts only named HTTP origins", () => {
  expect(parseEnvironments(JSON.stringify([{ name: "Test", url: "http://test.example/" }, { name: "Bad", url: "javascript:alert(1)" }]))).toEqual([{ name: "Test", url: "http://test.example" }]);
  expect(parseEnvironments("broken")).toEqual([]);
});

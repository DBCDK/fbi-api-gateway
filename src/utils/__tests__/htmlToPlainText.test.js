import { htmlToPlainText } from "../htmlToPlainText";

describe("htmlToPlainText", () => {
  test("returns input unchanged for empty or non-string values", () => {
    expect(htmlToPlainText(null)).toBeNull();
    expect(htmlToPlainText(undefined)).toBeUndefined();
    expect(htmlToPlainText("")).toBe("");
  });

  test("strips tags and preserves line breaks from block elements", () => {
    const html = "<p>First paragraph.</p><p>Second paragraph.</p>";
    expect(htmlToPlainText(html)).toBe("First paragraph.\nSecond paragraph.");
  });

  test("strips infomedia paragraph tags with id attributes", () => {
    const html =
      '<p id="p54">Nye lækkede efterretningsrapporter.</p><p id="p55">De knap 15.000 efterretningsrapporter.</p>';
    expect(htmlToPlainText(html)).toBe(
      "Nye lækkede efterretningsrapporter.\nDe knap 15.000 efterretningsrapporter."
    );
  });

  test("converts br tags to new lines", () => {
    const html = "Line one<br>Line two<br/>Line three";
    expect(htmlToPlainText(html)).toBe("Line one\nLine two\nLine three");
  });

  test("decodes common html entities", () => {
    const html = "<p>Tom &amp; Jerry &lt;3 &nbsp;hej</p>";
    expect(htmlToPlainText(html)).toBe("Tom & Jerry <3 hej");
  });

  test("leaves plain text unchanged", () => {
    const text = "Already plain text.\nWith a newline.";
    expect(htmlToPlainText(text)).toBe(text);
  });
});

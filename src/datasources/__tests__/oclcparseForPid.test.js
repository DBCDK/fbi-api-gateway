import { parseForPid } from "../oclcNumberToPid.datasource";

test("Parse xml from ocn2Pid webservice", async () => {
  // test with 2 elements - one is an 870970 -
  let input =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><pidList xmlns="http://oss.dbc.dk/ns/oclc-integration/ocn2pid/20140320" resource="http://ocn2pid.addi.dk/ocn2pid/ocn-collection/1331325161"><pid value="870970-basis:62214856"><libraryNumber>870970</libraryNumber><format>basis</format><idNumber>62214856</idNumber></pid><pid value="800010-katalog:99124016573205763"><libraryNumber>800010</libraryNumber><format>katalog</format><idNumber>99124016573205763</idNumber></pid></pidList>';

  let actual = parseForPid(input);
  // we expect the 870970 manifestation
  let expected = "870970-basis:62214856";
  expect(actual).toEqual(expected);

  // test with many elements - one is an 870970 manifestation
  input = `
  <pidList xmlns="http://oss.dbc.dk/ns/oclc-integration/ocn2pid/20140320" resource="http://ocn2pid.addi.dk/ocn2pid/ocn-collection/213474154">
    <pid value="810015-katalog:001832182">
      <libraryNumber>810015</libraryNumber>
      <format>katalog</format>
      <idNumber>001832182</idNumber>
    </pid>
    <pid value="820010-katalog:659605">
      <libraryNumber>820010</libraryNumber>
      <format>katalog</format>
      <idNumber>659605</idNumber>
    </pid>
    <pid value="830190-katalog:22281399">
      <libraryNumber>830190</libraryNumber>
      <format>katalog</format>
      <idNumber>22281399</idNumber>
    </pid>
    <pid value="861620-katalog:22281399">
      <libraryNumber>861620</libraryNumber>
      <format>katalog</format>
      <idNumber>22281399</idNumber>
    </pid>
    <pid value="870970-basis:22281399">
      <libraryNumber>870970</libraryNumber>
      <format>basis</format>
      <idNumber>22281399</idNumber>
    </pid>
    <pid value="820030-katalog:365589">
      <libraryNumber>820030</libraryNumber>
      <format>katalog</format>
      <idNumber>365589</idNumber>
    </pid>
    <pid value="800010-katalog:99122635927805763">
      <libraryNumber>800010</libraryNumber>
      <format>katalog</format>
      <idNumber>99122635927805763</idNumber>
    </pid>
    <pid value="800010-katalog:99122410291705763">
      <libraryNumber>800010</libraryNumber>
      <format>katalog</format>
      <idNumber>99122410291705763</idNumber>
    </pid>
  </pidList>`;
  actual = parseForPid(input);
  // we expect the 870970 manifestation
  expected = "870970-basis:22281399";
  expect(actual).toEqual(expected);

  // test with more 870970-manifestations
  input = `
  <pidList xmlns="http://oss.dbc.dk/ns/oclc-integration/ocn2pid/20140320" resource="http://ocn2pid.addi.dk/ocn2pid/ocn-collection/213474154">    
    <pid value="870970-basis:22281399">
      <libraryNumber>870970</libraryNumber>
      <format>basis</format>
      <idNumber>22281399</idNumber>
    </pid>
    <pid value="820030-katalog:365589">
      <libraryNumber>820030</libraryNumber>
      <format>katalog</format>
      <idNumber>365589</idNumber>
    </pid>
    <pid value="870970-basis:2228139676">
      <libraryNumber>870970</libraryNumber>
      <format>basis</format>
      <idNumber>22281399</idNumber>
    </pid>
    <pid value="800010-katalog:99122635927805763">
      <libraryNumber>800010</libraryNumber>
      <format>katalog</format>
      <idNumber>99122635927805763</idNumber>
    </pid>
  </pidList>`;
  actual = parseForPid(input);
  // we expect the first 870970 manifestation
  expected = "870970-basis:22281399";
  expect(actual).toEqual(expected);

  // no 870970 manifestation
  input = `
  <pidList xmlns="http://oss.dbc.dk/ns/oclc-integration/ocn2pid/20140320" resource="http://ocn2pid.addi.dk/ocn2pid/ocn-collection/213474154">
    <pid value="810015-katalog:001832182">
      <libraryNumber>810015</libraryNumber>
      <format>katalog</format>
      <idNumber>001832182</idNumber>
    </pid>
    <pid value="820010-katalog:659605">
      <libraryNumber>820010</libraryNumber>
      <format>katalog</format>
      <idNumber>659605</idNumber>
    </pid>
  </pidList>`;

  actual = parseForPid(input);
  // we expect the first  manifestation
  expected = "810015-katalog:001832182";
  expect(actual).toEqual(expected);

  // empty input
  input = `<pidList xmlns="http://oss.dbc.dk/ns/oclc-integration/ocn2pid/20140320" resource="http://ocn2pid.addi.dk/ocn2pid/ocn-collection/21347415"/>`;
  actual = parseForPid(input);
  // we expect null
  expected = null;
  expect(actual).toEqual(expected);
});

export { teamLabel };

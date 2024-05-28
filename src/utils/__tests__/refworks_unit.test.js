import { parseResponse } from "../../datasources/refworks.datasource";

const response = {
  body: {
    objects: [
      {
        refWorks: [
          {
            formatted:
              "RT Book, Whole\nSR Print(0)\nID 870970-basis:55132194\nA1 Steincke, Viggo\nT1 Børnegrisene og det mega store monster\nYR 2018\nSP 40 sider\nK1 grise\nK1 mørke\nK1 bange\nK1 mørkeræd\nK1 for 3 år\nK1 for 4 år\nK1 for 5 år\nK1 for 6 år\nK1 for højtlæsning\nAB Billedbog. Barneøffe og Barnegrynte er på skovtur, da de møder Fru Gammelgris, som har mistet et sølvbæger. De små grise lover at lede efter det i en grotte. Der ser de en kæmpe skygge på væggen, som de tror er et monster\n\nED 1. udgave\nPB Højer\nPP Ꜳlborg\nSN 9788792102607\nLA dan\nCL 86-096\nCL sk\n",
            mediaType: "text/plain",
          },
        ],
      },
    ],
    trackingId: "some-uuid",
  },
};

// from old openformat
const reply =
  "RT Book, Whole\n" +
  "SR Print(0)\n" +
  "ID 870970-basis:55132194\n" +
  "A1 Steincke, Viggo\n" +
  "T1 Børnegrisene og det mega store monster\n" +
  "YR 2018\n" +
  "SP 40 sider\n" +
  "K1 grise\n" +
  "K1 mørke\n" +
  "K1 bange\n" +
  "K1 mørkeræd\n" +
  "K1 for 3 år\n" +
  "K1 for 4 år\n" +
  "K1 for 5 år\n" +
  "K1 for 6 år\n" +
  "K1 for højtlæsning\n" +
  "AB Billedbog. Barneøffe og Barnegrynte er på skovtur, da de møder Fru Gammelgris, som har mistet et sølvbæger. De små grise lover at lede efter det i en grotte. Der ser de en kæmpe skygge på væggen, som de tror er et monster\n" +
  "\n" +
  "ED 1. udgave\n" +
  "PB Højer\n" +
  "PP Ꜳlborg\n" +
  "SN 9788792102607\n" +
  "LA dan\n" +
  "CL 86-096\n" +
  "CL sk" +
  "\n";

test("formatObjectToRefwokrs", () => {
  const actual = parseResponse(response);
  expect(actual).toEqual(reply);
});
